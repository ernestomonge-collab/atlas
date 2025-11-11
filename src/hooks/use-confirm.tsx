'use client'

import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface ConfirmOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    description: ''
  })
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null)

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts)
    setIsOpen(true)

    return new Promise((resolve) => {
      setOnConfirmCallback(() => () => {
        resolve(true)
        setIsOpen(false)
      })

      // Handle cancel
      const handleCancel = () => {
        resolve(false)
        setIsOpen(false)
      }

      // Store cancel handler for cleanup
      setOnConfirmCallback((prev) => {
        if (prev) return prev
        return handleCancel as any
      })
    })
  }

  const ConfirmationDialog = () => (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open && onConfirmCallback) {
          // User cancelled
        }
      }}
      onConfirm={() => {
        if (onConfirmCallback) {
          onConfirmCallback()
        }
      }}
      title={options.title}
      description={options.description}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      variant={options.variant}
    />
  )

  return { confirm, ConfirmationDialog }
}
