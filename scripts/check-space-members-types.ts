import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSpaceMembersTypes() {
  try {
    // Get Liga 1 space with members
    const space = await prisma.space.findFirst({
      where: {
        name: {
          contains: 'Liga'
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!space) {
      console.log('❌ No se encontró el espacio Liga 1')
      return
    }

    console.log('\n🏢 Espacio:', space.name)
    console.log('   Space ID:', space.id, '(type:', typeof space.id, ')')
    console.log('\n👥 Miembros:')

    space.members.forEach((member, index) => {
      console.log(`\n   Miembro ${index + 1}:`)
      console.log(`   - member.id: ${member.id} (type: ${typeof member.id})`)
      console.log(`   - member.userId: ${member.userId} (type: ${typeof member.userId})`)
      console.log(`   - member.role: ${member.role}`)
      console.log(`   - member.user.id: ${member.user.id} (type: ${typeof member.user.id})`)
      console.log(`   - member.user.email: ${member.user.email}`)
    })

    // Simulate session check
    console.log('\n🔍 Simulando check de permisos:')
    const sessionUserId = '34' // Admin User ID as string (from session)
    const parsedSessionUserId = parseInt(sessionUserId)
    console.log(`   session.user.id: "${sessionUserId}" (type: ${typeof sessionUserId})`)
    console.log(`   parseInt(session.user.id): ${parsedSessionUserId} (type: ${typeof parsedSessionUserId})`)

    const hasAccess = space.members.some(
      member => member.userId === parsedSessionUserId &&
                (member.role === 'OWNER' || member.role === 'ADMIN')
    )

    console.log(`\n   ✅ Resultado: ${hasAccess ? 'TIENE ACCESO' : 'NO TIENE ACCESO'}`)

    // Show the comparison
    space.members.forEach(member => {
      const match = member.userId === parsedSessionUserId
      const roleMatch = member.role === 'OWNER' || member.role === 'ADMIN'
      console.log(`   - User ${member.userId} === ${parsedSessionUserId}? ${match} | Role ${member.role} is OWNER/ADMIN? ${roleMatch}`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSpaceMembersTypes()
