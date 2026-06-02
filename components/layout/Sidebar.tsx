'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Users, MessageSquare,
  Package, Shield, Settings, LogOut, Stethoscope,
  ChevronLeft, ChevronRight, Bell
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui.store'
import { clearTokens } from '@/lib/api'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/dashboard/agenda', icon: Calendar, label: 'Agenda' },
  { href: '/dashboard/pacientes', icon: Users, label: 'Pacientes' },
  { href: '/dashboard/inbox', icon: MessageSquare, label: 'WhatsApp', badge: true },
  { href: '/dashboard/recordatorios', icon: Bell, label: 'Recordatorios' },
  { href: '/dashboard/inventario', icon: Package, label: 'Inventario' },
  { href: '/dashboard/obras-sociales', icon: Shield, label: 'Obras Sociales' },
  { href: '/dashboard/configuracion', icon: Settings, label: 'Configuración' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarOpen, toggleSidebar, user } = useUIStore()

  const handleLogout = () => {
    clearTokens()
    useUIStore.getState().setUser(null)
    router.push('/auth/login')
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300',
        sidebarOpen ? 'w-56' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <Stethoscope className="w-4 h-4 text-white" />
        </div>
        {sidebarOpen && (
          <span className="font-bold text-gray-900 text-sm">OdontoApp</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-brand-600')} />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        {/* Toggle */}
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
          {sidebarOpen && <span>Colapsar</span>}
        </button>

        {/* User */}
        {user && (
          <div className={cn('flex items-center gap-3 px-3 py-2', !sidebarOpen && 'justify-center')}>
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-brand-700">
                {user.nombre[0]}{user.apellido[0]}
              </span>
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {user.nombre} {user.apellido}
                </p>
                <p className="text-xs text-gray-400">{user.role}</p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {sidebarOpen && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}
