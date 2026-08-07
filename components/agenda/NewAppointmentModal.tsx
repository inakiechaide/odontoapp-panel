'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { X, Search, Calendar, Clock, User, Stethoscope } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useCreateAppointment, useSlots } from '@/hooks/useAppointments'
import { useSearchPatients } from '@/hooks/useData'
import { useUIStore } from '@/stores/ui.store'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Patient, DentistProfile, Treatment } from '@/types'

const schema = z.object({
  patientId: z.string().min(1, 'Seleccioná un paciente'),
  dentistId: z.string().min(1, 'Seleccioná un odontólogo'),
  fecha: z.string().min(1, 'Seleccioná una fecha'),
  slotStart: z.string().min(1, 'Seleccioná un horario'),
  duracionMin: z.number().default(30),
  tipoTratamiento: z.string().optional(),
  motivoConsulta: z.string().optional(),
  piezasDentarias: z.array(z.number()).optional(),
})
type FormData = z.infer<typeof schema>

const TIPOS_TRATAMIENTO = [
  'Consulta inicial', 'Control', 'Limpieza/Profilaxis', 'Caries', 'Obturación',
  'Extracción simple', 'Extracción compleja', 'Endodoncia', 'Corona', 'Puente',
  'Implante', 'Ortodoncia', 'Blanqueamiento', 'Cirugía', 'Urgencia',
  'Periodoncia', 'Pedodoncia', 'Radiografía', 'Presupuesto'
]

// Piezas FDI para selección rápida
const FDI_PIECES = {
  'Superior derecho (1X)': [18,17,16,15,14,13,12,11],
  'Superior izquierdo (2X)': [21,22,23,24,25,26,27,28],
  'Inferior izquierdo (3X)': [31,32,33,34,35,36,37,38],
  'Inferior derecho (4X)': [41,42,43,44,45,46,47,48],
}

