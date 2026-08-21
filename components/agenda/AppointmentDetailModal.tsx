'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Check, Clock, UserX, CalendarX, Loader2, MessageCircle, Send } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useUIStore } from '@/stores/ui.store'
import { useUpdateAppointmentStatus } from '@/hooks/useAppointments'
import { formatDateTime, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { AppointmentStatus } from '@/types'

interface AppointmentDetail {
  id: string
  fechaHora: string
  duracionMin: number
  status: AppointmentStatus
  tipoTratamiento: string | null
  motivoConsulta: string | null
  canceladoMotivo: string | null
  patient?: { id: string; nombre: string; apellido: string; telefonoWhatsapp?: string | null }
  dentist?: { user?: { nombre: string; apellido: string } }
}

const ACCIONES: { status: AppointmentStatus; label: string; icon: any; clase: string }[] = [
  { status: 'CONFIRMADO', label: 'Confirmado', icon: Check, clase: 'border-green-200 text-green-700 hover:bg-green-50' },
  { status: 'ASISTIO', label: 'Asistió', icon: Check, clase: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' },
  { status: 'LLEGO_TARDE', label: 'Llegó tarde', icon: Clock, clase: 'border-orange-200 text-orange-700 hover:bg-orange-50' },
  { status: 'AUSENTE_CON_AVISO', label: 'Ausente (avisó)', icon: UserX, clase: 'border-gray-200 text-gray-600 hover:bg-gray-50' },
  { status: 'AUSENTE', label: 'Ausente (sin aviso)', icon: UserX, clase: 'border-gray-300 text-gray-700 hover:bg-gray-100' },
]

// Fecha/hora en formato lindo para las plantillas
function fechaLinda(iso: string): { fecha: string; hora: string } {
  const d = new Date(iso)
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    fecha: `${dias[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`,
    hora: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

export function AppointmentDetailModal() {
  const { modalData, closeModal } = useUIStore()
  const appointmentId = modalData.appointmentId as string
  const updateStatus = useUpdateAppointmentStatus()

  const [cancelMode, setCancelMode] = useState(false)
  const [motivo, setMotivo] = useState('')

  // WhatsApp
  const [waMode, setWaMode] = useState(false)
  const [waMsg, setWaMsg] = useState('')
  const [waSending, setWaSending] = useState(false)

  const { data: appt, isLoading } = useQuery<AppointmentDetail>({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => (await api.get(`/appointments/${appointmentId}`)).data,
    enabled: !!appointmentId,
  })

  function marcar(status: AppointmentStatus, motivoTexto?: string) {
    updateStatus.mutate(
      { id: appointmentId, status, motivo: motivoTexto },
      {
        onSuccess: () => {
          toast.success(`Turno marcado como "${STATUS_LABELS[status]}"`)
          closeModal()
        },
        onError: () => toast.error('No se pudo actualizar el turno'),
      },
    )
  }

  function confirmarCancelacion() {
    marcar('CANCELADO', motivo.trim() || undefined)
  }

  // Plantillas de WhatsApp (se completan con los datos del turno)
  function plantillas(): { label: string; texto: string }[] {
    if (!appt) return []
    const nombre = appt.patient?.nombre ?? ''
    const { fecha, hora } = fechaLinda(appt.fechaHora)
    return [
      { label: 'Recordatorio', texto: `Hola ${nombre}! Te recordamos tu turno el ${fecha} a las ${hora}. ¿Nos confirmás que podés asistir? 😊` },
      { label: 'Confirmación', texto: `Hola ${nombre}! Tu turno del ${fecha} a las ${hora} quedó confirmado. ¡Te esperamos! 🦷` },
      { label: 'Reprogramar', texto: `Hola ${nombre}, necesitamos reprogramar tu turno del ${fecha}. ¿Qué día te vendría bien?` },
      { label: 'Ya podés pasar', texto: `Hola ${nombre}! Ya podés acercarte al consultorio, te estamos esperando 🙂` },
    ]
  }

  async function enviarWhatsapp() {
    if (!appt?.patient?.telefonoWhatsapp) {
      toast.error('El paciente no tiene WhatsApp cargado')
      return
    }
    const message = waMsg.trim()
    if (!message) {
      toast.error('Escribí un mensaje o elegí una plantilla')
      return
    }
    setWaSending(true)
    try {
      await api.post('/whatsapp/send', { phone: appt.patient.telefonoWhatsapp, message })
      toast.success('Mensaje enviado por WhatsApp')
      setWaMode(false)
      setWaMsg('')
    } catch {
      toast.error('No se pudo enviar el mensaje')
    } finally {
      setWaSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeModal}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900">Turno</h2>
          <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {isLoading || !appt ? (
          <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 text-gray-300 animate-spin" /></div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Datos */}
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {appt.patient ? `${appt.patient.nombre} ${appt.patient.apellido}` : 'Paciente'}
              </p>
              <p className="text-sm text-gray-500">{formatDateTime(appt.fechaHora)} · {appt.duracionMin} min</p>
              {appt.tipoTratamiento && <p className="text-sm text-gray-500 mt-0.5">{appt.tipoTratamiento}</p>}
            </div>

            {/* Estado actual */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Estado:</span>
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', STATUS_COLORS[appt.status])}>
                {STATUS_LABELS[appt.status]}
              </span>
            </div>

            {appt.canceladoMotivo && (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-2">
                <span className="font-medium">Observación:</span> {appt.canceladoMotivo}
              </p>
            )}

            {cancelMode ? (
              /* Confirmación de cancelación */
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <label className="text-sm font-medium text-gray-700 block">Motivo de la cancelación (opcional)</label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder="Ej: el paciente reprogramó para la semana que viene"
                />
                <div className="flex gap-2">
                  <button onClick={() => setCancelMode(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">
                    Volver
                  </button>
                  <button onClick={confirmarCancelacion} disabled={updateStatus.isPending}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-60">
                    {updateStatus.isPending ? 'Cancelando...' : 'Cancelar turno'}
                  </button>
                </div>
              </div>
            ) : waMode ? (
              /* Panel de WhatsApp */
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Mensaje por WhatsApp</label>
                  {appt.patient?.telefonoWhatsapp
                    ? <span className="text-xs text-gray-400">{appt.patient.telefonoWhatsapp}</span>
                    : <span className="text-xs text-red-500">Sin WhatsApp cargado</span>}
                </div>

                {/* Plantillas */}
                <div className="flex flex-wrap gap-1.5">
                  {plantillas().map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setWaMsg(p.texto)}
                      className="px-2.5 py-1 rounded-full border border-gray-200 text-xs text-gray-600 hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={waMsg}
                  onChange={(e) => setWaMsg(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Elegí una plantilla o escribí un mensaje…"
                />

                <div className="flex gap-2">
                  <button onClick={() => { setWaMode(false); setWaMsg('') }} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">
                    Volver
                  </button>
                  <button
                    onClick={enviarWhatsapp}
                    disabled={waSending || !appt.patient?.telefonoWhatsapp}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-60"
                  >
                    {waSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {waSending ? 'Enviando…' : 'Enviar'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Acciones de asistencia */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Marcar asistencia</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ACCIONES.map((a) => {
                      const activo = appt.status === a.status
                      return (
                        <button
                          key={a.status}
                          onClick={() => marcar(a.status)}
                          disabled={updateStatus.isPending}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-60',
                            activo ? 'bg-gray-900 text-white border-gray-900' : a.clase,
                          )}
                        >
                          <a.icon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{a.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* WhatsApp */}
                <button
                  onClick={() => { setWaMsg(''); setWaMode(true) }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50"
                >
                  <MessageCircle className="w-4 h-4" /> Enviar WhatsApp
                </button>

                {/* Cancelar */}
                <button
                  onClick={() => { setMotivo(''); setCancelMode(true) }}
                  disabled={updateStatus.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 disabled:opacity-60"
                >
                  <CalendarX className="w-4 h-4" /> Cancelar turno
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
