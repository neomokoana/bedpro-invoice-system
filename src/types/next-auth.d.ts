// Use the edge-safe Role from src/lib/roles instead of @prisma/client.
// next-auth.d.ts is transitively reachable from the middleware bundle.
import type { Role } from '@/lib/roles'
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    id: string
    role: Role
    branch: string | null
    mustChangePassword: boolean
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: Role
      branch: string | null
      mustChangePassword: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    branch: string | null
    mustChangePassword: boolean
  }
}
