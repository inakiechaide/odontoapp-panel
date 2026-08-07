'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, Save } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

interface ScheduleDay {
  diaSemana: number
  horaInicio: string
  horaFin: string
  duracionSlotMin: number
  activo: boolean
}

interface ScheduleResponse {
  dias: ScheduleDay[]
  ultimaModificacion: { fecha: string; por: string | null } | null
}

const DIAS: Record<number, string> = { 1: 'Lunes', 2: 'Martes', 3: 'Miercoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sabado', 0: 'Domingo' }
const ORDEN = [1, 2, 3, 4, 5, 6, 0]
const DURACIONES = [5, 10, 15, 20, 30, 40, 45, 60, 90, 120]

function diaPorDefecto(diaSemana: number): ScheduleDay {
  return { diaSemana, horaInicio: '09:00', horaFin: '18:00', duracionSlotMin: 30, activo: false }
}

export default function ScheduleCard({ dentistId = 'me', titulo }: { dentistId?: string; titulo?: string }) {
  const qc = useQueryClient()
  const [dias, setDias] = useState<ScheduleDay[]>([])

  const { data, isLoading } = useQuery<ScheduleResponse>({
    queryKey: ['schedules', dentistId],
    queryFn: async () => (await api.get(`/schedules/${dentistId}`)).data,
  })

  useEffect(() => {
    const base = ORDEN.map((d) => data?.dias?.find((x) => x.diaSemana === d) ?? diaPorDefecto(d))
    setDias(base)
  }, [data])

  const guardar = useMutation({
    mutationFn: async () => (await api.put(`/schedules/${dentistId}`, { dias })).data,
    onSuccess: () => {
      toast.success('Franja horaria guardada')
      qc.invalidateQueries({ queryKey: ['schedules', dentistId] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'No se pudo guardar la franja'),
  })

  function actualizar(diaSemana: number, patch: Partial<ScheduleDay>) {
    setDias((prev) => prev.map((d) => (d.diaSemana === diaSemana ? { ...d, ...patch } : d)))
  }

  const ultima = data?.ultimaModificacion

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
        <CalendarClock className="w-5 h-5 text-indigo-500" /> {titulo ?? 'Franja horaria'}
      </h2>
      <p className="text-sm text-gray-400 mb-5">Configura los dias y horarios de atencion.</p>

      {isLoading ? (
        <p className="text-sm text-gray-400">Cargando...</p>
      ) : (
        <div className="space-y-2">
          {dias.map((d) => (
            <div key={d.diaSemana} className="flex items-center gap-3 py-1 text-sm">
              <label className="flex items-center gap-2 w-28 shrink-0">
                <input type="checkbox" checked={d.activo} onChange={(e) => actualizar(d.diaSemana, { activo: e.target.checked })} />
                <span className={d.activo ? 'font-medium text-gray-900' : 'text-gray-400'}>{DIAS[d.diaSemana]}</span>
              </label>
              <input type="time" value={d.horaInicio} disabled={!d.activo} onChange={(e) => actualizar(d.diaSemana, { horaInicio: e.target.value })} className="border border-gray-200 rounded-lg px-2 py-1 disabled:opacity-40" />
              <span className="text-gray-400">a</span>
              <input type="time" value={d.horaFin} disabled={!d.activo} onChange={(e) => actualizar(d.diaSemana, { horaFin: e.target.value })} className="border border-gray-200 rounded-lg px-2 py-1 disabled:opacity-40" />
              <select value={d.duracionSlotMin} disabled={!d.activo} onChange={(e) => actualizar(d.diaSemana, { duracionSlotMin: Number(e.target.value) })} className="border border-gray-200 rounded-lg px-2 py-1 disabled:opacity-40">
                {DURACIONES.map((m) => (<option key={m} value={m}>{m} min</option>))}
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-5">
        <span className="text-xs text-gray-400">
          {ultima ? `Ultima modificacion: ${ultima.por ?? 'desconocido'} - ${new Date(ultima.fecha).toLocaleString('es-AR')}` : 'Sin modificaciones registradas'}
        </span>
        <button onClick={() => guardar.mutate()} disabled={guardar.isPending} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm">
          <Save className="w-4 h-4" /> {guardar.isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
