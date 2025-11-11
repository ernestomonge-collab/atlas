import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  s3Client,
  S3_BUCKET_NAME,
  generateAttachmentKey,
  getContentType
} from '@/lib/s3'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/upload/presigned-url
 *
 * Generate a presigned URL for uploading a file to S3
 *
 * Request body:
 * - fileName: string - Name of the file to upload
 * - taskId: number - ID of the task the file will be attached to
 * - fileSize: number (optional) - Size of the file in bytes
 *
 * Response:
 * - uploadUrl: string - Presigned URL for uploading the file
 * - fileUrl: string - Public URL of the file after upload
 * - key: string - S3 key where the file will be stored
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate S3 configuration
    if (!S3_BUCKET_NAME) {
      console.error('S3 bucket name is not configured')
      return NextResponse.json(
        { error: 'File upload is not configured. Please contact administrator.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { fileName, taskId, fileSize } = body

    // Validate required fields
    if (!fileName || !fileName.trim()) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      )
    }

    if (!taskId || isNaN(parseInt(taskId))) {
      return NextResponse.json(
        { error: 'Valid task ID is required' },
        { status: 400 }
      )
    }

    const parsedTaskId = parseInt(taskId)

    // Verify task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: parsedTaskId },
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
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed size of 50MB' },
        { status: 400 }
      )
    }

    // Generate S3 key
    const key = generateAttachmentKey(
      session.user.organizationId,
      parsedTaskId,
      fileName
    )

    // Determine content type
    const contentType = getContentType(fileName)

    // Create presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      // Optional: Add metadata
      Metadata: {
        uploadedBy: session.user.id,
        taskId: parsedTaskId.toString(),
        originalFileName: fileName
      }
    })

    // Generate presigned URL (valid for 5 minutes)
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300 // 5 minutes
    })

    // Generate public URL with correct region
    const region = process.env.AWS_REGION || 'us-east-1'
    const fileUrl = `https://${S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`

    return NextResponse.json({
      uploadUrl,
      fileUrl,
      key,
      contentType
    })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
