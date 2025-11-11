import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkLiga1Space() {
  try {
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

    console.log('\n🏢 Espacio encontrado:')
    console.log(`   ID: ${space.id}`)
    console.log(`   Nombre: ${space.name}`)
    console.log(`   Público: ${space.isPublic ? 'Sí' : 'No'}`)
    console.log(`\n👥 Miembros (${space.members.length}):`)

    if (space.members.length === 0) {
      console.log('   ⚠️  Sin miembros')
    } else {
      space.members.forEach(member => {
        console.log(`   - User ID: ${member.user.id}`)
        console.log(`     Nombre: ${member.user.name}`)
        console.log(`     Email: ${member.user.email}`)
        console.log(`     Rol: ${member.role}`)
        console.log('')
      })
    }

    // Check current session user
    console.log('\n🔍 Para verificar acceso, ¿cuál es tu User ID actual?')
    console.log('   Revisa session.user.id en el navegador')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLiga1Space()
