'use client'

import { useState, useMemo } from 'react'
import {
  startOfWeek, endOfWeek, eachDayOfInterval, addWeeks,
  subWeeks, format, isSameDay, isToday, parseISO, addMinutes
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react'
import { cn, formatTime, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import { useAgenda } from '@/hooks/useAppointments'
import { useUIStore } from '@/stores/ui.store'
import type { Appointment, AppointmentStatus } from '@/types'

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8) // 8 a 18

interface DayColumnProps {
  date: Date
  dentistId: string
  onSlotClick: (date: Date, hour: number) => void
  onAppointmentClick: (appt: { id: string; start: string; end: string; patientNombre: string; status: AppointmentStatus }) => void
}

function DayColumn({ date, dentistId, onSlotClick, onAppointmentClick }: DayColumnProps) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const { data: agenda, isLoading } = useAgenda(dentistId, date)

  const todayClass = isToday(date) ? 'bg-brand-50 border-brand-200' : ''

  return (
    <div className={cn('flex-1 min-w-0 border-r border-gray-100 last:border-r-0', todayClass)}>
      {/* Header del día */}
      <div className={cn(
        'py-2 px-2 text-center border-b border-gray-100 sticky top-0 bg-white z-10',
        isToday(date) && 'bg-brand-50'
      )}>
        <p className="text-xs text-gray-400 uppercase">
          {format(date, 'EEE', { locale: es })}
        </p>
        <p className={cn(
          'text-lg font-bold mt-0.5',
          isToday(date) ? 'text-brand-600' : 'text-gray-800'
        )}>
          {format(date, 'd')}
        </p>
        {agenda?.esFeriado && (
          <span className="text-xs text-red-500">{agenda.nombreFeriado}</span>
        )}
      </div>

      {/* Slots de hora */}
      <div className="relative">
        {HOURS.map((hour) => {
          const appts = agenda?.turnosExistentes.filter((a) => {
            const h = parseISO(a.start).getHours()
            return h === hour
          }) ?? []

          return (
            <div
              key={hour}
              className="h-14 border-b border-gray-50 relative group cursor-pointer hover:bg-gray-50/50 px-1"
              onClick={() => !agenda?.esFeriado && onSlotClick(date, hour)}
            >
              {/* Turnos de esta hora */}
              {appts.map((appt) => (
                <div
                  key={appt.id}
                  onClick={(e) => { e.stopPropagation(); onAppointmentClick(appt) }}
                  className={cn(
                    'absolute left-1 right-1 top-0.5 bottom-0.5 rounded px-1.5 py-0.5 text-xs cursor-pointer',
                    'border hover:opacity-80 transition-opacity overflow-hidden',
                    STATUS_COLORS[appt.status]
                  )}
                >
                  <p className="font-medium truncate">{appt.patientNombre}</p>
                  <p className="opacity-70">{formatTime(appt.start)}</p>
                </div>
              ))}

              {/* Botón agregar en hover */}
              {appts.length === 0 && !agenda?.esFeriado && (
                <div className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-full transition-opacity">
                  <Plus className="w-4 h-4 text-gray-300" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function WeekView() {
  const { agendaDate, setAgendaDate, selectedDentistId, openModal } = useUIStore()
  const [selectedAppt, setSelectedAppt] = useState<string | null>(null)

  const weekStart = startOfWeek(agendaDate, { weekStartsOn: 1 }) // Lunes
  const weekEnd = endOfWeek(agendaDate, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }).slice(0, 5) // Solo Lun-Vie

  const handleSlotClick = (date: Date, hour: number) => {
    const dateTime = new Date(date)
    dateTime.setHours(hour, 0, 0, 0)
    openModal('new-appointment', { prefillDate: dateTime.toISOString() })
  }

  const handleAppointmentClick = (appt: any) => {
    setSelectedAppt(appt.id)
    openModal('appointment-detail', { appointmentId: appt.id })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAgendaDate(subWeeks(agendaDate, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-sm font-semibold text-gray-900">
            {format(weekStart, "d 'de' MMMM", { locale: es })} –{' '}
            {format(weekEnd, "d 'de' MMMM yyyy", { locale: es })}
          </h2>
          <button
            onClick={() => setAgendaDate(addWeeks(agendaDate, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setAgendaDate(new Date())}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            Hoy
          </button>
        </div>
        <button
          onClick={() => openModal('new-appointment')}
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
          <div className="h-[72px] border-b border-gray-100" />
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-14 border-b border-gray-50 flex items-start justify-end pr-2 pt-1"
            >
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
