import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkPublicSpacesRoles() {
  try {
    const publicSpaces = await prisma.space.findMany({
      where: {
        isPublic: true
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    console.log(`\n📊 Espacios públicos encontrados: ${publicSpaces.length}\n`)

    for (const space of publicSpaces) {
      console.log(`🏢 ${space.name} (ID: ${space.id})`)
      if (space.members.length === 0) {
        console.log('   ⚠️  Sin miembros')
      } else {
        space.members.forEach(member => {
          console.log(`   - ${member.user.name || member.user.email}: ${member.role}`)
        })
      }
      console.log('')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPublicSpacesRoles()
