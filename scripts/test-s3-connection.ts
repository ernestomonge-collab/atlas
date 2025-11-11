import { S3Client, ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

async function testS3Connection() {
  console.log('🔍 Testing S3 Connection...\n')

  console.log('Configuration:')
  console.log('- Region:', process.env.AWS_REGION)
  console.log('- Bucket:', process.env.AWS_S3_BUCKET_NAME)
  console.log('- Access Key ID:', process.env.AWS_ACCESS_KEY_ID?.substring(0, 10) + '...')
  console.log()

  try {
    // Test 1: Upload a test file (skip list buckets as user may not have that permission)
    console.log('Test 1: Uploading test file...')
    const testContent = Buffer.from(`Test file uploaded at ${new Date().toISOString()}`, 'utf-8')
    const testKey = `test/connection-test-${Date.now()}.txt`

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain',
      },
    })

    await upload.done()

    const region = process.env.AWS_REGION || 'us-east-1'
    const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${testKey}`

    console.log('✅ Success! File uploaded')
    console.log('Key:', testKey)
    console.log('URL:', url)
    console.log()

    console.log('🎉 All tests passed! S3 connection is working properly.')
  } catch (error) {
    console.error('❌ Error:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  }
}

testS3Connection()
