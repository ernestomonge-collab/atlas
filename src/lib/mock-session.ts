import { MOCK_USER } from './mock-data'

// Mock session data for demo purposes
export const MOCK_SESSION = {
  user: {
    id: MOCK_USER.id,
    name: MOCK_USER.name,
    email: MOCK_USER.email,
    role: MOCK_USER.role,
    organizationId: MOCK_USER.organizationId,
    organization: MOCK_USER.organization
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
}

// Helper to simulate different user types for testing
export const createMockSession = (userType: 'admin' | 'member' | 'readonly' = 'admin') => {
  const roles = {
    admin: 'ADMIN' as const,
    member: 'MEMBER' as const,
    readonly: 'READ_ONLY' as const
  }

  const names = {
    admin: 'Juan Pérez (Admin)',
    member: 'María García (Miembro)',
    readonly: 'Carlos López (Lectura)'
  }

  const emails = {
    admin: 'admin@empresa.com',
    member: 'miembro@empresa.com',
    readonly: 'lectura@empresa.com'
  }

  return {
    user: {
      id: `user-${userType}`,
      name: names[userType],
      email: emails[userType],
      role: roles[userType],
      organizationId: 'org-1',
      organization: {
        id: 'org-1',
        name: 'Mi Empresa Tech'
      }
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }
}