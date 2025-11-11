'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Search,
  FolderKanban,
  CheckSquare,
  Layers,
  Building2,
  Target,
  Clock,
  User,
  Calendar,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SearchResult {
  id: string
  type: 'project' | 'task' | 'space'
  title: string
  description?: string
  metadata?: {
    projectName?: string
    spaceName?: string
    status?: string
    priority?: string
    assignee?: string
    dueDate?: string
    projectId?: string
  }
  url: string
}

export function GlobalSearch() {
  const router = useRouter()
  const { data: session } = useSession()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  // Listen for Cmd+K / Ctrl+K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Perform search when query changes
  React.useEffect(() => {
    const performSearch = async () => {
      if (!query.trim() || !session) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(performSearch, 300)
    return () => clearTimeout(debounce)
  }, [query, session])

  const handleSelect = async (result: SearchResult) => {
    setOpen(false)
    setQuery('')

    // If it's a task, navigate to project page with task ID as query parameter
    if (result.type === 'task' && result.metadata?.projectId) {
      // Navigate to project page with taskId parameter
      // The project page will detect this and open the modal automatically
      router.push(`/projects/${result.metadata.projectId}?taskId=${result.id}`)
    } else {
      // For non-task results, navigate as before
      router.push(result.url)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <FolderKanban className="h-4 w-4" />
      case 'task':
        return <CheckSquare className="h-4 w-4" />
      case 'space':
        return <Building2 className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null

    const statusConfig = {
      PENDING: { label: 'Pendiente', className: 'bg-gray-100 text-gray-800' },
      IN_PROGRESS: { label: 'En Progreso', className: 'bg-blue-100 text-blue-800' },
      COMPLETED: { label: 'Completada', className: 'bg-green-100 text-green-800' },
      PLANNING: { label: 'Planificación', className: 'bg-gray-100 text-gray-800' },
      ACTIVE: { label: 'Activo', className: 'bg-blue-100 text-blue-800' },
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null

    return (
      <Badge variant="secondary" className={`text-xs ${config.className}`}>
        {config.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null

    const priorityConfig = {
      LOW: { label: 'Baja', className: 'bg-green-100 text-green-800' },
      MEDIUM: { label: 'Media', className: 'bg-yellow-100 text-yellow-800' },
      HIGH: { label: 'Alta', className: 'bg-orange-100 text-orange-800' },
      URGENT: { label: 'Urgente', className: 'bg-red-100 text-red-800' },
    }

    const config = priorityConfig[priority as keyof typeof priorityConfig]
    if (!config) return null

    return (
      <Badge variant="secondary" className={`text-xs ${config.className}`}>
        {config.label}
      </Badge>
    )
  }

  // Group results by type
  const groupedResults = React.useMemo(() => {
    const groups: Record<string, SearchResult[]> = {
      projects: [],
      tasks: [],
      spaces: [],
    }

    results.forEach((result) => {
      if (result.type === 'project') groups.projects.push(result)
      else if (result.type === 'task') groups.tasks.push(result)
      else if (result.type === 'space') groups.spaces.push(result)
    })

    return groups
  }, [results])

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors w-full"
      >
        <Search className="h-4 w-4" />
        <span>Buscar...</span>
        <kbd className="hidden sm:inline-flex ml-auto h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar proyectos, espacios, tareas..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? 'Buscando...' : 'No se encontraron resultados.'}
          </CommandEmpty>

          {/* Spaces */}
          {groupedResults.spaces.length > 0 && (
            <>
              <CommandGroup heading="Espacios">
                {groupedResults.spaces.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.title}
                    onSelect={() => handleSelect(result)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {getIcon(result.type)}
                      <div className="flex-1">
                        <div className="font-medium">{result.title}</div>
                        {result.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {result.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Projects */}
          {groupedResults.projects.length > 0 && (
            <>
              <CommandGroup heading="Proyectos">
                {groupedResults.projects.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.title}
                    onSelect={() => handleSelect(result)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {getIcon(result.type)}
                      <div className="flex-1">
                        <div className="font-medium">{result.title}</div>
                        {result.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {result.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Tasks */}
          {groupedResults.tasks.length > 0 && (
            <CommandGroup heading="Tareas">
              {groupedResults.tasks.map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.title}
                  onSelect={() => handleSelect(result)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getIcon(result.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{result.title}</span>
                        {getStatusBadge(result.metadata?.status)}
                        {getPriorityBadge(result.metadata?.priority)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        {result.metadata?.projectName && (
                          <span className="flex items-center gap-1 truncate">
                            <FolderKanban className="h-3 w-3" />
                            {result.metadata.projectName}
                          </span>
                        )}
                        {result.metadata?.assignee && (
                          <span className="flex items-center gap-1 truncate">
                            <User className="h-3 w-3" />
                            {result.metadata.assignee}
                          </span>
                        )}
                        {result.metadata?.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(result.metadata.dueDate).toLocaleDateString('es-ES', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
