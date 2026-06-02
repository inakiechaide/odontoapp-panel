'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Clock, Send, Save, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

interface ReminderSettings {
  id: string
  activo: boolean
  horaEnvio: string
  horasAntes: number
  plantilla: string
  ultimaEjecucionFecha: string | null
}

const PLACEHOLDERS = [
  { tag: '{nombre}', desc: 'Nombre del paciente' },
  { tag: '{apellido}', desc: 'Apellido' },
  { tag: '{fecha}', desc: 'Fecha del turno (DD/MM)' },
  { tag: '{hora}', desc: 'Hora del turno (HH:MM)' },
  { tag: '{tratamiento}', desc: 'Tipo de tratamiento' },
]

export default function RecordatoriosPage() {
  const qc = useQueryClient()
  const [activo, setActivo] = useState(true)
  const [horaEnvio, setHoraEnvio] = useState('18:00')
  const [plantilla, setPlantilla] = useState('')

  const { data: settings, isLoading } = useQuery<ReminderSettings>({
    queryKey: ['reminder-settings'],
    queryFn: async () => {
      const r = await api.get('/reminders/settings')
      return r.data
    },
  })

  useEffect(() => {
    if (settings) {
      setActivo(settings.activo)
      setHoraEnvio(settings.horaEnvio)
      setPlantilla(settings.plantilla)
    }
  }, [settings])

  const saveMut = useMutation({
    mutationFn: (data: Partial<ReminderSettings>) => api.put('/reminders/settings', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminder-settings'] })
      toast.success('Configuración guardada')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error al guardar'),
  })

  const runMut = useMutation({
    mutationFn: () => api.post('/reminders/run'),
    onSuccess: (res: any) => {
      const n = res?.data?.enviados ?? 0
      toast.success(n > 0 ? `${n} recordatorio(s) enviado(s)` : 'No hay turnos para mañana (o ya se enviaron)')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error al enviar'),
  })

  const handleSave = () => {
    if (!plantilla.trim()) return toast.error('La plantilla no puede estar vacía')
    saveMut.mutate({ activo, horaEnvio, plantilla })
  }

  const insertPlaceholder = (tag: string) => setPlantilla((p) => p + tag)

  const input = 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

  if (isLoading) return <div className="p-8 text-center text-gray-400">Cargando...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-brand-600" />
        <h1 className="text-xl font-bold text-gray-900">Recordatorios automáticos</h1>
      </div>

      <p className="text-sm text-gray-500">
        Cada día a la hora que elijas, el sistema envía por WhatsApp un recordatorio a todos
        los pacientes que tienen turno al día siguiente. A cada paciente se le envía una sola vez.
      </p>

      {/* Activar / desactivar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-800">Envío automático</p>
          <p className="text-sm text-gray-400 mt-0.5">
            {activo ? 'Activado — se envían solos cada día' : 'Desactivado — no se envía nada'}
          </p>
        </div>
        <button
          onClick={() => setActivo((a) => !a)}
          className={`relative w-12 h-6 rounded-full transition-colors ${activo ? 'bg-green-500' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${activo ? 'translate-x-6' : ''}`} />
        </button>
      </div>

      {/* Hora de envío */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="font-semibold text-gray-800 flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-gray-400" /> Hora de envío
        </label>
        <p className="text-sm text-gray-400 mb-3">
          A esta hora (cada día) se mandan los recordatorios de los turnos de mañana.
        </p>
        <input
          type="time"
          value={horaEnvio}
          onChange={(e) => setHoraEnvio(e.target.value)}
          className={`${input} w-40 text-base`}
        />
      </div>

      {/* Plantilla del mensaje */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="font-semibold text-gray-800 flex items-center gap-2 mb-1">
          <MessageSquare className="w-4 h-4 text-gray-400" /> Mensaje del recordatorio
        </label>
        <p className="text-sm text-gray-400 mb-3">
          Tocá un dato para insertarlo. Se reemplaza automáticamente con la info de cada paciente.
        </p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {PLACEHOLDERS.map((p) => (
            <button
              key={p.tag}
              onClick={() => insertPlaceholder(p.tag)}
              title={p.desc}
              className="px-2 py-1 bg-brand-50 text-brand-700 text-xs rounded-md hover:bg-brand-100 font-mono"
            >
              {p.tag}
            </button>
          ))}
        </div>
        <textarea
          value={plantilla}
          onChange={(e) => setPlantilla(e.target.value)}
          rows={5}
          className={`${input} w-full resize-none`}
          placeholder="Hola {nombre}! Te recordamos tu turno para mañana {fecha} a las {hora} hs..."
        />
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saveMut.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-60"
        >
          <Save className="w-4 h-4" /> {saveMut.isPending ? 'Guardando...' : 'Guardar configuración'}
        </button>
        <button
          onClick={() => runMut.mutate()}
          disabled={runMut.isPending}
          className="flex items-center gap-2 px-4 py-2.5 border border-green-300 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 disabled:opacity-60"
        >
          {runMut.isPending ? (
            <><div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /> Enviando...</>
          ) : (
            <><Send className="w-4 h-4" /> Enviar ahora (prueba)</>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-400">
        "Enviar ahora" manda inmediatamente los recordatorios de los turnos de mañana, sin esperar a la hora configurada (útil para probar).
      </p>
    </div>
  )
}
