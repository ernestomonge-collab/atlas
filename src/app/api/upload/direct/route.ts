import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToS3 } from '@/lib/s3'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/upload/direct
 *
 * Upload a file directly to S3 from the backend
 *
 * This endpoint receives a FormData with:
 * - file: File - The file to upload
 * - taskId: number - ID of the task the file will be attached to
 *
 * Response:
 * - fileUrl: string - Public URL of the uploaded file
 * - key: string - S3 key where the file is stored
 * - attachment: object - Created attachment record
 */
export async function POST(request: NextRequest) {
  console.log('=== DIRECT UPLOAD API CALLED ===')
  try {
    const session = await getServerSession(authOptions)
    console.log('Session:', session?.user?.id)

    if (!session?.user) {
      console.log('❌ Unauthorized - no session')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const taskIdStr = formData.get('taskId') as string | null

    console.log('File:', file?.name, file?.size)
    console.log('TaskId:', taskIdStr)

    // Validate required fields
    if (!file) {
      console.log('❌ No file provided')
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    if (!taskIdStr || isNaN(parseInt(taskIdStr))) {
      console.log('❌ Invalid taskId')
      return NextResponse.json(
        { error: 'Valid task ID is required' },
        { status: 400 }
      )
    }

    const taskId = parseInt(taskIdStr)
    console.log('Parsed taskId:', taskId)

    // Verify task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: { organizationId: true }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    if (task.project.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Validate file size (max 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed size of 50MB' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    console.log('Converting file to buffer...')
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('Buffer size:', buffer.length)

    // Upload to S3
    const folder = `attachments/${session.user.organizationId}/${taskId}`
    console.log('Uploading to S3, folder:', folder)
    console.log('S3 Config:', {
      bucket: process.env.AWS_S3_BUCKET_NAME,
      region: process.env.AWS_REGION,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
    })

    const uploadResult = await uploadToS3(buffer, file.name, folder)
    console.log('✅ Upload successful:', uploadResult.url)

    // Create attachment record in database
    console.log('Creating attachment record in DB...')
    const attachment = await prisma.attachment.create({
      data: {
        filename: file.name,
        url: uploadResult.url,
        size: file.size,
        mimeType: file.type || null,
        taskId: taskId,
        uploadedById: parseInt(session.user.id)
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    console.log('✅ Attachment created:', attachment.id)

    return NextResponse.json({
      fileUrl: uploadResult.url,
      key: uploadResult.key,
      attachment
    }, { status: 201 })
  } catch (error) {
    console.error('❌ ERROR uploading file:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
