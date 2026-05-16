import type { Role } from '@prisma/client'
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
