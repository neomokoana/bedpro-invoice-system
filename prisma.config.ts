import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // DIRECT_URL (port 5432) used by db:push and migrate — bypasses pgbouncer
  datasource: {
    url: process.env.DIRECT_URL!,
  },
})
