import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifySpaceAccess() {
  try {
    const spaces = await prisma.space.findMany({
      where: {
        OR: [
          { isPublic: true },
          {
            isPublic: false,
            members: {
              some: {
                userId: 34
              }
            }
          }
        ]
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true
              }
            }
          }
        }
      }
    })

    console.log('\n🔍 Verificación de acceso para Admin User (ID: 34)\n')
    console.log('=' .repeat(80))

    spaces.forEach(space => {
      const sessionUserId = 34
      const userMember = space.members?.find(m => m.userId === sessionUserId)

      const isOwnerOrAdmin = space.members?.some(
        member => member.userId === sessionUserId &&
                  (member.role === 'OWNER' || member.role === 'ADMIN')
      )

      const status = isOwnerOrAdmin ? '✅ TIENE ACCESO' : '❌ SIN ACCESO'
      const roleDisplay = userMember ? userMember.role : 'NO MIEMBRO'

      console.log(`\n${status} - ${space.name}`)
      console.log(`  Rol: ${roleDisplay}`)
      console.log(`  Menú debe aparecer: ${isOwnerOrAdmin ? 'SÍ' : 'NO'}`)
    })

    console.log('\n' + '='.repeat(80))
    console.log('\n✅ Espacios con menú de 3 puntos:')
    const spacesWithAccess = spaces.filter(space =>
      space.members?.some(
        member => member.userId === 34 &&
                  (member.role === 'OWNER' || member.role === 'ADMIN')
      )
    )
    spacesWithAccess.forEach(space => {
      console.log(`  - ${space.name}`)
    })

    console.log(`\n📊 Total: ${spacesWithAccess.length} de ${spaces.length} espacios`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifySpaceAccess()
