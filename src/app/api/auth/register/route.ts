import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'

// POST /api/auth/register - Register new user and create organization
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { name, email, password } = validation.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Get the first organization (assuming single organization setup)
    const organization = await prisma.organization.findFirst()

    if (!organization) {
      return NextResponse.json(
        { error: 'No organization found. Please contact administrator.' },
        { status: 400 }
      )
    }

    // Create user with MEMBER role
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'MEMBER',
        organizationId: organization.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
        createdAt: true
      }
    })

    return NextResponse.json(
      {
        message: 'User created successfully',
        user,
        organization
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
