'use client'

import { useState } from 'react'
import {
  startOfWeek, endOfWeek, eachDayOfInterval, addWeeks,
  subWeeks, format, isToday, parseISO
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { cn, formatTime, STATUS_COLORS } from '@/lib/utils'
import { useAgenda } from '@/hooks/useAppointments'
import { useUIStore } from '@/stores/ui.store'
import type { AppointmentStatus } from '@/types'

const START_HOUR = 8
const END_HOUR = 20 // última fila = 20:00 (cubre turnos hasta las 21)
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR)
const HOUR_HEIGHT = 64 // px por hora (1 min = HOUR_HEIGHT/60 px)
const HEADER_HEIGHT = 72 // alto del encabezado del día

type Turno = {
  id: string
  start: string
  end: string
  patientNombre: string
  status: AppointmentStatus
}

// Minutos desde el inicio de la grilla (hora local AR del navegador)
function minsFromStart(iso: string): number {
  const d = parseISO(iso)
  return (d.getHours() - START_HOUR) * 60 + d.getMinutes()
}

// Asigna columnas a turnos que se superponen para que todos sean visibles
function layout(turnos: Turno[]): (Turno & { s: number; e: number; col: number; cols: number })[] {
  const evs = turnos
    .map((t) => ({ ...t, s: minsFromStart(t.start), e: minsFromStart(t.end) }))
    .sort((a, b) => a.s - b.s || a.e - b.e)

  const out: (Turno & { s: number; e: number; col: number; cols: number })[] = []
  let cluster: typeof evs = []
  let clusterEnd = -Infinity

  const flush = () => {
    if (!cluster.length) return
    const columns: (typeof evs)[] = []
    for (const ev of cluster) {
      let placed = false
      for (let c = 0; c < columns.length; c++) {
        const last = columns[c][columns[c].length - 1]
        if (last.e <= ev.s) { columns[c].push(ev); (ev as any).col = c; placed = true; break }
      }
      if (!placed) { (ev as any).col = columns.length; columns.push([ev]) }
    }
    const cols = columns.length
    for (const ev of cluster) out.push({ ...(ev as any), cols })
    cluster = []
    clusterEnd = -Infinity
  }

  for (const ev of evs) {
    if (cluster.length && ev.s >= clusterEnd) flush()
    cluster.push(ev)
    clusterEnd = Math.max(clusterEnd, ev.e)
  }
  flush()
  return out
}

interface DayColumnProps {
  date: Date
  dentistId: string
  onSlotClick: (date: Date, hour: number) => void
  onAppointmentClick: (appt: Turno) => void
}

