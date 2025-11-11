import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

// Validate required environment variables
const requiredEnvVars = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET_NAME'
] as const

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} is not set. S3 uploads will not work.`)
  }
}

// Create S3 client
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
})

export const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || ''
export const S3_REGION = process.env.AWS_REGION || 'us-east-1'

export interface UploadResult {
  url: string
  key: string
}

/**
 * Upload file to S3
 * @param file File buffer or stream
 * @param fileName Original file name
 * @param folder Folder path in S3 bucket
 * @returns Object with URL and key
 */
export async function uploadToS3(
  file: Buffer,
  fileName: string,
  folder: string = 'attachments'
): Promise<UploadResult> {
  console.log('[uploadToS3] Starting upload...')
  const bucketName = process.env.AWS_S3_BUCKET_NAME

  if (!bucketName) {
    console.error('[uploadToS3] AWS_S3_BUCKET_NAME is not set')
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set')
  }

  // Generate unique file name
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const key = `${folder}/${timestamp}-${sanitizedFileName}`
  const contentType = getContentType(fileName)

  console.log('[uploadToS3] Upload params:', {
    bucket: bucketName,
    key,
    fileSize: file.length,
    contentType
  })

  try {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
      },
    })

    console.log('[uploadToS3] Starting S3 upload...')
    await upload.done()
    console.log('[uploadToS3] S3 upload completed successfully')

    // Construct URL with region
    const region = process.env.AWS_REGION || 'us-east-1'
    const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`

    console.log('[uploadToS3] File URL:', url)
    return { url, key }
  } catch (error) {
    console.error('[uploadToS3] Upload failed:', error)
    if (error instanceof Error) {
      console.error('[uploadToS3] Error message:', error.message)
      console.error('[uploadToS3] Error stack:', error.stack)
    }
    throw error
  }
}

// Helper function to generate S3 key for attachments
export function generateAttachmentKey(
  organizationId: string,
  taskId: number,
  fileName: string
): string {
  // Create a unique filename to avoid collisions
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')

  return `attachments/${organizationId}/${taskId}/${timestamp}-${randomString}-${sanitizedFileName}`
}

// Helper function to get file extension from filename
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

// Helper function to determine content type from file extension
export function getContentType(fileName: string): string {
  const ext = getFileExtension(fileName)

  const contentTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',

    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    csv: 'text/csv',

    // Archives
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',

    // Video
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    wmv: 'video/x-ms-wmv',

    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',

    // Code
    js: 'text/javascript',
    json: 'application/json',
    html: 'text/html',
    css: 'text/css',
    xml: 'application/xml'
  }

  return contentTypes[ext] || 'application/octet-stream'
}
