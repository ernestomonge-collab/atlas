'use client'

import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface User {
  id: number
  name: string | null
  email: string
}

interface MentionTextareaProps {
  value: string
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  rows?: number
  className?: string
  disabled?: boolean
  projectId?: string
}

export function MentionTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
  disabled = false,
  projectId
}: MentionTextareaProps) {
  const [users, setUsers] = useState<User[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionSearch, setMentionSearch] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch users when search changes
  useEffect(() => {
    if (!mentionSearch && !projectId) {
      setUsers([])
      return
    }

    const fetchUsers = async () => {
      try {
        // If projectId is provided, fetch only project members
        const url = projectId
          ? `/api/projects/${projectId}/members${mentionSearch ? `?search=${encodeURIComponent(mentionSearch)}` : ''}`
          : `/api/users?search=${encodeURIComponent(mentionSearch)}`

        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          // Extract user data from members array if it's a project members response
          const usersData = Array.isArray(data) && data[0]?.user ? data.map((m: any) => m.user) : data
          setUsers(usersData)
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
      }
    }

    const debounce = setTimeout(fetchUsers, 200)
    return () => clearTimeout(debounce)
  }, [mentionSearch, projectId])

  // Reset selected index when users change
  useEffect(() => {
    setSelectedIndex(0)
  }, [users])

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart || 0
    setCursorPosition(cursorPos)

    // Check if we're typing a mention
    const textBeforeCursor = newValue.substring(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      setMentionSearch(mentionMatch[1])
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
      setMentionSearch('')
    }

    // Call original onChange
    onChange(e)
  }

  const insertMention = (user: User) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const textBeforeCursor = value.substring(0, cursorPosition)
    const textAfterCursor = value.substring(cursorPosition)

    // Find the @ symbol position
    const atIndex = textBeforeCursor.lastIndexOf('@')
    if (atIndex === -1) return

    // Build new value with mention
    const mentionText = `@${user.name || user.email}`
    const newValue =
      value.substring(0, atIndex) +
      mentionText +
      ' ' +
      textAfterCursor

    // Create synthetic event
    const syntheticEvent = {
      target: { value: newValue, selectionStart: atIndex + mentionText.length + 1 }
    } as ChangeEvent<HTMLTextAreaElement>

    onChange(syntheticEvent)

    // Set cursor position
    setTimeout(() => {
      const newCursorPos = atIndex + mentionText.length + 1
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)

    // Close suggestions
    setShowSuggestions(false)
    setMentionSearch('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || users.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % users.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + users.length) % users.length)
        break
      case 'Enter':
        if (users[selectedIndex]) {
          e.preventDefault()
          insertMention(users[selectedIndex])
        }
        break
      case 'Tab':
        if (users[selectedIndex]) {
          e.preventDefault()
          insertMention(users[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowSuggestions(false)
        setMentionSearch('')
        break
    }
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={className}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && users.length > 0 && (
        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {users.map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => insertMention(user)}
              className={cn(
                'w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 transition-colors',
                index === selectedIndex && 'bg-blue-50'
              )}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                {(user.name || user.email).substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user.name || user.email}
                </div>
                {user.name && (
                  <div className="text-xs text-gray-500 truncate">
                    {user.email}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
