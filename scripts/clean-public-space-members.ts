import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanPublicSpaceMembers() {
  try {
    console.log('🔍 Buscando espacios públicos con miembros...')

    // Get all public spaces with their members
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

    console.log(`\n📊 Encontrados ${publicSpaces.length} espacios públicos`)

    for (const space of publicSpaces) {
      if (space.members.length > 0) {
        console.log(`\n🏢 Espacio: "${space.name}" (ID: ${space.id})`)
        console.log(`   Miembros actuales: ${space.members.length}`)

        // Show members that will be removed
        space.members.forEach(member => {
          console.log(`   - ${member.user.name || member.user.email} (${member.role})`)
        })

        // Delete all members from this public space
        const deleted = await prisma.spaceMember.deleteMany({
          where: {
            spaceId: space.id
          }
        })

        console.log(`   ✅ Eliminados ${deleted.count} miembros`)
      } else {
        console.log(`\n✓ Espacio "${space.name}" (ID: ${space.id}) - Sin miembros (correcto)`)
      }
    }

    console.log('\n✅ Limpieza completada!')
    console.log('\n📝 Resumen:')
    console.log('   - Los espacios públicos ahora no tienen miembros explícitos')
    console.log('   - Todos los usuarios de la organización tienen acceso automático')

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanPublicSpaceMembers()
