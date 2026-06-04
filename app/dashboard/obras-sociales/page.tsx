'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Shield, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp,
  Phone, Mail, Globe, CheckCircle, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

const COLORES = ['#2563EB', '#16A34A', '#7C3AED', '#EA580C', '#0D9488', '#DB2777', '#D97706', '#0891B2']
const input = 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

interface ObraSocial {
  id: string
  codigo: string
  nombre: string
  planes: string[]
  telefono: string | null
  email: string | null
  sitioWeb: string | null
  cuit: string | null
  color: string
  notas: string | null
  activo: boolean
}
interface Treatment { id: string; nombre: string; codigoNomenclador: string | null }
interface Coverage {
  id: string
  treatmentId: string
  porcentajeCobertura: string | number
  requiereAutorizacion: boolean
  codigoPrestacion: string | null
  topeAnual: string | number | null
  treatment?: { nombre: string }
}

// ══════════════════════ Página principal ══════════════════════
export default function ObrasSocialesPage() {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ObraSocial | null>(null)

  // Form de obra social
  const [nombre, setNombre] = useState('')
  const [planesStr, setPlanesStr] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [sitioWeb, setSitioWeb] = useState('')
  const [cuit, setCuit] = useState('')
  const [color, setColor] = useState(COLORES[0])
  const [notas, setNotas] = useState('')
  const [activo, setActivo] = useState(true)

  const { data: obras, isLoading } = useQuery<ObraSocial[]>({
    queryKey: ['obras-sociales'],
    queryFn: async () => (await api.get('/obras-sociales')).data,
  })

  function abrirNuevo() {
    setEditing(null)
    setNombre(''); setPlanesStr(''); setTelefono(''); setEmail(''); setSitioWeb('')
    setCuit(''); setColor(COLORES[0]); setNotas(''); setActivo(true)
    setModalOpen(true)
  }
  function abrirEditar(os: ObraSocial) {
    setEditing(os)
    setNombre(os.nombre); setPlanesStr((os.planes ?? []).join(', '))
    setTelefono(os.telefono ?? ''); setEmail(os.email ?? ''); setSitioWeb(os.sitioWeb ?? '')
    setCuit(os.cuit ?? ''); setColor(os.color ?? COLORES[0]); setNotas(os.notas ?? ''); setActivo(os.activo)
    setModalOpen(true)
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = {
        nombre,
        planes: planesStr.split(',').map((p) => p.trim()).filter(Boolean),
        telefono: telefono || undefined,
        email: email || undefined,
        sitioWeb: sitioWeb || undefined,
        cuit: cuit || undefined,
        color, notas: notas || undefined, activo,
      }
      if (editing) return api.put(`/obras-sociales/${editing.id}`, body)
      return api.post('/obras-sociales', body)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['obras-sociales'] })
      setModalOpen(false)
      toast.success(editing ? 'Obra social actualizada' : 'Obra social creada')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'No se pudo guardar'),
  })

  const delMut = useMutation({
    mutationFn: (id: string) => api.delete(`/obras-sociales/${id}`),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['obras-sociales'] })
      const afectados = res?.data?.pacientesAfectados ?? 0
      toast.success(afectados > 0
        ? `Obra social dada de baja (${afectados} paciente/s la tenían asignada)`
        : 'Obra social dada de baja')
    },
    onError: () => toast.error('No se pudo dar de baja'),
  })

  function handleSave() {
    if (!nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    saveMut.mutate()
  }
  function handleDelete(os: ObraSocial) {
    if (confirm(`¿Dar de baja a ${os.nombre}? Los pacientes que la tengan asignada no se modifican.`)) {
      delMut.mutate(os.id)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-600" /> Obras Sociales
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Gestioná las obras sociales y la cobertura de cada prestación.
          </p>
        </div>
        <button onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Nueva obra social
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Cargando...</p>
      ) : !obras || obras.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <Shield className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay obras sociales cargadas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {obras.map((os) => (
            <div key={os.id} className={cn('bg-white rounded-xl border', !os.activo && 'opacity-60', expanded === os.id ? 'border-brand-300' : 'border-gray-200')}>
              {/* Cabecera de la tarjeta */}
              <div className="flex items-center gap-3 p-4">
                <span className="w-9 h-9 rounded-lg flex-shrink-0" style={{ backgroundColor: os.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{os.nombre}</p>
                    {!os.activo && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactiva</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-0.5">
                    {os.planes?.length > 0 && <span>{os.planes.length} plan{os.planes.length > 1 ? 'es' : ''}</span>}
                    {os.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{os.telefono}</span>}
                    {os.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{os.email}</span>}
                    {os.sitioWeb && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{os.sitioWeb}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => abrirEditar(os)} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg" title="Editar">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(os)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Dar de baja">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setExpanded(expanded === os.id ? null : os.id)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg" title="Cobertura">
                    {expanded === os.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Planes (chips) */}
              {os.planes?.length > 0 && (
                <div className="px-4 pb-3 -mt-1 flex flex-wrap gap-1.5">
                  {os.planes.map((p) => (
                    <span key={p} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{p}</span>
                  ))}
                </div>
              )}

              {/* Panel de cobertura */}
              {expanded === os.id && <CoberturaPanel obraSocial={os} />}
            </div>
          ))}
        </div>
      )}

      {/* Modal alta/edición de obra social */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="font-bold text-gray-900">{editing ? 'Editar obra social' : 'Nueva obra social'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nombre *</label>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={`${input} w-full`} placeholder="Swiss Medical" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Planes</label>
                <input value={planesStr} onChange={(e) => setPlanesStr(e.target.value)} className={`${input} w-full`} placeholder="210, 310, 450 (separados por coma)" />
                <p className="text-xs text-gray-400 mt-1">Separá los planes con comas.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Teléfono</label>
                  <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={`${input} w-full`} placeholder="0800-..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">CUIT</label>
                  <input value={cuit} onChange={(e) => setCuit(e.target.value)} className={`${input} w-full`} placeholder="30-xxxxxxxx-x" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className={`${input} w-full`} placeholder="contacto@os.com" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Sitio web</label>
                  <input value={sitioWeb} onChange={(e) => setSitioWeb(e.target.value)} className={`${input} w-full`} placeholder="www.os.com.ar" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORES.map((c) => (
                    <button key={c} onClick={() => setColor(c)}
                      className={cn('w-8 h-8 rounded-full transition-transform', color === c && 'ring-2 ring-offset-2 ring-gray-400 scale-110')}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Notas</label>
                <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className={`${input} w-full resize-none`} placeholder="Datos de facturación, observaciones..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <button onClick={() => setActivo((a) => !a)} type="button"
                  className={cn('relative w-10 h-5 rounded-full transition-colors', activo ? 'bg-green-500' : 'bg-gray-300')}>
                  <span className={cn('absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform', activo && 'translate-x-5')} />
                </button>
                <span className="text-sm text-gray-700">Activa</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Cancelar</button>
              <button onClick={handleSave} disabled={saveMut.isPending}
                className="px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-60">
                {saveMut.isPending ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════ Panel de cobertura por obra social ══════════════════════
function CoberturaPanel({ obraSocial }: { obraSocial: ObraSocial }) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [treatmentId, setTreatmentId] = useState('')
  const [pct, setPct] = useState('100')
  const [reqAuth, setReqAuth] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [tope, setTope] = useState('')

  const { data: coverage, isLoading } = useQuery<Coverage[]>({
    queryKey: ['coverage', obraSocial.codigo],
    queryFn: async () => (await api.get(`/insurance/coverage/${obraSocial.codigo}`)).data,
  })
  const { data: treatments } = useQuery<Treatment[]>({
    queryKey: ['insurance-treatments'],
    queryFn: async () => (await api.get('/insurance/treatments')).data,
    staleTime: 300_000,
  })

  function resetForm() {
    setEditId(null); setTreatmentId(''); setPct('100'); setReqAuth(false); setCodigo(''); setTope('')
    setShowForm(false)
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = {
        obraSocial: obraSocial.codigo,
        treatmentId,
        porcentajeCobertura: Number(pct),
        requiereAutorizacion: reqAuth,
        codigoPrestacion: codigo || undefined,
        topeAnual: tope ? Number(tope) : null,
      }
      if (editId) return api.put(`/insurance/coverage/${editId}`, body)
      return api.post('/insurance/coverage', body)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coverage', obraSocial.codigo] })
      resetForm()
      toast.success('Cobertura guardada')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'No se pudo guardar'),
  })

  const delMut = useMutation({
    mutationFn: (id: string) => api.delete(`/insurance/coverage/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coverage', obraSocial.codigo] })
      toast.success('Prestación eliminada')
    },
    onError: () => toast.error('No se pudo eliminar'),
  })

  function editarFila(c: Coverage) {
    setEditId(c.id); setTreatmentId(c.treatmentId)
    setPct(String(Number(c.porcentajeCobertura))); setReqAuth(c.requiereAutorizacion)
    setCodigo(c.codigoPrestacion ?? ''); setTope(c.topeAnual != null ? String(Number(c.topeAnual)) : '')
    setShowForm(true)
  }
  function handleSave() {
    if (!treatmentId) { toast.error('Elegí un tratamiento'); return }
    const p = Number(pct)
    if (isNaN(p) || p < 0 || p > 100) { toast.error('El porcentaje debe estar entre 0 y 100'); return }
    saveMut.mutate()
  }

  // Tratamientos que aún no tienen cobertura cargada (para el alta)
  const usados = new Set((coverage ?? []).map((c) => c.treatmentId))
  const disponibles = (treatments ?? []).filter((t) => editId || !usados.has(t.id))

  return (
    <div className="border-t border-gray-100 p-4 bg-gray-50/50 rounded-b-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Cobertura por prestación</h3>
        {!showForm && (
          <button onClick={() => { resetForm(); setShowForm(true) }}
            className="flex items-center gap-1 text-xs text-brand-600 font-medium hover:text-brand-700">
            <Plus className="w-3.5 h-3.5" /> Agregar prestación
          </button>
        )}
      </div>

      {/* Form alta/edición */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3 space-y-2.5">
          <div className="grid sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Tratamiento</label>
              <select value={treatmentId} onChange={(e) => setTreatmentId(e.target.value)} disabled={!!editId} className={`${input} w-full disabled:bg-gray-100`}>
                <option value="">Elegí un tratamiento</option>
                {disponibles.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Cobertura %</label>
              <input type="number" min={0} max={100} value={pct} onChange={(e) => setPct(e.target.value)} className={`${input} w-full`} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Código de prestación</label>
              <input value={codigo} onChange={(e) => setCodigo(e.target.value)} className={`${input} w-full`} placeholder="Nomenclador" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Tope anual ($)</label>
              <input type="number" value={tope} onChange={(e) => setTope(e.target.value)} className={`${input} w-full`} placeholder="Opcional" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={reqAuth} onChange={(e) => setReqAuth(e.target.checked)} className="rounded" />
            <span className="text-sm text-gray-700">Requiere autorización previa</span>
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={resetForm} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={handleSave} disabled={saveMut.isPending}
              className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700 disabled:opacity-60">
              {saveMut.isPending ? 'Guardando...' : editId ? 'Guardar' : 'Agregar'}
            </button>
          </div>
        </div>
      )}

      {/* Listado de cobertura */}
      {isLoading ? (
        <p className="text-xs text-gray-400 py-2">Cargando cobertura...</p>
      ) : !coverage || coverage.length === 0 ? (
        <p className="text-xs text-gray-400 py-2">Sin prestaciones cargadas para esta obra social.</p>
      ) : (
        <div className="space-y-1.5">
          {coverage.map((c) => {
            const p = Number(c.porcentajeCobertura)
            return (
              <div key={c.id} className="flex items-center gap-3 bg-white rounded-lg border border-gray-100 px-3 py-2 text-sm">
                <span className="flex-1 font-medium text-gray-700">{c.treatment?.nombre ?? '—'}</span>
                <span className={cn('font-bold', p >= 80 ? 'text-green-600' : p >= 50 ? 'text-amber-600' : 'text-red-500')}>{p.toFixed(0)}%</span>
                {c.requiereAutorizacion
                  ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full"><AlertCircle className="w-3 h-3" />Autoriz.</span>
                  : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"><CheckCircle className="w-3 h-3" />Directa</span>}
                {c.codigoPrestacion && <span className="text-xs text-gray-400 font-mono hidden sm:inline">{c.codigoPrestacion}</span>}
                {c.topeAnual != null && <span className="text-xs text-gray-400 hidden md:inline">${Number(c.topeAnual).toLocaleString('es-AR')}/año</span>}
                <button onClick={() => editarFila(c)} className="p-1 text-gray-400 hover:text-brand-600"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => { if (confirm('¿Eliminar esta prestación?')) delMut.mutate(c.id) }} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
