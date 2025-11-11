import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testPrivateToPublic() {
  try {
    // Usar el espacio ATP que es privado
    const space = await prisma.space.findFirst({
      where: {
        name: 'ATP',
        isPublic: false
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
      console.log('❌ No se encontró el espacio ATP privado')
      return
    }

    console.log('\n🧪 TEST: Conversión de Privado a Público')
    console.log('=' .repeat(80))
    console.log(`\n🏢 Espacio: ${space.name}`)
    console.log(`   Estado: ${space.isPublic ? 'PÚBLICO' : 'PRIVADO'}`)
    console.log(`\n👥 Miembros ANTES de la conversión (${space.members.length}):`)

    space.members.forEach(member => {
      console.log(`   - ${member.user.name} (${member.user.email}) - ${member.role}`)
    })

    // Simular la conversión
    console.log('\n🔄 Simulando conversión a público...')
    console.log('   Ejecutando: DELETE space_members WHERE role != OWNER')

    const membersToDelete = space.members.filter(m => m.role !== 'OWNER')
    console.log(`\n   Miembros que serán eliminados: ${membersToDelete.length}`)
    membersToDelete.forEach(member => {
      console.log(`   ❌ ${member.user.name} (${member.role})`)
    })

    const membersToKeep = space.members.filter(m => m.role === 'OWNER')
    console.log(`\n   Miembros que se mantienen: ${membersToKeep.length}`)
    membersToKeep.forEach(member => {
      console.log(`   ✅ ${member.user.name} (${member.role})`)
    })

    console.log('\n' + '=' .repeat(80))
    console.log('\n💡 RESULTADO ESPERADO:')
    console.log('   1. El espacio se convierte a PÚBLICO')
    console.log('   2. Solo el OWNER permanece en space_members')
    console.log('   3. Todos los usuarios de la organización podrán ver el espacio')
    console.log('   4. Los miembros removidos NO recibirán notificación')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPrivateToPublic()
