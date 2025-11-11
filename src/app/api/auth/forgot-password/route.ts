import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({
        message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña',
      })
    }

    // Delete any existing unused tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: {
        email: email.toLowerCase(),
        used: false,
      },
    })

    // Create new reset token (expires in 1 hour)
    const resetToken = await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    })

    // In production, send email here
    // For now, we'll log it to console in development
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3030'}/reset-password/${resetToken.token}`

    console.log('=============================================')
    console.log('PASSWORD RESET REQUESTED')
    console.log('Email:', email)
    console.log('Reset URL:', resetUrl)
    console.log('Token expires at:', resetToken.expiresAt)
    console.log('=============================================')

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // await sendPasswordResetEmail(user.email, resetUrl)

    return NextResponse.json({
      message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error in forgot-password:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
