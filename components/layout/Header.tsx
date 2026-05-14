'use client'

import { Bell, Search } from 'lucide-react'
import { useState } from 'react'
import { useUIStore } from '@/stores/ui.store'
import { formatDate } from '@/lib/utils'

export function Header() {
  const { user, notifications } = useUIStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const unread = notifications.length

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0">
      {/* Fecha */}
      <span className="text-sm text-gray-500 hidden sm:block">
        {formatDate(new Date(), "EEEE d 'de' MMMM yyyy")}
      </span>

      <div className="flex-1" />

      {/* Búsqueda rápida */}
      <button
        onClick={() => setSearchOpen(!searchOpen)}
        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Notificaciones */}
      <button className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {/* Avatar */}
      {user && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
            <span className="text-xs font-bold text-brand-700">
              {user.nombre[0]}{user.apellido[0]}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {user.nombre}
          </span>
        </div>
      )}
    </header>
  )
}
