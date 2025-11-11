import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testSpacesAPI() {
  try {
    // Simular lo que hace el endpoint GET /api/spaces
    const spaces = await prisma.space.findMany({
      where: {
        OR: [
          // Public spaces
          { isPublic: true },
          // Private spaces where user is a member (user ID 34)
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
        _count: {
          select: {
            projects: true,
            members: true
          }
        },
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`\n📊 Total de espacios encontrados: ${spaces.length}\n`)

    spaces.forEach((space, index) => {
      console.log(`\n${index + 1}. Espacio: ${space.name} (ID: ${space.id})`)
      console.log(`   Público: ${space.isPublic ? 'Sí' : 'No'}`)
      console.log(`   Miembros (${space.members.length}):`)

      if (space.members.length === 0) {
        console.log('   ⚠️  Sin miembros')
      } else {
        space.members.forEach(member => {
          console.log(`   - User ID: ${member.userId} (${member.user.email}) - Rol: ${member.role}`)
          console.log(`     Types: member.id=${typeof member.id}, member.userId=${typeof member.userId}, user.id=${typeof member.user.id}`)
        })
      }

      // Simular el check de permisos
      const sessionUserId = 34 // Admin User
      const hasAccess = space.members?.some(
        member => member.userId === sessionUserId &&
                  (member.role === 'OWNER' || member.role === 'ADMIN')
      )

      console.log(`   ✅ Admin User (ID: 34) tiene acceso OWNER/ADMIN: ${hasAccess ? 'SÍ' : 'NO'}`)
    })

    console.log('\n')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSpacesAPI()
