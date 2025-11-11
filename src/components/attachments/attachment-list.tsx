'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { File, Download, Trash2, FileText, FileImage, FileVideo, FileAudio, Loader2, Paperclip, Upload, X, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useConfirm } from '@/hooks/use-confirm'
import { toast } from 'sonner'

interface Attachment {
  id: number
  filename: string
  url: string
  size: number | null
  mimeType: string | null
  createdAt: string
  uploadedBy: {
    id: number
    name: string | null
    email: string
  }
}

interface AttachmentListProps {
  taskId: number
  initialAttachments?: Attachment[]
  onAttachmentsChange?: () => void
}

export function AttachmentList({ taskId, initialAttachments, onAttachmentsChange }: AttachmentListProps) {
  const { confirm, ConfirmationDialog } = useConfirm()
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments || [])
  const [isLoading, setIsLoading] = useState(!initialAttachments)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

  // Update attachments when initialAttachments prop changes
  useEffect(() => {
    if (initialAttachments) {
      setAttachments(initialAttachments)
      setIsLoading(false)
    }
  }, [initialAttachments])

  const fetchAttachments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}/attachments`)
      if (response.ok) {
        const data = await response.json()
        setAttachments(data)
      }
    } catch (error) {
      console.error('Failed to fetch attachments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('El archivo excede el tamaño máximo permitido de 50MB')
      return
    }

    setSelectedFile(file)
    handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Direct upload to S3 via backend (like testmonitor)
      setUploadProgress(20)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('taskId', taskId.toString())

      const uploadResponse = await fetch('/api/upload/direct', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Error al subir el archivo')
      }

      setUploadProgress(100)

      // Success!
      toast.success('Archivo subido exitosamente')

      // Reset form
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Refresh attachments list
      await fetchAttachments()
      onAttachmentsChange?.()
    } catch (err) {
      console.error('Upload error:', err)
      toast.error(err instanceof Error ? err.message : 'Error al subir el archivo')

      // Reset on error
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (attachmentId: number) => {
    const confirmed = await confirm({
      title: 'Eliminar archivo',
      description: '¿Estás seguro de que quieres eliminar este archivo?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive'
    })

    if (!confirmed) {
      return
    }

    setDeletingId(attachmentId)
    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Archivo eliminado exitosamente')
        await fetchAttachments()
        onAttachmentsChange?.()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Error al eliminar el archivo')
      }
    } catch (error) {
      console.error('Error deleting attachment:', error)
      toast.error('Error al eliminar el archivo')
    } finally {
      setDeletingId(null)
    }
  }

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <File className="h-5 w-5" />

    if (mimeType.startsWith('image/')) return <FileImage className="h-5 w-5 text-blue-600" />
    if (mimeType.startsWith('video/')) return <FileVideo className="h-5 w-5 text-purple-600" />
    if (mimeType.startsWith('audio/')) return <FileAudio className="h-5 w-5 text-green-600" />
    if (mimeType.includes('pdf')) return <FileText className="h-5 w-5 text-red-600" />

    return <File className="h-5 w-5 text-gray-600" />
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes || bytes === 0) return ''

    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`

    const mb = kb / 1024
    return `${mb.toFixed(1)} MB`
  }

  const isPreviewable = (mimeType: string | null) => {
    if (!mimeType) return false
    return mimeType.startsWith('image/') || mimeType.includes('pdf')
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
        <p className="text-gray-500 mt-2 text-sm">Cargando archivos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Upload in progress indicator */}
      {isUploading && selectedFile && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded">
                <Upload className="h-5 w-5 text-blue-600 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Subiendo archivo...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Attachments list */}
      {attachments.length === 0 && !isUploading ? (
        <div className="text-center py-8">
          <Paperclip className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay archivos adjuntos</p>
          <p className="text-gray-400 text-xs mt-1">Agrega archivos para compartir documentos, imágenes o recursos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(attachment.mimeType)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{attachment.filename}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    {formatFileSize(attachment.size) && (
                      <>
                        <span>{formatFileSize(attachment.size)}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>{attachment.uploadedBy.name || attachment.uploadedBy.email}</span>
                    <span>•</span>
                    <span>{format(new Date(attachment.createdAt), 'dd MMM yyyy', { locale: es })}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isPreviewable(attachment.mimeType) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(attachment.url, '_blank')}
                    className="h-8 w-8 p-0"
                    title="Previsualizar"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(attachment.url, '_blank')}
                  className="h-8 w-8 p-0"
                  title="Descargar"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(attachment.id)}
                  disabled={deletingId === attachment.id}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Eliminar"
                >
                  {deletingId === attachment.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
        id={`file-upload-${taskId}`}
      />

      <ConfirmationDialog />
    </div>
  )
}
