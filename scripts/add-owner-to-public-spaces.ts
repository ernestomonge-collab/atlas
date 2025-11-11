import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addOwnerToPublicSpaces() {
  try {
    console.log('🔍 Buscando Admin User...')

    // Find Admin User
    const adminUser = await prisma.user.findFirst({
      where: {
        email: 'admin@lilab.com'
      }
    })

    if (!adminUser) {
      console.error('❌ No se encontró el usuario Admin')
      return
    }

    console.log(`✅ Admin User encontrado: ${adminUser.name} (ID: ${adminUser.id})`)

    console.log('\n🔍 Buscando espacios públicos...')

    // Get all public spaces
    const publicSpaces = await prisma.space.findMany({
      where: {
        isPublic: true
      },
      include: {
        members: true
      }
    })

    console.log(`\n📊 Encontrados ${publicSpaces.length} espacios públicos`)

    for (const space of publicSpaces) {
      console.log(`\n🏢 Espacio: "${space.name}" (ID: ${space.id})`)

      // Check if admin is already a member
      const existingMember = space.members.find(m => m.userId === adminUser.id)

      if (existingMember) {
        console.log(`   ℹ️  Admin ya es miembro con rol: ${existingMember.role}`)

        // Update to OWNER if not already
        if (existingMember.role !== 'OWNER') {
          await prisma.spaceMember.update({
            where: {
              id: existingMember.id
            },
            data: {
              role: 'OWNER'
            }
          })
          console.log(`   ✅ Rol actualizado de ${existingMember.role} a OWNER`)
        } else {
          console.log(`   ✓ Ya es OWNER (correcto)`)
        }
      } else {
        // Add admin as OWNER
        await prisma.spaceMember.create({
          data: {
            spaceId: space.id,
            userId: adminUser.id,
            role: 'OWNER'
          }
        })
        console.log(`   ✅ Admin agregado como OWNER`)
      }
    }

    console.log('\n✅ Proceso completado!')
    console.log('\n📝 Resumen:')
    console.log('   - Todos los espacios públicos ahora tienen a Admin User como OWNER')
    console.log('   - Los demás usuarios tienen acceso automático (sin membresía explícita)')

  } catch (error) {
    console.error('❌ Error durante el proceso:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addOwnerToPublicSpaces()
