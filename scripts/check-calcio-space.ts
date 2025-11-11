import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCalcioSpace() {
  try {
    const space = await prisma.space.findFirst({
      where: {
        name: 'Calcio'
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
      console.log('❌ No se encontró el espacio Calcio')
      return
    }

    console.log('\n🏢 Espacio: Calcio')
    console.log(`   ID: ${space.id}`)
    console.log(`   Público: ${space.isPublic ? 'SÍ' : 'NO'}`)
    console.log(`\n👥 Miembros:`)

    space.members.forEach(member => {
      console.log(`   - ${member.user.name} (${member.user.email})`)
      console.log(`     Role: ${member.role}`)
      console.log(`     User ID: ${member.userId}`)
    })

    // Verificar la lógica del botón "Add Member"
    console.log(`\n🔍 Lógica del botón "Add Member":`)
    console.log(`   isSpaceAdmin && !space?.isPublic`)

    const adminUser = space.members.find(m => m.userId === 34)
    const isAdmin = adminUser?.role === 'ADMIN' || adminUser?.role === 'OWNER'

    console.log(`\n   Admin User (ID: 34) encontrado: ${adminUser ? 'SÍ' : 'NO'}`)
    console.log(`   Rol: ${adminUser?.role || 'N/A'}`)
    console.log(`   Es ADMIN u OWNER: ${isAdmin}`)
    console.log(`   Espacio es público: ${space.isPublic}`)
    console.log(`   Espacio es privado: ${!space.isPublic}`)
    console.log(`\n   ✅ Botón debe aparecer: ${isAdmin && !space.isPublic ? 'SÍ' : 'NO'}`)
    console.log(`      Condición: isAdmin (${isAdmin}) && !isPublic (${!space.isPublic}) = ${isAdmin && !space.isPublic}`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCalcioSpace()
