'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Calendar, Users, Package, MessageSquare,
  TrendingUp, AlertTriangle, CheckCircle, Clock
} from 'lucide-react'
import api from '@/lib/api'
import { formatDate, formatTime, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Appointment } from '@/types'
import { useLowStockAlerts } from '@/hooks/useData'
import Link from 'next/link'
import { format } from 'date-fns'

function StatCard({
  title, value, icon: Icon, color, subtitle, href
}: {
  title: string; value: string | number; icon: React.ElementType
  color: string; subtitle?: string; href?: string
}) {
  const content = (
    <div className={cn(
      'bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow',
      href && 'cursor-pointer'
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={cn('p-2 rounded-lg', color)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

export default function DashboardPage() {
  const today = format(new Date(), 'yyyy-MM-dd')

  // Turnos de hoy
  const { data: todayAppointments } = useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: async () => {
      const res = await api.get('/appointments', {
        params: { from: today, to: today, limit: 50 }
      })
      return res.data
    },
    staleTime: 60_000,
  })

  // Stock bajo
  const { data: lowStock } = useLowStockAlerts()

  // Conversaciones activas
  const { data: conversations } = useQuery({
    queryKey: ['conversations', 'inbox-count'],
    queryFn: async () => {
      const res = await api.get('/conversations', { params: { status: 'HUMANO', limit: 1 } })
      return res.data
    },
    refetchInterval: 10_000,
  })

  const appointments: Appointment[] = todayAppointments?.data ?? []
  const confirmed = appointments.filter((a) => a.status === 'CONFIRMADO').length
  const pending = appointments.filter((a) => a.status === 'PENDIENTE').length
  const humanConversations = conversations?.meta?.total ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">{formatDate(new Date(), "EEEE d 'de' MMMM yyyy")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Turnos hoy"
          value={appointments.length}
          icon={Calendar}
          color="bg-blue-50 text-blue-600"
          subtitle={`${confirmed} confirmados`}
          href="/dashboard/agenda"
        />
        <StatCard
          title="Sin confirmar"
          value={pending}
          icon={Clock}
          color="bg-amber-50 text-amber-600"
          subtitle="Pendientes de hoy"
        />
        <StatCard
          title="WhatsApp"
          value={humanConversations}
          icon={MessageSquare}
          color="bg-green-50 text-green-600"
          subtitle="Requieren atención"
          href="/dashboard/inbox"
        />
        <StatCard
          title="Stock bajo"
          value={lowStock?.length ?? 0}
          icon={Package}
          color="bg-red-50 text-red-600"
          subtitle="Insumos críticos"
          href="/dashboard/inventario"
        />
      </div>

      {/* Turnos del día */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Agenda de hoy</h2>
          <Link href="/dashboard/agenda" className="text-sm text-brand-600 hover:underline">
            Ver agenda completa →
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No hay turnos para hoy</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {appointments.slice(0, 8).map((appt) => (
              <div key={appt.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                <div className="text-center w-14 flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{formatTime(appt.fechaHora)}</p>
                  <p className="text-xs text-gray-400">{appt.duracionMin}min</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {appt.patient.nombre} {appt.patient.apellido}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {appt.tipoTratamiento || 'Consulta'} · {appt.dentist.user.nombre} {appt.dentist.user.apellido}
                  </p>
                </div>
                <span className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0',
                  STATUS_COLORS[appt.status]
                )}>
                  {STATUS_LABELS[appt.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alertas de stock */}
      {(lowStock?.length ?? 0) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="font-semibold text-red-800">Insumos con stock bajo</h2>
          </div>
          <div className="space-y-2">
            {lowStock!.slice(0, 4).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-red-700">{item.nombre}</span>
                <span className="text-red-600 font-medium">
                  {Number(item.stockActual).toFixed(1)} / mín {Number(item.stockMinimo).toFixed(1)} {item.unidadMedida}
                </span>
              </div>
            ))}
          </div>
          <Link href="/dashboard/inventario" className="mt-3 inline-block text-sm text-red-600 underline">
            Ver inventario completo
          </Link>
        </div>
      )}
    </div>
  )
}
