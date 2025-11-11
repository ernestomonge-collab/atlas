import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function simulatePublicToPrivate() {
  try {
    // Ejemplo: Espacio "Liga 1" que es público
    const space = await prisma.space.findFirst({
      where: {
        name: 'Liga 1',
        isPublic: true
      },
      include: {
        members: true
      }
    })

    if (!space) {
      console.log('❌ No se encontró el espacio Liga 1 público')
      return
    }

    console.log('\n📊 SIMULACIÓN: Convertir espacio público a privado')
    console.log('=' .repeat(80))
    console.log(`\n🏢 Espacio: ${space.name}`)
    console.log(`   Estado actual: ${space.isPublic ? 'PÚBLICO' : 'PRIVADO'}`)
    console.log(`   Miembros registrados en space_members: ${space.members.length}`)

    // Listar miembros actuales
    console.log('\n👥 Miembros actuales en space_members:')
    for (const member of space.members) {
      const user = await prisma.user.findUnique({ where: { id: member.userId } })
      console.log(`   - ${user?.name} (${user?.email}) - ${member.role}`)
    }

    // Listar todos los usuarios de la organización
    const allUsers = await prisma.user.findMany({
      where: {
        organizationId: space.organizationId
      }
    })

    console.log(`\n👤 Total de usuarios en la organización: ${allUsers.length}`)
    console.log('\n🔍 ¿Qué pasaría al convertir a privado?')
    console.log('=' .repeat(80))

    console.log('\n✅ ANTES (Público):')
    console.log(`   - Todos los ${allUsers.length} usuarios pueden ver el espacio`)

    console.log('\n❌ DESPUÉS (Privado):')
    console.log(`   - Solo ${space.members.length} usuario(s) podrán ver el espacio:`)
    for (const member of space.members) {
      const user = await prisma.user.findUnique({ where: { id: member.userId } })
      console.log(`     • ${user?.name} (${user?.email})`)
    }

    const usersWhoWillLoseAccess = allUsers.filter(
      user => !space.members.some(m => m.userId === user.id)
    )

    console.log(`\n⚠️  ${usersWhoWillLoseAccess.length} usuario(s) perderán acceso:`)
    for (const user of usersWhoWillLoseAccess) {
      console.log(`     • ${user.name} (${user.email})`)
    }

    console.log('\n' + '=' .repeat(80))
    console.log('\n💡 RECOMENDACIÓN:')
    console.log('   Para mantener el acceso actual, agregar automáticamente a todos')
    console.log('   los usuarios de la organización como miembros del espacio antes')
    console.log('   de convertirlo a privado.')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

simulatePublicToPrivate()
