/**
 * Edge-safe Role type.
 *
 * Kept in sync with prisma/schema.prisma's `Role` enum. We can't import
 * `Role` from `@prisma/client` in edge-reachable code (middleware →
 * auth.config → permissions) because Vercel's edge runtime bundler refuses
 * any module that pulls @prisma/client into its dependency graph — even as
 * a type-only import.
 *
 * If you change the enum in schema.prisma, change it here too.
 */
export type Role = 'ADMIN' | 'MANAGER' | 'STAFF'
