# Bed Pro Invoice System

Branded invoice, receipt, and customer management for Bed Pro.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Supabase Postgres + Prisma 7 (pg driver adapter) · Auth.js v5 (NextAuth) · Puppeteer · Nodemailer.

---

## What it does

- **Login** — email + password, "remember me for 30 days", error messages, **no public registration**.
- **3 roles**:
  - `ADMIN` — full access, manages users & settings
  - `MANAGER` — all invoices/customers/products, no user management
  - `STAFF` — creates invoices only (and views their own)
- **Staff onboarding** — admin invites a user → system generates a crypto-random temporary password and emails it → user signs in, is forced to set their own password before they reach the app.
- **Invoices** — create, list, filter, mark sent/paid, email as branded PDF attachment, download/print PDF.
- **Auto-overdue** — never stored. Live-computed from `dueDate` on every render (`src/lib/status.ts → computeStatus`).
- **Receipts** — auto-generated when an invoice is marked paid. Separate sequence (`RCP-####`).
- **Account lockout** — 5 failed logins → 15-minute lockout. bcrypt cost 12.
- **No email enumeration** — credentials check does a dummy bcrypt compare when the user doesn't exist.

## Database schema (7 tables)

```
User                — id, email, name, passwordHash, role, branch,
                      isActive, mustChangePassword, lastLoginAt,
                      failedLoginCount, lockedUntil
Customer            — id, name, company, email, phone, address, notes, isActive
Product             — id, name, category, unitPrice, description, isActive
Invoice             — id, number (BP-####), customerId, status,
                      issueDate, dueDate, paidAt, taxRate, discount,
                      subtotal, discountAmt, taxAmount, total, notes,
                      emailedAt, createdById
InvoiceItem         — id, invoiceId, productId?, description, qty, unitPrice, lineTotal
Receipt             — id, number (RCP-####), invoiceId, amount,
                      paymentDate, method, reference, notes, createdById
CompanySettings     — singleton row, address/phone/email/VAT,
                      banking details, invoice & receipt counters
```

Stored `InvoiceStatus`: `DRAFT | UNPAID | SENT | PAID`. **`OVERDUE` is not stored** — it's computed live from `dueDate`. Priority: `PAID > DRAFT > overdue(auto) > SENT > UNPAID`.

## Authentication flow (Auth.js v5)

The config is split for Edge-runtime safety:

- **`src/lib/auth.config.ts`** — edge-safe: no DB, no bcrypt. Defines the `authorized` callback that gates every page (login redirect, first-login force, role-based routing).
- **`src/lib/auth.ts`** — full Node-side config with the Credentials provider that hits Postgres and bcrypts the password. Exports `{ handlers, auth, signIn, signOut }`.
- **`middleware.ts`** — runs `NextAuth(authConfig).auth` on every page request. Excludes `/api/*` (API routes do their own auth via `requireSession`).

Login flow:
1. `signIn('credentials', { email, password })` → `authorize()` in `auth.ts` validates with Zod, checks `isActive`, checks lockout, bcrypt-compares.
2. Failed attempts increment `failedLoginCount`. At 5 → 15-minute lockout (`lockedUntil`).
3. Success → 30-day JWT cookie. Token carries `{ id, role, branch, mustChangePassword }`.
4. Middleware reads the token at the edge (no DB hit per request).
5. If `mustChangePassword`, every page redirects to `/set-password`.
6. On `/set-password` submit → `POST /api/account/password` → bcrypt verify, complexity check, flip flag → `useSession().update()` refreshes the JWT → `/dashboard`.

## API routes (every handler does its own `requireSession()` / `requirePermission()`)