export function NewAppointmentModal() {
  const { closeModal, modalData } = useUIStore()
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [selectedPiezas, setSelectedPiezas] = useState<number[]>([])
  const [showPiezas, setShowPiezas] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      duracionMin: 30,
      fecha: modalData?.prefillDate
        ? format(new Date(modalData.prefillDate as string), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
    }
  })

  const watchFecha = watch('fecha')
  const watchDentistId = watch('dentistId')
  const watchDuracion = watch('duracionMin')

  // Buscar pacientes
  const { data: patients } = useSearchPatients(patientSearch)

  // Listar dentistas
  const { data: dentists } = useQuery({
    queryKey: ['dentists'],
    queryFn: async () => {
      const res = await api.get('/dentists')
      return res.data as DentistProfile[]
    }
  })

  // Auto-seleccionar dentista si solo hay uno
  useEffect(() => {
    if (dentists?.length === 1) {
      setValue('dentistId', dentists[0].id)
    }
  }, [dentists, setValue])

  // Slots disponibles
  const { data: slots, isLoading: slotsLoading } = useSlots(
    watchDentistId,
    watchFecha ? new Date(watchFecha + 'T12:00:00') : null,
    watchDuracion
  )

  const createAppointment = useCreateAppointment()

  const onSubmit = async (data: FormData) => {
    try {
      await createAppointment.mutateAsync({
        patientId: data.patientId,
        dentistId: data.dentistId,
        fechaHora: data.slotStart,
        duracionMin: data.duracionMin,
        tipoTratamiento: data.tipoTratamiento,
        motivoConsulta: data.motivoConsulta,
      })
      toast.success('¡Turno creado exitosamente!')
      closeModal()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Error al crear el turno')
    }
  }

  const togglePieza = (num: number) => {
    setSelectedPiezas(prev =>
      prev.includes(num) ? prev.filter(p => p !== num) : [...prev, num]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-600" />
            Nuevo turno
          </h2>
          <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto p-5 space-y-5 flex-1">

            {/* Buscar paciente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <User className="w-4 h-4 inline mr-1" />
                Paciente *
              </label>
              {selectedPatient ? (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-800">{selectedPatient.nombre} {selectedPatient.apellido}</p>
                    <p className="text-xs text-blue-600">DNI: {selectedPatient.dni || '—'} · {selectedPatient.telefonoWhatsapp || '—'}</p>
                  </div>
                  <button type="button" onClick={() => { setSelectedPatient(null); setValue('patientId', '') }}
                    className="text-xs text-blue-600 hover:text-blue-800 underline">Cambiar</button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Buscar por nombre o DNI..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {patients && patients.length > 0 && patientSearch && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 shadow-lg z-10 max-h-48 overflow-y-auto">
                      {patients.map(p => (
                        <button key={p.id} type="button"
                          onClick={() => { setSelectedPatient(p); setValue('patientId', p.id); setPatientSearch('') }}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                          <p className="text-sm font-medium">{p.nombre} {p.apellido}</p>
                          <p className="text-xs text-gray-400">DNI: {p.dni || '—'}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {errors.patientId && <p className="text-red-500 text-xs mt-1">{errors.patientId.message}</p>}
            </div>

            {/* Odontólogo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Stethoscope className="w-4 h-4 inline mr-1" />
                Odontólogo *
              </label>
              <select {...register('dentistId')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Seleccioná un odontólogo</option>
                {dentists?.map(d => (
                  <option key={d.id} value={d.id}>
                    {(d as any).user?.nombre} {(d as any).user?.apellido} — {(d as any).matricula}
                  </option>
                ))}
              </select>
              {errors.dentistId && <p className="text-red-500 text-xs mt-1">{errors.dentistId.message}</p>}
            </div>

            {/* Fecha y duración */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha *</label>
                <input type="date" {...register('fecha')}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                {errors.fecha && <p className="text-red-500 text-xs mt-1">{errors.fecha.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Duración</label>
                <select {...register('duracionMin', { valueAsNumber: true })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value={5}>5 minutos</option>
                  <option value={10}>10 minutos</option>
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={90}>1h 30min</option>
                  <option value={120}>2 horas</option>
                </select>
              </div>
            </div>

            {/* Slots disponibles */}
            {watchFecha && watchDentistId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Horario disponible *
                </label>
                {slotsLoading ? (
                  <div className="text-center py-4 text-gray-400 text-sm">Consultando disponibilidad...</div>
                ) : !slots || slots.length === 0 ? (
                  <div className="text-center py-4 text-amber-600 text-sm bg-amber-50 rounded-lg border border-amber-200">
                    Sin turnos disponibles para este día
                  </div>
                ) : (
                  <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto">
                    {slots.filter((s: any) => s.disponible !== false).map((slot: any) => {
                      const slotTime = format(parseISO(slot.start), 'HH:mm')
                      const isSelected = watch('slotStart') === slot.start
                      return (
                        <button
                          key={slot.start}
                          type="button"
                          onClick={() => setValue('slotStart', slot.start)}
                          className={cn(
                            'px-2 py-1.5 text-xs rounded-lg border font-medium transition-all',
                            isSelected
                              ? 'bg-brand-600 text-white border-brand-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-brand-400 hover:bg-brand-50'
                          )}
                        >
                          {slotTime}
                        </button>
                      )
                    })}
                  </div>
                )}
                {errors.slotStart && <p className="text-red-500 text-xs mt-1">{errors.slotStart.message}</p>}
              </div>
            )}

            {/* Tipo de tratamiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de tratamiento</label>
              <select {...register('tipoTratamiento')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Seleccioná un tratamiento</option>
                {TIPOS_TRATAMIENTO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Piezas dentarias FDI */}
            <div>
              <button type="button"
                onClick={() => setShowPiezas(!showPiezas)}
                className="text-sm font-medium text-brand-600 hover:text-brand-800 underline">
                {showPiezas ? '▾' : '▸'} Piezas dentarias involucradas (FDI)
                {selectedPiezas.length > 0 && <span className="ml-2 text-gray-600">→ {selectedPiezas.sort((a,b)=>a-b).join(', ')}</span>}
              </button>
              {showPiezas && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  {Object.entries(FDI_PIECES).map(([cuadrante, piezas]) => (
                    <div key={cuadrante}>
                      <p className="text-xs text-gray-500 mb-1.5 font-medium">{cuadrante}</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {piezas.map(num => (
                          <button key={num} type="button"
                            onClick={() => togglePieza(num)}
                            className={cn(
                              'w-9 h-9 text-xs font-bold rounded border-2 transition-all',
                              selectedPiezas.includes(num)
                                ? 'bg-brand-600 text-white border-brand-700 scale-110'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'
                            )}>
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {selectedPiezas.length > 0 && (
                    <p className="text-xs text-brand-700 font-medium">
                      Seleccionadas: {selectedPiezas.sort((a,b)=>a-b).join(' · ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Motivo / notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivo de consulta</label>
              <textarea {...register('motivoConsulta')} rows={2}
                placeholder="Descripción breve del motivo..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-5 border-t border-gray-100">
            <button type="button" onClick={closeModal}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={createAppointment.isPending}
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors">
              {createAppointment.isPending ? 'Creando turno...' : 'Confirmar turno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
