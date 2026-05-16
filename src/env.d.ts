declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string
    DIRECT_URL?: string
    NEXTAUTH_SECRET: string
    NEXTAUTH_URL?: string
    NEXT_PUBLIC_SUPABASE_URL?: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
    SUPABASE_SERVICE_ROLE_KEY?: string
    SMTP_HOST?: string
    SMTP_PORT?: string
    SMTP_USER?: string
    SMTP_PASSWORD?: string
    SMTP_PASS?: string
    SMTP_FROM?: string
    EMAIL_FROM?: string
    SEED_ADMIN_EMAIL?: string
    SEED_ADMIN_PASSWORD?: string
    SEED_ADMIN_NAME?: string
  }
}