| Method | Path | Purpose | Min role |
|---|---|---|---|
| POST | `/api/auth/[...nextauth]` | Auth.js sign-in callback | — |
| GET / POST | `/api/customers` | list / create | STAFF |
| PATCH / DELETE | `/api/customers/[id]` | update / soft-delete | STAFF |
| GET / POST | `/api/products` | list / create | MANAGER |
| PATCH / DELETE | `/api/products/[id]` | update / soft-delete | MANAGER |
| GET / POST | `/api/invoices` | list (STAFF see own) / create (atomic numbering + server totals) | STAFF |
| GET / DELETE | `/api/invoices/[id]` | view (STAFF own) / delete | STAFF (own) / ADMIN |
| PATCH | `/api/invoices/[id]/status` | change status; → PAID auto-creates `Receipt` | MANAGER (to PAID) / MANAGER (else) |
| GET | `/api/invoices/[id]/pdf` | branded PDF (Puppeteer) | viewer |
| POST | `/api/invoices/[id]/email` | render PDF, email it, set `status=SENT` | MANAGER |
| GET | `/api/receipts/[id]/pdf` | branded receipt PDF | MANAGER |
| GET / POST | `/api/users` | list / invite (temp password emailed) | ADMIN |
| PATCH / DELETE | `/api/users/[id]` | activate, role/branch / soft-delete | ADMIN |
| POST | `/api/users/[id]/reset` | regenerate temp password and email | ADMIN |
| GET / PUT | `/api/settings` | get / update company settings | ADMIN |
| POST | `/api/account/password` | change own password | self |

## Environment variables

Three required to boot:

```dotenv
DATABASE_URL="postgresql://postgres.<ref>:<pass>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.<ref>:<pass>@aws-0-<region>.pooler.supabase.com:5432/postgres"
NEXTAUTH_SECRET="…"   # 32 bytes, base64
```

Optional:
- `NEXTAUTH_URL` (prod URL on Vercel)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (only for Storage uploads)
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `EMAIL_FROM` (for sending emails)
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` (consumed by `pnpm db:seed`)

## Local development

```bash
pnpm install
cp .env.example .env       # fill in DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET (and optionally SMTP_*)

pnpm prisma migrate deploy # applies all migrations in prisma/migrations/
pnpm db:seed               # creates admin + company settings + products
pnpm dev                   # → http://localhost:3000

pnpm test                  # vitest unit tests
pnpm typecheck             # tsc --noEmit
```

## Production deployment checklist

This is the order you should follow before flipping a domain at real customers.

### Pre-launch
- [ ] **Generate a fresh `NEXTAUTH_SECRET` for prod** (`openssl rand -base64 32`). Don't reuse the dev one.
- [ ] **Set `NEXTAUTH_URL`** to your live domain in Vercel env vars (e.g. `https://invoices.bedpro.org.za`).
- [ ] **SendGrid (or other SMTP)**: verify a sender, create an API key with `Mail Send` scope, paste as `SMTP_PASSWORD`. Without this, invite emails and customer-invoice emails do nothing.
- [ ] **Upstash Redis** (optional but recommended): create a database, paste `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`, then swap the stub in `src/lib/rate-limit.ts` for the documented Ratelimit.slidingWindow call. Wire it into `/api/auth/callback/credentials`, `/api/users` POST, `/api/users/[id]/reset`.
- [ ] **Sentry** (optional): create a Next.js project, paste `SENTRY_DSN`, run `pnpm dlx @sentry/wizard@latest -i nextjs`.
- [ ] **Vercel function size**: Puppeteer + `@sparticuz/chromium` is ~50MB. Hobby plan is at 50MB; if first deploy errors with size, upgrade to Pro or swap `src/lib/pdf.ts` to `@react-pdf/renderer`.

### Day of launch
- [ ] **Apply migrations**: `DATABASE_URL=<prod> DIRECT_URL=<prod> pnpm prisma migrate deploy`
- [ ] **Seed the first admin**: `pnpm db:seed` with `SEED_ADMIN_*` env vars set. Or insert via Supabase SQL editor.
- [ ] **Verify health**: `curl https://your-domain/api/health` should return `200 { status: 'ok', db: 'ok', smtp: 'configured' }`.
- [ ] **Smoke test the critical flow**: sign in → create customer → create invoice → mark paid → download PDF → email it to yourself.
- [ ] **Sign out as admin and verify the lockdown**: try `/users` as STAFF user, expect redirect to `/dashboard`.

### Post-launch (within 24h)
- [ ] **Verify backups**: Supabase free plan keeps 7 days of daily snapshots; paid plans give point-in-time recovery. Confirm via Dashboard → Database → Backups. Restore to a clone to test the procedure.
- [ ] **Set up uptime monitoring** against `/api/health` (Better Stack, UptimeRobot — both have free tiers).
- [ ] **Review the audit_log** table weekly for the first month. Anomalies surface fastest in the first 30 days.

