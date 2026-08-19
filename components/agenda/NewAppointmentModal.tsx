'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Search, Clock, User, Calendar, Stethoscope, FileText } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useUIStore } from '@/stores/ui.store'
import { useCreateAppointment, useSlots } from '@/hooks/useAppointments'
import { cn } from '@/lib/utils'

interface Patient {
  id: string
  nombre: string
  apellido: string
  telefonoWhatsapp: string | null
  obraSocial: string | null
}

interface Dentist {
  id: string
  nombre?: string
  apellido?: string
  user?: { nombre?: string; apellido?: string }
  firstName?: string
  lastName?: string
}

const DURATIONS = [5, 10, 15, 20, 30, 45, 60, 90]

// Nombre del profesional, tolerante a distintas formas de la API
function dentistLabel(d: Dentist): string {
  const nombre = d.nombre ?? d.user?.nombre ?? d.firstName ?? ''
  const apellido = d.apellido ?? d.user?.apellido ?? d.lastName ?? ''
  const full = `${nombre} ${apellido}`.trim()
  return full ? `Dr/a. ${full}` : 'Profesional'
}

// Extrae "YYYY-MM-DD" y "HH:MM" de un ISO/fecha sin depender de la zona horaria del server
function splitPrefill(iso?: string): { fecha: string; hora: string } {
  if (!iso) return { fecha: '', hora: '' }
  const d = new Date(iso)
  if (isNaN(d.getTime())) return { fecha: '', hora: '' }
  const pad = (n: number) => String(n).padStart(2, '0')
  const fecha = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  return { fecha, hora }
}

