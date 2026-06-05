'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Odontogram, type OdontogramMark } from '@/components/odontogram/Odontogram'
import { ArrowLeft, Phone, Shield, AlertTriangle, Edit2, Check, X, Pill, Save } from 'lucide-react'
import Link from 'next/link'
import { usePatient, useUpdatePatient } from '@/hooks/useData'
import { useAppointments } from '@/hooks/useAppointments'
import { formatDate, formatDateTime, INSURANCE_LABELS, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import api from '@/lib/api'
import { EstudiosTab } from '@/components/patients/EstudiosTab'

type Tab = 'datos' | 'turnos' | 'tratamientos' | 'estudios' | 'odontograma'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const INSURANCE_OPTIONS = Object.entries(INSURANCE_LABELS)

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>('datos')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [odontogramData, setOdontogramData] = useState<OdontogramMark[]>([])
  const [odontogramDirty, setOdontogramDirty] = useState(false)
  const [savingOdo, setSavingOdo] = useState(false)

  const isValidUUID = UUID_REGEX.test(id ?? '')
  const { data: patient, isLoading } = usePatient(isValidUUID ? id : '')
  const updatePatient = useUpdatePatient(id)
  const { data: appointments } = useAppointments(
    isValidUUID ? { patientId: id, limit: 50 } as any : {} as any
  )

  // Cargar odontograma desde el servidor
  useEffect(() => {
    if (!isValidUUID) return
    api.get(`/patients/${id}/odontogram`)
      .then(res => setOdontogramData(res.data ?? []))
      .catch(() => {})
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
      direccion: patient.direccion ?? '',
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
        direccion: form.direccion || undefined,
        alergias: form.alergias ? form.alergias.split(',').map(s => s.trim()).filter(Boolean) : [],
        notasMedicas: form.notasMedicas || undefined,
      } as any)
      setEditing(false)
      toast.success('Datos del paciente actualizados')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar')
    }
  }

  const handleOdontogramChange = (data: OdontogramMark[]) => {
    setOdontogramData(data)
    setOdontogramDirty(true)
  }

  const handleOdontogramSave = async () => {
    setSavingOdo(true)
    try {
      await api.put(`/patients/${id}/odontogram`, { marks: odontogramData })
      setOdontogramDirty(false)
      toast.success('Odontograma guardado')
    } catch {
      toast.error('No se pudo guardar el odontograma')
    } finally {
      setSavingOdo(false)
    }
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
        {(['datos', 'turnos', 'tratamientos', 'estudios', 'odontograma'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
            {t === 'datos' ? 'Datos personales' : t === 'turnos' ? 'Historial de turnos' : t === 'tratamientos' ? 'Tratamientos' : t === 'estudios' ? 'Estudios y fotos' : 'Odontograma'}
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
                ['WhatsApp', 'telefonoWhatsapp'], ['Dirección', 'direccion'], ['Localidad', 'localidad'], ['Provincia', 'provincia'],
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

      {tab === 'estudios' && <EstudiosTab patientId={id} />}

      {/* ODONTOGRAMA */}
      {tab === 'odontograma' && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-gray-500">{odontogramDirty ? 'Tenés cambios sin guardar' : 'Odontograma al día'}</p>
            <button onClick={handleOdontogramSave} disabled={savingOdo || !odontogramDirty}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 disabled:opacity-50">
              <Save className="w-3.5 h-3.5" /> {savingOdo ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
          <Odontogram value={odontogramData} onChange={handleOdontogramChange} />
        </div>
      )}
    </div>
  )
}

function TratamientosTab({ patientId }: { patientId: string }) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ treatmentId: '', status: 'EN_CURSO', notasClinicas: '', presupuestoArs: '', dientes: '' })

  const { data: catalogo } = useQuery({
    queryKey: ['treatments-catalog'],
    queryFn: async () => { const r = await api.get('/treatments'); return r.data as any[] },
    staleTime: 300_000,
  })

  const { data: tratamientos, isLoading } = useQuery({
    queryKey: ['patient-treatments', patientId],
    queryFn: async () => { const r = await api.get(`/treatments/patient/${patientId}`); return r.data as any[] },
    enabled: !!patientId,
  })

  const createMut = useMutation({
    mutationFn: (d: any) => api.post(`/treatments/patient/${patientId}`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient-treatments', patientId] })
      setShowForm(false)
      setForm({ treatmentId: '', status: 'EN_CURSO', notasClinicas: '', presupuestoArs: '', dientes: '' })
      toast.success('Tratamiento registrado')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error al registrar'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: any) => api.put(`/treatments/${id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient-treatments', patientId] }); toast.success('Actualizado') },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/treatments/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient-treatments', patientId] }); toast.success('Eliminado') },
  })

  const handleCreate = () => {
    if (!form.treatmentId) return toast.error('Seleccioná un tratamiento')
    createMut.mutate({
      treatmentId: form.treatmentId,
      status: form.status,
      notasClinicas: form.notasClinicas || undefined,
      presupuestoArs: form.presupuestoArs ? Number(form.presupuestoArs) : undefined,
      dientesAfectados: form.dientes ? form.dientes.split(',').map(s => parseInt(s.trim())).filter(Boolean) : [],
    })
  }

  const STATUS_OPTS = [
    { v: 'EN_CURSO', l: 'En curso' },
    { v: 'COMPLETADO', l: 'Completado' },
    { v: 'PAUSADO', l: 'Pausado' },
    { v: 'CANCELADO', l: 'Cancelado' },
  ]

  const input = 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-full'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Tratamientos clínicos</h3>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700">
          <Pill className="w-3.5 h-3.5" /> Registrar tratamiento
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h4 className="font-medium text-gray-800 text-sm">Nuevo tratamiento</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Tratamiento *</label>
              <select value={form.treatmentId} onChange={e => setForm(f => ({...f, treatmentId: e.target.value}))} className={input}>
                <option value="">Seleccioná...</option>
                {catalogo?.map((t: any) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Estado</label>
              <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className={input}>
                {STATUS_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Presupuesto $</label>
              <input type="number" value={form.presupuestoArs} onChange={e => setForm(f => ({...f, presupuestoArs: e.target.value}))} className={input} placeholder="0.00" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Piezas dentarias (números FDI, separados por coma)</label>
              <input value={form.dientes} onChange={e => setForm(f => ({...f, dientes: e.target.value}))} className={input} placeholder="11, 21, 36..." />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Notas clínicas</label>
              <textarea value={form.notasClinicas} onChange={e => setForm(f => ({...f, notasClinicas: e.target.value}))} rows={2} className={`${input} resize-none`} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
            <button onClick={handleCreate} disabled={createMut.isPending} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm disabled:opacity-60">
              {createMut.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-gray-400 text-sm">Cargando...</div>
        ) : !tratamientos || tratamientos.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Pill className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Sin tratamientos registrados</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Tratamiento</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Piezas</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Presupuesto</th>
              <th className="px-4 py-3 w-10"/>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {tratamientos.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-700">
                    {t.treatment?.nombre ?? '—'}
                    {t.notasClinicas && <p className="text-xs text-gray-400 mt-0.5">{t.notasClinicas}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{t.dientesAfectados?.join(', ') || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={t.status}
                      onChange={e => updateMut.mutate({ id: t.id, status: e.target.value })}
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                    >
                      {STATUS_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {t.presupuestoArs ? `$${Number(t.presupuestoArs).toLocaleString('es-AR')}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteMut.mutate(t.id)} className="text-red-400 hover:text-red-600">✕</button>
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
