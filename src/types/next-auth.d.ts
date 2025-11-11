import { UserRole } from '@prisma/client'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      organizationId: number
    } & DefaultSession['user']
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: UserRole
    organizationId: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    organizationId: number
  }
}