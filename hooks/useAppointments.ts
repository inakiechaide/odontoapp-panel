import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import api from '@/lib/api'
import type { Appointment, AppointmentStatus, DayAgenda, TimeSlot } from '@/types'

// ── Keys ─────────────────────────────────────────────────────────
export const appointmentKeys = {
  all: ['appointments'] as const,
  agenda: (dentistId: string, date: string) => ['agenda', dentistId, date] as const,
  slots: (dentistId: string, date: string, duration: number) =>
    ['slots', dentistId, date, duration] as const,
  list: (filters: Record<string, unknown>) => ['appointments', 'list', filters] as const,
}

// ── Agenda del día ────────────────────────────────────────────────
export function useAgenda(dentistId: string, date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd')
  return useQuery({
    queryKey: appointmentKeys.agenda(dentistId, dateStr),
    queryFn: async () => {
      const res = await api.get<DayAgenda>('/appointments/agenda', {
        params: { dentistId, date: dateStr },
      })
      return res.data
    },
    enabled: !!dentistId,
    staleTime: 30_000,
  })
}

// ── Slots disponibles ─────────────────────────────────────────────
export function useSlots(dentistId: string, date: Date | null, duration = 30) {
  const dateStr = date ? format(date, 'yyyy-MM-dd') : ''
  return useQuery({
    queryKey: appointmentKeys.slots(dentistId, dateStr, duration),
    queryFn: async () => {
      const res = await api.get<TimeSlot[]>('/appointments/slots', {
        params: { dentistId, date: dateStr, durationMin: duration },
      })
      return res.data
    },
    enabled: !!dentistId && !!date,
  })
}

// ── Lista de turnos ───────────────────────────────────────────────
export function useAppointments(filters: {
  dentistId?: string
  patientId?: string
  status?: AppointmentStatus
  from?: string
  to?: string
  page?: number
}) {
  return useQuery({
    queryKey: appointmentKeys.list(filters),
    queryFn: async () => {
      const res = await api.get('/appointments', { params: filters })
      return res.data
    },
    staleTime: 30_000,
  })
}

// ── Crear turno ───────────────────────────────────────────────────
export function useCreateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      patientId: string
      dentistId: string
      fechaHora: string
      duracionMin?: number
      tipoTratamiento?: string
      motivoConsulta?: string
      precioParticular?: number
      precioObraSocial?: number
    }) => {
      const res = await api.post<Appointment>('/appointments', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all })
    },
  })
}

// ── Actualizar estado ─────────────────────────────────────────────
export function useUpdateAppointmentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      motivo,
    }: {
      id: string
      status: AppointmentStatus
      motivo?: string
    }) => {
      const res = await api.put<Appointment>(`/appointments/${id}/status`, {
        status,
        motivo,
      })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all })
    },
  })
}
