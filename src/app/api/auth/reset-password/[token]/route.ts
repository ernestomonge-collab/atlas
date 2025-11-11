import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

// GET - Verify token
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: params.token },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 404 }
      )
    }

    if (resetToken.used) {
      return NextResponse.json(
        { error: 'Este enlace ya fue usado' },
        { status: 400 }
      )
    }

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: 'Este enlace ha expirado' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      email: resetToken.email,
      valid: true,
    })
  } catch (error) {
    console.error('Error verifying reset token:', error)
    return NextResponse.json(
      { error: 'Error al verificar el token' },
      { status: 500 }
    )
  }
}

// POST - Reset password
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json()
    const { password } = resetPasswordSchema.parse(body)

    // Find and validate token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: params.token },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 404 }
      )
    }

    if (resetToken.used) {
      return NextResponse.json(
        { error: 'Este enlace ya fue usado' },
        { status: 400 }
      )
    }

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: 'Este enlace ha expirado' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10)

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ])

    return NextResponse.json({
      message: 'Contraseña actualizada exitosamente',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Error al restablecer la contraseña' },
      { status: 500 }
    )
  }
}
