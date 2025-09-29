'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  Building2,
  Home,
  FolderOpen,
  Users,
  BarChart3,
  Bell,
  Target,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface SidebarProps {
  className?: string
  collapsed?: boolean
  onToggleCollapse?: (collapsed: boolean) => void
}

export function Sidebar({ className, collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: pathname === '/dashboard'
    },
    {
      name: 'Espacios',
      href: '/spaces',
      icon: Layers,
      current: pathname.startsWith('/spaces')
    },
    {
      name: 'Proyectos',
      href: '/projects',
      icon: FolderOpen,
      current: pathname.startsWith('/projects')
    },
    {
      name: 'Equipo',
      href: '/team',
      icon: Users,
      current: pathname === '/team'
    },
    {
      name: 'Reportes',
      href: '/reports',
      icon: BarChart3,
      current: pathname === '/reports'
    },
    {
      name: 'Notificaciones',
      href: '/notifications',
      icon: Bell,
      current: pathname === '/notifications'
    }
  ]

  if (!session) {
    return null
  }

  return (
    <div className={cn("flex h-full flex-col bg-white shadow-sm border-r transition-all duration-300",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Logo */}
      <div className={cn(
        "flex h-16 shrink-0 items-center border-b justify-between",
        collapsed ? "px-1" : "px-4 gap-2"
      )}>
        {!collapsed ? (
          <>
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 flex-shrink-0" />
              <span className="ml-2 text-xl font-bold text-gray-900">Lilab Ops</span>
            </div>

            {/* Toggle Button - Expanded */}
            <button
              onClick={() => onToggleCollapse?.(!collapsed)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors bg-gray-50 border border-gray-200 flex-shrink-0"
              title="Contraer menu"
            >
              <ChevronLeft className="h-4 w-4 text-gray-700" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center w-full space-y-1">
            <Building2 className="h-6 w-6 text-blue-600" />
            {/* Toggle Button - Collapsed */}
            <button
              onClick={() => onToggleCollapse?.(!collapsed)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title="Expandir menu"
            >
              <ChevronRight className="h-3 w-3 text-gray-700" />
            </button>
          </div>
        )}
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="px-6 py-4 border-b">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold">
                {session.user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
              <p className="text-xs text-gray-500">{session.user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* User Avatar Only (collapsed) */}
      {collapsed && (
        <div className="px-2 py-4 border-b flex justify-center">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-semibold">
              {session.user.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={cn("flex-1 py-4", collapsed ? "px-2" : "px-4")}>
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  'group flex items-center text-sm font-medium rounded-md transition-colors',
                  collapsed ? 'px-2 py-3 justify-center' : 'px-3 py-2',
                  item.current
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0',
                    collapsed ? '' : 'mr-3',
                    item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                  )}
                />
                {!collapsed && item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

    </div>
  )
}