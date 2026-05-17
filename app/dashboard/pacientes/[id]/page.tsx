'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Odontogram, type ToothState } from '@/components/odontogram/Odontogram'
import { ArrowLeft, Phone, Shield, AlertTriangle, Edit2, Check, X, Pill, Save } from 'lucide-react'
import Link from 'next/link'
import { usePatient, useUpdatePatient } from '@/hooks/useData'
import { useAppointments } from '@/hooks/useAppointments'
import { formatDate, formatDateTime, INSURANCE_LABELS, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import api from '@/lib/api'

type Tab = 'datos' | 'turnos' | 'tratamientos' | 'odontograma'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const INSURANCE_OPTIONS = Object.entries(INSURANCE_LABELS)

// Guardar odontograma en localStorage (por patientId)
function loadOdontogram(patientId: string): Record<number, ToothState> {
  try { return JSON.parse(localStorage.getItem(`odontogram_${patientId}`) ?? '{}') } catch { return {} }
}
function saveOdontogram(patientId: string, data: Record<number, ToothState>) {
  try { localStorage.setItem(`odontogram_${patientId}`, JSON.stringify(data)) } catch {}
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>('datos')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [odontogramData, setOdontogramData] = useState<Record<number, ToothState>>({})

  const isValidUUID = UUID_REGEX.test(id ?? '')
  const { data: patient, isLoading } = usePatient(isValidUUID ? id : '')
  const updatePatient = useUpdatePatient(id)
  const { data: appointments } = useAppointments(
    isValidUUID ? { patientId: id, limit: 50 } as any : {} as any
  )

  // Cargar odontograma desde localStorage al montar
  useEffect(() => {
    if (isValidUUID) setOdontogramData(loadOdontogram(id))
  }, [id, isValidUUID])

  // Cargar form cuando llega el paciente
  useEffect(() => {
    if (patient) setForm({
      nombre: patient.nombre ?? '',
      apellido: patient.apellido ?? '',
      dni: patient.dni ?? '',
      cuil: patient.cuil ?? '',
      email: patient.email ?? '',
      telefonoWhatsapp: patient.telefonoWhatsapp ?? '',
      fechaNacimiento: patient.fechaNacimiento ? formatDate(patient.fechaNacimiento) : '',
      obraSocial: patient.obraSocial ?? '',
      nroAfiliado: patient.nroAfiliado ?? '',
      planObraSocial: patient.planObraSocial ?? '',
      localidad: patient.localidad ?? '',
      provincia: patient.provincia ?? '',
      alergias: patient.alergias?.join(', ') ?? '',
      notasMedicas: patient.notasMedicas ?? '',
    })
  }, [patient])

  if (!isValidUUID) return (
    <div className="p-8 text-center text-gray-400">
      <p className="text-lg mb-2">ID de paciente inválido</p>
      <Link href="/dashboard/pacientes" className="text-brand-600 underline">← Volver</Link>
    </div>
  )

  if (isLoading) return <div className="p-8 text-center text-gray-400">Cargando...</div>
  if (!patient) return (
    <div className="p-8 text-center text-gray-400">
      <p className="mb-2">Paciente no encontrado</p>
      <Link href="/dashboard/pacientes" className="text-brand-600 underline">← Volver</Link>
    </div>
  )

  const appts = appointments?.data ?? []
  const input = 'px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-full'

  const handleSave = async () => {
    try {
      await updatePatient.mutateAsync({
        nombre: form.nombre,
        apellido: form.apellido,
        dni: form.dni || undefined,
        email: form.email || undefined,
        telefonoWhatsapp: form.telefonoWhatsapp || undefined,
        obraSocial: form.obraSocial || undefined,
        nroAfiliado: form.nroAfiliado || undefined,
        planObraSocial: form.planObraSocial || undefined,
        localidad: form.localidad || undefined,
        provincia: form.provincia || undefined,
        alergias: form.alergias ? form.alergias.split(',').map(s => s.trim()).filter(Boolean) : [],
        notasMedicas: form.notasMedicas || undefined,
      } as any)
      setEditing(false)
      toast.success('Datos del paciente actualizados')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar')
    }
  }

  const handleOdontogramChange = (data: Record<number, ToothState>) => {
    setOdontogramData(data)
    saveOdontogram(id, data)
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/pacientes" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-xl font-bold text-brand-700">
            {patient.nombre[0]}{patient.apellido[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{patient.nombre} {patient.apellido}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {patient.obraSocial && (
                <span className="flex items-center gap-1 text-sm text-brand-600">
                  <Shield className="w-3.5 h-3.5" />
                  {INSURANCE_LABELS[patient.obraSocial] ?? patient.obraSocial}
                  {patient.nroAfiliado && ` · ${patient.nroAfiliado}`}
                </span>
              )}
              {patient.telefonoWhatsapp && (
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Phone className="w-3.5 h-3.5" />{patient.telefonoWhatsapp}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['datos', 'turnos', 'tratamientos', 'odontograma'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
            {t === 'datos' ? 'Datos personales' : t === 'turnos' ? 'Historial de turnos' : t === 'tratamientos' ? 'Tratamientos' : 'Odontograma'}
          </button>
        ))}
      </div>

      {/* DATOS PERSONALES */}
      {tab === 'datos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            {editing ? (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
                <button onClick={handleSave} disabled={updatePatient.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-60">
                  <Save className="w-3.5 h-3.5" /> {updatePatient.isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                <Edit2 className="w-3.5 h-3.5" /> Editar datos
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Datos personales</h3>
              {[
                ['Nombre', 'nombre'], ['Apellido', 'apellido'],
                ['DNI', 'dni'], ['Email', 'email'],
                ['WhatsApp', 'telefonoWhatsapp'], ['Localidad', 'localidad'], ['Provincia', 'provincia'],
              ].map(([label, key]) => (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-xs text-gray-400 font-medium">{label}</span>
                  {editing ? (
                    <input value={form[key] ?? ''} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} className={input} />
                  ) : (
                    <span className="text-sm text-gray-800">{(patient as any)[key] ?? '—'}</span>
                  )}
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-400 font-medium">Obra Social</span>
                {editing ? (
                  <select value={form.obraSocial ?? ''} onChange={e => setForm(f => ({...f, obraSocial: e.target.value}))} className={input}>
                    <option value="">Particular</option>
                    {INSURANCE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                ) : (
                  <span className="text-sm text-gray-800">{patient.obraSocial ? (INSURANCE_LABELS[patient.obraSocial] ?? patient.obraSocial) : 'Particular'}</span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {patient.alergias && patient.alergias.length > 0 && !editing && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="font-semibold text-amber-800 text-sm flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-4 h-4" /> Alergias
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {patient.alergias.map(a => (
                      <span key={a} className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {editing && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-400 font-medium">Alergias (separadas por coma)</span>
                    <input value={form.alergias ?? ''} onChange={e => setForm(f => ({...f, alergias: e.target.value}))} className={input} placeholder="Penicilina, Ibuprofeno..." />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-400 font-medium">Notas médicas</span>
                    <textarea value={form.notasMedicas ?? ''} onChange={e => setForm(f => ({...f, notasMedicas: e.target.value}))} rows={3} className={`${input} resize-none`} />
                  </div>
                </div>
              )}
              {!editing && patient.notasMedicas && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="font-semibold text-gray-700 text-sm mb-2">Notas médicas</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{patient.notasMedicas}</p>
                </div>
              )}
              <p className="text-xs text-gray-400">
                Alta: {formatDateTime(patient.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HISTORIAL DE TURNOS */}
      {tab === 'turnos' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {appts.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Sin turnos registrados</div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Fecha y hora</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tratamiento</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Motivo</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {appts.map((a: any) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700 font-medium">{formatDateTime(a.fechaHora)}</td>
                    <td className="px-4 py-3 text-gray-600">{a.tipoTratamiento || 'Consulta'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', (STATUS_COLORS as any)[a.status] ?? 'bg-gray-100 text-gray-600')}>
                        {(STATUS_LABELS as any)[a.status] ?? a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{a.motivoConsulta || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TRATAMIENTOS */}
      {tab === 'tratamientos' && <TratamientosTab patientId={id} />}

      {/* ODONTOGRAMA */}
      {tab === 'odontograma' && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-gray-500">Los cambios se guardan automáticamente en este dispositivo</p>
            <button onClick={() => { saveOdontogram(id, odontogramData); toast.success('Odontograma guardado') }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700">
              <Save className="w-3.5 h-3.5" /> Guardar
            </button>
          </div>
          <Odontogram value={odontogramData} onChange={handleOdontogramChange} />
        </div>
      )}
    </div>
  )
}

function TratamientosTab({ patientId }: { patientId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ descripcion: '', status: 'EN_CURSO', piezas: '' })

  const { data: tratamientos, refetch } = useQuery({
    queryKey: ['patient-appointments-treatments', patientId],
    queryFn: async () => {
      const res = await api.get(`/appointments?patientId=${patientId}&limit=100`)
      return (res.data?.data ?? []).filter((a: any) => a.tipoTratamiento)
    },
    enabled: !!patientId,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Tratamientos realizados</h3>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {!tratamientos || tratamientos.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Pill className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Sin tratamientos registrados</p>
            <p className="text-xs mt-1">Los tratamientos se registran al crear un turno</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Tratamiento</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Estado turno</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {tratamientos.map((a: any) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-700">{a.tipoTratamiento}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{formatDateTime(a.fechaHora)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', (STATUS_COLORS as any)[a.status] ?? 'bg-gray-100')}>
                      {(STATUS_LABELS as any)[a.status] ?? a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