export function NewAppointmentModal() {
  const { closeModal, selectedDentistId, modalData } = useUIStore()
  const createAppointment = useCreateAppointment()

  // Horario preseleccionado desde el "+" de la agenda
  const prefill = useMemo(
    () => splitPrefill((modalData as any)?.prefillDate),
    [modalData],
  )

  const [step, setStep] = useState<'patient' | 'details'>('patient')
  const [search, setSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [dentistId, setDentistId] = useState(selectedDentistId ?? '')
  const [fecha, setFecha] = useState(prefill.fecha)
  const [hora, setHora] = useState(prefill.hora)
  const [duracionMin, setDuracionMin] = useState(30)
  const [motivoConsulta, setMotivoConsulta] = useState('')
  const [tipoTratamiento] = useState('')

  // Aplicar horario preseleccionado (fecha/hora) al abrir desde un slot
  useEffect(() => {
    if (prefill.fecha) setFecha(prefill.fecha)
    if (prefill.hora) setHora(prefill.hora)
  }, [prefill.fecha, prefill.hora])

  // Predeterminar el profesional: primero el del slot clickeado, si no el de la agenda
  useEffect(() => {
    const fromSlot = (modalData as any)?.prefillDentistId
    if (fromSlot) setDentistId(fromSlot)
    else if (selectedDentistId) setDentistId(selectedDentistId)
  }, [modalData, selectedDentistId])

  // Búsqueda de pacientes
  const { data: patients, isLoading: searchingPatients } = useQuery<Patient[]>({
    queryKey: ['patients-search', search],
    queryFn: async () => (await api.get('/patients/search', { params: { q: search } })).data ?? [],
    enabled: search.length >=2,
  })

  // Dentistas
  const { data: dentists } = useQuery<Dentist[]>({
    queryKey: ['dentists'],
    queryFn: async () => (await api.get('/dentists')).data,
  })

  // Slots disponibles
  const fechaObj = fecha ? new Date(`${fecha}T00:00:00`) : null
  const { data: slots, isLoading: loadingSlots } = useSlots(dentistId, fechaObj, duracionMin)

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setStep('details')
  }

  const handleSubmit = async () => {
    if (!selectedPatient || !dentistId || !fecha || !hora) {
      toast.error('Completá todos los campos obligatorios')
      return
    }

    const fechaHora = new Date(`${fecha}T${hora}:00`)
    try {
      await createAppointment.mutateAsync({
        patientId: selectedPatient.id,
        dentistId,
        fechaHora: fechaHora.toISOString(),
        duracionMin,
        motivoConsulta: motivoConsulta || undefined,
        tipoTratamiento: tipoTratamiento || undefined,
      })
      toast.success('Turno creado correctamente')
      closeModal()
    } catch {
      toast.error('No se pudo crear el turno')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={closeModal}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {step === 'patient' ? 'Seleccionar paciente' : 'Nuevo turno'}
          </h2>
          <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'patient' ? (
            <div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, apellido o DNI…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                />
              </div>

              {search.length < 2 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Escribí al menos 2 caracteres para buscar
                </p>
              ) : searchingPatients ? (
                <p className="text-sm text-gray-400 text-center py-8">Buscando…</p>
              ) : patients && patients.length > 0 ? (
                <div className="space-y-1.5">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50/40 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-brand-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {patient.nombre} {patient.apellido}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {patient.obraSocial || 'Sin obra social'}
                            {patient.telefonoWhatsapp ? ` · ${patient.telefonoWhatsapp}` : ''}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">
                  No se encontraron pacientes
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Paciente seleccionado */}
              <div className="flex items-center gap-3 p-3 bg-brand-50/60 rounded-lg border border-brand-100">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-brand-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">
                    {selectedPatient?.nombre} {selectedPatient?.apellido}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {selectedPatient?.obraSocial || 'Sin obra social'}
                  </p>
                </div>
                <button
                  onClick={() => setStep('patient')}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  Cambiar
                </button>
              </div>

              {/* Dentista */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <Stethoscope className="w-4 h-4 text-gray-400" /> Profesional
                </label>
                <select
                  value={dentistId}
                  onChange={(e) => setDentistId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                >
                  <option value="">Elegí un profesional</option>
                  {dentists?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {dentistLabel(d)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha y duración */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" /> Fecha
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <Clock className="w-4 h-4 text-gray-400" /> Duración
                  </label>
                  <select
                    value={duracionMin}
                    onChange={(e) => setDuracionMin(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                  >
                    {DURATIONS.map((d) => (
                      <option key={d} value={d}>{d} minutos</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Horario seleccionado + slots disponibles */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <Clock className="w-4 h-4 text-gray-400" /> Horario
                </label>
                <input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                />
                {!fecha || !dentistId ? (
                  <p className="text-xs text-gray-400">Elegí profesional y fecha para ver horarios disponibles</p>
                ) : loadingSlots ? (
                  <p className="text-xs text-gray-400">Cargando horarios…</p>
                ) : slots && slots.length > 0 ? (
                  <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto">
                    {slots.filter((s: any) => s.disponible !== false).map((slot: any) => {
                      const slotHora = slot.horaDisplay ?? slot.hora ?? slot
                      const activo = hora === slotHora
                      return (
                        <button
                          key={slotHora}
                          type="button"
                          onClick={() => setHora(slotHora)}
                          className={cn(
                            'px-2 py-1.5 text-xs rounded-lg border transition-all',
                            activo
                              ? 'bg-brand-600 text-white border-brand-600'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300 hover:bg-brand-50',
                          )}
                        >
                          {slotHora}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-amber-600">No hay horarios disponibles para ese día</p>
                )}
              </div>

              {/* Motivo */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <FileText className="w-4 h-4 text-gray-400" /> Motivo de la consulta
                </label>
                <input
                  type="text"
                  placeholder="Ej: Control, limpieza, dolor…"
                  value={motivoConsulta}
                  onChange={(e) => setMotivoConsulta(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'details' && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={createAppointment.isPending}
              className="px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-60 transition-colors"
            >
              {createAppointment.isPending ? 'Creando…' : 'Crear turno'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