function DayColumn({ date, dentistId, onSlotClick, onAppointmentClick }: DayColumnProps) {
  const { data: agenda, isLoading } = useAgenda(dentistId, date)
  const isWeekend = date.getDay() === 0 || date.getDay() === 6

  // Fin de semana: mostrar SOLO si el odontólogo trabaja ese día o si hay turnos
  if (isWeekend) {
    if (isLoading) return null
    const trabaja = agenda?.esDiaLaboral || (agenda?.turnosExistentes?.length ?? 0) > 0
    if (!trabaja) return null
  }

  const turnos = agenda?.turnosExistentes ?? []
  const laid = layout(turnos)
  const gridHeight = HOURS.length * HOUR_HEIGHT

  return (
    <div className={cn('flex-1 min-w-0 border-r border-gray-100 last:border-r-0', isToday(date) && 'bg-brand-50/40')}>
      {/* Header del día */}
      <div
        className={cn('px-2 text-center border-b border-gray-100 sticky top-0 bg-white z-10 flex flex-col items-center justify-center', isToday(date) && 'bg-brand-50')}
        style={{ height: HEADER_HEIGHT }}
      >
        <p className="text-xs text-gray-400 uppercase">{format(date, 'EEE', { locale: es })}</p>
        <p className={cn('text-lg font-bold mt-0.5', isToday(date) ? 'text-brand-600' : 'text-gray-800')}>
          {format(date, 'd')}
        </p>
        {agenda?.esFeriado && <span className="text-xs text-red-500 leading-none">{agenda.nombreFeriado}</span>}
      </div>

      {/* Grilla del día */}
      <div className="relative" style={{ height: gridHeight }}>
        {/* Celdas de hora (fondo + click para agregar) */}
        {HOURS.map((hour, i) => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-b border-gray-50 group cursor-pointer hover:bg-gray-50/50"
            style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
            onClick={() => !agenda?.esFeriado && onSlotClick(date, hour)}
          >
            <div className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-full transition-opacity">
              <Plus className="w-4 h-4 text-gray-300" />
            </div>
          </div>
        ))}

        {/* Turnos posicionados por horario */}
        {laid.map((t) => {
          const top = Math.max(0, t.s) / 60 * HOUR_HEIGHT
          const height = Math.max(16, (t.e - t.s) / 60 * HOUR_HEIGHT - 2)
          const widthPct = 100 / t.cols
          const leftPct = t.col * widthPct
          const compact = height < 34
          return (
            <div
              key={t.id}
              onClick={(e) => { e.stopPropagation(); onAppointmentClick(t) }}
              className={cn(
                'absolute rounded px-1.5 py-0.5 text-xs cursor-pointer border hover:opacity-80 transition-opacity overflow-hidden leading-tight',
                STATUS_COLORS[t.status]
              )}
              style={{
                top,
                height,
                left: `calc(${leftPct}% + 2px)`,
                width: `calc(${widthPct}% - 4px)`,
              }}
              title={`${t.patientNombre} · ${formatTime(t.start)}–${formatTime(t.end)}`}
            >
              <p className="font-medium truncate">{t.patientNombre}</p>
              {!compact && <p className="opacity-70">{formatTime(t.start)}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function WeekView() {
  const { agendaDate: agendaDateRaw, setAgendaDate, selectedDentistId, openModal } = useUIStore()
  const agendaDate = agendaDateRaw ?? new Date()
  const [, setSelectedAppt] = useState<string | null>(null)

  const weekStart = startOfWeek(agendaDate, { weekStartsOn: 1 }) // Lunes
  const weekEnd = endOfWeek(agendaDate, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }) // Lun a Dom (7 días)

  const handleSlotClick = (date: Date, hour: number) => {
    const dateTime = new Date(date)
    dateTime.setHours(hour, 0, 0, 0)
    openModal('new-appointment', { prefillDate: dateTime.toISOString() })
  }

  const handleAppointmentClick = (appt: Turno) => {
    setSelectedAppt(appt.id)
    openModal('appointment-detail', { appointmentId: appt.id })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => setAgendaDate(subWeeks(agendaDate, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-sm font-semibold text-gray-900">
            {format(weekStart, "d 'de' MMMM", { locale: es })} –{' '}
            {format(weekEnd, "d 'de' MMMM yyyy", { locale: es })}
          </h2>
          <button onClick={() => setAgendaDate(addWeeks(agendaDate, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={() => setAgendaDate(new Date())} className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
            Hoy
          </button>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openModal('new-appointment') }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo turno
        </button>
      </div>

      {/* Grid */}
      <div className="flex overflow-auto">
        {/* Columna de horas */}
        <div className="w-14 flex-shrink-0 border-r border-gray-100">
          <div style={{ height: HEADER_HEIGHT }} className="border-b border-gray-100" />
          {HOURS.map((hour) => (
            <div key={hour} style={{ height: HOUR_HEIGHT }} className="border-b border-gray-50 flex items-start justify-end pr-2 pt-1">
              <span className="text-xs text-gray-400">{hour}:00</span>
            </div>
          ))}
        </div>

        {/* Columnas por día */}
        {weekDays.map((day) => (
          <DayColumn
            key={day.toISOString()}
            date={day}
            dentistId={selectedDentistId ?? ''}
            onSlotClick={handleSlotClick}
            onAppointmentClick={handleAppointmentClick}
          />
        ))}
      </div>
    </div>
  )
}