### Security recap (what's in the box)
- bcrypt cost 12, 5-strike per-account lockout (15 min)
- Constant-time-ish dummy bcrypt compare on missing-user path (no email enumeration)
- 30-day JWT, but `requireSession()` re-checks `isActive` on every authenticated API call → deactivation kicks open sessions immediately
- JWT `update()` is DB-backed, not client-controllable
- Every API route is Zod-validated and RBAC-gated
- HTML-escaped invoice/receipt PDF + email templates
- Atomic invoice/receipt numbering inside the create transaction
- Server-side totals (client values never trusted)
- RLS enabled with default-deny on every table — anon JWT can't read anything
- CSP, X-Frame-Options DENY, HSTS, no-sniff, referrer + permissions policy
- Append-only `audit_log` for all sensitive mutations

## Deploy to Vercel

1. Push to GitHub. Import in Vercel as a Next.js project.
2. Set env vars in Vercel → Project Settings → Environment Variables (DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, optionally Supabase keys, SMTP).
3. Deploy. `vercel.json` raises Puppeteer routes to `maxDuration: 60`.
4. Custom domain → Vercel → Domains.

### Puppeteer notes
- `next.config.js` lists `@sparticuz/chromium` + `puppeteer-core` + `puppeteer` as external server packages so Webpack doesn't try to bundle them.
- On Vercel, the function runtime uses `@sparticuz/chromium` (~50MB). On the Hobby plan you're near the 50MB function size limit — Pro fixes it, or you can switch to `@react-pdf/renderer` in `src/lib/pdf.ts` (would require porting the HTML template).

### Supabase RLS
The 7 tables have **Row Level Security enabled with no policies = default deny**. Prisma connects through the `postgres` role which has `BYPASSRLS`, so app queries work unchanged. The `anon` JWT (shipped in `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Storage) cannot read or write any of our tables via the Supabase REST/Realtime APIs — defence-in-depth in case the key leaks. Don't enable RLS policies on these tables unless you specifically want client-side Supabase access for some feature.

## Project structure

```
src/
├── app/
│   ├── layout.tsx           ← root layout + SessionProvider
│   ├── globals.css          ← Tailwind + Bed Pro tokens (#E8191A / #111)
│   ├── login/               ← /login (public)
│   ├── set-password/        ← /set-password (first-login flow)
│   ├── (app)/               ← protected pages share sidebar+header shell
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── invoices/{page, new, [id]}
│   │   ├── customers/ · products/ · settings/ · users/
│   └── api/                 ← every route does its own RBAC check
├── components/              ← sidebar, header, status-badge, status-dropdown, BedProLogo
├── lib/
│   ├── auth.ts              ← Auth.js v5 — credentials + bcrypt + lockout
│   ├── auth.config.ts       ← Edge-safe config (used by middleware.ts)
│   ├── api-auth.ts          ← requireSession / requirePermission / apiError
│   ├── permissions.ts       ← ROLE_ROUTES + PERMISSIONS matrix + can()
│   ├── prisma.ts            ← Prisma client w/ pg driver adapter
│   ├── status.ts            ← computeStatus + transitions
│   ├── totals.ts            ← calcTotals (server-side source of truth)
│   ├── numbering.ts         ← atomic BP-#### / RCP-#### allocation
│   ├── format.ts            ← formatMoney, formatDate
│   ├── validators.ts        ← Zod schemas for every API body
│   ├── pdf.ts               ← Puppeteer wrapper
│   ├── invoice-html.ts      ← branded invoice + receipt HTML
│   ├── email.ts             ← Nodemailer + branded HTML templates
│   ├── temp-password.ts     ← cryptographically random temp passwords
│   ├── supabase.ts          ← optional Storage client
│   └── cn.ts                ← clsx + tailwind-merge
├── middleware.ts            ← edge auth gate
├── types/next-auth.d.ts     ← Session/JWT type augmentation
└── env.d.ts                 ← ProcessEnv types
prisma/
├── schema.prisma            ← 7 tables, 3 enums (Role / InvoiceStatus / PaymentMethod)
└── seed.ts                  ← idempotent: company settings + first admin + products
```

## Security highlights

- bcrypt cost 12 · 5-strike lockout · constant-time-ish auth (no email enumeration)
- 30-day JWT, edge-verified — no DB hit on each page load
- Every API route Zod-validates the body before reaching Prisma
- Server-side totals (client values never trusted)
- Atomic invoice/receipt numbering via transaction-bound `UPDATE … RETURNING`
- RLS-disabled tables locked behind `postgres` role (anon JWT can't reach them)
- `next.config.js` sets `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`
- No public registration — admin invites only
