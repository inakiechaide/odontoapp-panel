'use client'

import { Bell, Search, Menu, X, Calendar, MessageSquare, User } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from 'use-debounce'
import { useUIStore } from '@/stores/ui.store'
import { formatDate, formatTime } from '@/lib/utils'
import api from '@/lib/api'

function todayStr() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

export function Header() {
  const router = useRouter()
  const { user, toggleMobileNav } = useUIStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debounced] = useDebounce(search, 350)
  const [hoy, setHoy] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setHoy(formatDate(new Date(), "EEEE d 'de' MMMM yyyy"))
  }, [])

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50)
  }, [searchOpen])

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSearchOpen(false); setNotifOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Búsqueda de pacientes
  const { data: searchData, isFetching: searching } = useQuery({
    queryKey: ['header-search', debounced],
    queryFn: async () => (await api.get(`/patients?q=${encodeURIComponent(debounced)}&limit=8`)).data,
    enabled: searchOpen && debounced.trim().length >= 2,
  })
  const resultados = searchData?.data ?? []

  // Conversaciones (para el contador de no leídos).
  // IMPORTANTE: misma queryKey y MISMA forma (array) que usa el inbox, para no
  // pisarnos en la caché de React Query.
  const { data: convData } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => (await api.get('/conversations?limit=50')).data?.data ?? [],
    refetchInterval: 60_000,
  })
  const convs = Array.isArray(convData) ? convData : []
  const sinLeer = convs.filter((c: any) => (c._count?.messages ?? 0) > 0)
  const totalSinLeer = sinLeer.reduce((acc: number, c: any) => acc + (c._count?.messages ?? 0), 0)

  // Turnos de hoy (solo cuando se abren las notificaciones)
  const hoyYmd = todayStr()
  const { data: apptData } = useQuery({
    queryKey: ['header-appts-today', hoyYmd],
    queryFn: async () => (await api.get(`/appointments?from=${hoyYmd}&to=${hoyYmd}&limit=50`)).data,
    enabled: notifOpen,
  })
  const turnosHoy = (apptData?.data ?? []).slice().sort((a: any, b: any) =>
    new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())

  const unread = totalSinLeer
  const goto = (href: string) => { setNotifOpen(false); setSearchOpen(false); router.push(href) }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 gap-3 sm:gap-4 flex-shrink-0 relative">
      <button onClick={toggleMobileNav} className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden" aria-label="Abrir menú">
        <Menu className="w-5 h-5" />
      </button>

      <span className="text-sm text-gray-500 hidden sm:block" suppressHydrationWarning>{hoy}</span>

      <div className="flex-1" />

      {/* Backdrop para cerrar popovers al tocar afuera */}
      {(searchOpen || notifOpen) && (
        <div className="fixed inset-0 z-30" onClick={() => { setSearchOpen(false); setNotifOpen(false) }} aria-hidden />
      )}

      {/* Búsqueda de pacientes */}
      <div className="relative z-40">
        <button
          onClick={() => { setSearchOpen((v) => !v); setNotifOpen(false) }}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Buscar paciente"
        >
          <Search className="w-5 h-5" />
        </button>
        {searchOpen && (
          <div className="absolute right-0 top-full mt-2 w-[min(90vw,360px)] bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar paciente por nombre, DNI o teléfono…"
                className="flex-1 text-sm outline-none bg-transparent"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500"><X className="w-4 h-4" /></button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {debounced.trim().length < 2 ? (
                <p className="px-4 py-6 text-center text-xs text-gray-400">Escribí al menos 2 caracteres</p>
              ) : searching ? (
                <p className="px-4 py-6 text-center text-xs text-gray-400">Buscando…</p>
              ) : resultados.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-gray-400">Sin resultados para “{debounced}”</p>
              ) : (
                resultados.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => goto(`/dashboard/pacientes/${p.id}`)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-brand-700">{(p.nombre?.[0] ?? '') + (p.apellido?.[0] ?? '')}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.nombre} {p.apellido}</p>
                      <p className="text-xs text-gray-400 truncate">{p.dni ? `DNI ${p.dni}` : ''}{p.dni && p.telefonoWhatsapp ? ' · ' : ''}{p.telefonoWhatsapp ?? ''}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notificaciones */}
      <div className="relative z-40">
        <button
          onClick={() => { setNotifOpen((v) => !v); setSearchOpen(false) }}
          className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-[min(92vw,340px)] bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">Notificaciones</p>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
              {/* WhatsApp sin leer */}
              <button onClick={() => goto('/dashboard/inbox')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">WhatsApp</p>
                  <p className="text-xs text-gray-500">
                    {totalSinLeer > 0
                      ? `${totalSinLeer} mensaje${totalSinLeer === 1 ? '' : 's'} sin leer en ${sinLeer.length} conversación${sinLeer.length === 1 ? '' : 'es'}`
                      : 'Sin mensajes nuevos'}
                  </p>
                </div>
                {totalSinLeer > 0 && <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />}
              </button>

              {/* Turnos de hoy */}
              <div className="px-4 py-3">
                <button onClick={() => goto('/dashboard/agenda')} className="flex items-center gap-3 w-full text-left">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">Turnos de hoy</p>
                    <p className="text-xs text-gray-500">{turnosHoy.length === 0 ? 'No hay turnos para hoy' : `${turnosHoy.length} turno${turnosHoy.length === 1 ? '' : 's'} agendado${turnosHoy.length === 1 ? '' : 's'}`}</p>
                  </div>
                </button>
                {turnosHoy.length > 0 && (
                  <ul className="mt-2 space-y-1 pl-12">
                    {turnosHoy.slice(0, 4).map((t: any) => (
                      <li key={t.id} className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="font-medium tabular-nums">{formatTime(t.fechaHora)}</span>
                        <span className="truncate">{t.patient ? `${t.patient.nombre} ${t.patient.apellido}` : 'Turno'}</span>
                      </li>
                    ))}
                    {turnosHoy.length > 4 && <li className="text-xs text-gray-400">y {turnosHoy.length - 4} más…</li>}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Avatar */}
      {user && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
            <span className="text-xs font-bold text-brand-700">{user.nombre[0]}{user.apellido[0]}</span>
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.nombre}</span>
        </div>
      )}
    </header>
  )
}
