'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Stethoscope, Plus, Pencil, Trash2, X, Clock, BadgeCheck } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

// ── Tipos ─────────────────────────────────────────────────────────
interface Schedule {
  id?: string
  diaSemana: number
  horaInicio: string
  horaFin: string
  duracionSlotMin?: number
}
interface Dentist {
  id: string
  matricula: string | null
  especialidad: string | null
  colorAgenda: string | null
  user: { id: string; nombre: string; apellido: string; email: string; active: boolean }
  schedules: Schedule[]
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const COLORES = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

// Prisma @db.Time llega como "1970-01-01T09:00:00.000Z" → "09:00"
function timeStr(t: any): string {
  if (!t) return ''
  const s = String(t)
  if (s.includes('T')) {
    const d = new Date(s)
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
  }
  return s.slice(0, 5)
}

// ── Form state por día ────────────────────────────────────────────
interface DiaForm {
  activo: boolean
  horaInicio: string
  horaFin: string
  duracionSlotMin: number
}
const diaVacio = (): DiaForm => ({ activo: false, horaInicio: '09:00', horaFin: '18:00', duracionSlotMin: 30 })

export default function OdontologosPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Dentist | null>(null)

  // Campos del formulario
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [matricula, setMatricula] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [color, setColor] = useState(COLORES[0])
  const [dias, setDias] = useState<DiaForm[]>(() => Array.from({ length: 7 }, diaVacio))

  const input = 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

  const { data: dentists, isLoading } = useQuery<Dentist[]>({
    queryKey: ['dentists'],
    queryFn: async () => (await api.get('/dentists')).data,
  })

  function abrirNuevo() {
    setEditing(null)
    setNombre(''); setApellido(''); setMatricula(''); setEspecialidad(''); setColor(COLORES[0])
    // Lun-Vie por defecto activos 9-18
    setDias(Array.from({ length: 7 }, (_, i) => {
      const d = diaVacio()
      if (i >= 1 && i <= 5) d.activo = true
      return d
    }))
    setModalOpen(true)
  }

  function abrirEditar(d: Dentist) {
    setEditing(d)
    setNombre(d.user.nombre); setApellido(d.user.apellido)
    setMatricula(d.matricula ?? ''); setEspecialidad(d.especialidad ?? '')
    setColor(d.colorAgenda ?? COLORES[0])
    const base = Array.from({ length: 7 }, diaVacio)
    for (const s of d.schedules) {
      base[s.diaSemana] = {
        activo: true,
        horaInicio: timeStr(s.horaInicio),
        horaFin: timeStr(s.horaFin),
        duracionSlotMin: s.duracionSlotMin ?? 30,
      }
    }
    setDias(base)
    setModalOpen(true)
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const schedules: Schedule[] = dias
        .map((d, i) => ({ ...d, diaSemana: i }))
        .filter((d) => d.activo)
        .map((d) => ({
          diaSemana: d.diaSemana,
          horaInicio: d.horaInicio,
          horaFin: d.horaFin,
          duracionSlotMin: d.duracionSlotMin,
        }))
      const body = {
        nombre, apellido,
        matricula: matricula || undefined,
        especialidad: especialidad || undefined,
        colorAgenda: color,
        schedules,
      }
      if (editing) return api.put(`/dentists/${editing.id}`, body)
      return api.post('/dentists', body)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dentists'] })
      setModalOpen(false)
      toast.success(editing ? 'Odontólogo actualizado' : 'Odontólogo creado')
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || 'No se pudo guardar')
    },
  })

  const delMut = useMutation({
    mutationFn: (id: string) => api.delete(`/dentists/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dentists'] })
      toast.success('Odontólogo dado de baja')
    },
    onError: () => toast.error('No se pudo dar de baja'),
  })

  function handleSave() {
    if (!nombre.trim() || !apellido.trim()) {
      toast.error('Nombre y apellido son obligatorios')
      return
    }
    const algunDia = dias.some((d) => d.activo)
    if (!algunDia) {
      toast.error('Marcá al menos un día de atención')
      return
    }
    // Validar que inicio < fin en los días activos
    for (let i = 0; i < 7; i++) {
      if (dias[i].activo && dias[i].horaInicio >= dias[i].horaFin) {
        toast.error(`En ${DIAS[i]} la hora de inicio debe ser menor a la de fin`)
        return
      }
    }
    saveMut.mutate()
  }

  function handleDelete(d: Dentist) {
    if (confirm(`¿Dar de baja a ${d.user.nombre} ${d.user.apellido}? No se borra el historial de turnos.`)) {
      delMut.mutate(d.id)
    }
  }

  function toggleDia(i: number) {
    setDias((prev) => prev.map((d, idx) => (idx === i ? { ...d, activo: !d.activo } : d)))
  }
  function setDiaCampo(i: number, campo: keyof DiaForm, val: any) {
    setDias((prev) => prev.map((d, idx) => (idx === i ? { ...d, [campo]: val } : d)))
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-brand-600" /> Odontólogos
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Alta, baja y modificación. Los odontólogos activos aparecen al cargar un turno.
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" /> Nuevo odontólogo
        </button>
      </div>

      {/* Listado */}
      {isLoading ? (
        <p className="text-sm text-gray-400">Cargando...</p>
      ) : !dentists || dentists.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <Stethoscope className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Todavía no hay odontólogos cargados</p>
          <p className="text-sm text-gray-400 mt-1">Creá el primero para poder asignarle turnos.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {dentists.map((d) => {
            const diasActivos = [...d.schedules].sort((a, b) => a.diaSemana - b.diaSemana)
            return (
              <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ backgroundColor: d.colorAgenda ?? COLORES[0] }}
                  >
                    {d.user.nombre[0]}{d.user.apellido[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {d.user.nombre} {d.user.apellido}
                    </p>
                    {d.especialidad && (
                      <p className="text-sm text-gray-500 truncate">{d.especialidad}</p>
                    )}
                    {d.matricula && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <BadgeCheck className="w-3.5 h-3.5" /> MP {d.matricula}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => abrirEditar(d)}
                      className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(d)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Dar de baja"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Horarios */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  {diasActivos.length === 0 ? (
                    <p className="text-xs text-gray-400">Sin horarios de atención cargados</p>
                  ) : (
                    <div className="space-y-1">
                      {diasActivos.map((s) => (
                        <div key={s.diaSemana} className="flex items-center gap-2 text-xs text-gray-600">
                          <Clock className="w-3.5 h-3.5 text-gray-300" />
                          <span className="w-16 font-medium">{DIAS[s.diaSemana]}</span>
                          <span>{timeStr(s.horaInicio)} – {timeStr(s.horaFin)}</span>
                          <span className="text-gray-400">· turnos de {s.duracionSlotMin ?? 30}'</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal crear/editar */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="font-bold text-gray-900">
                {editing ? 'Editar odontólogo' : 'Nuevo odontólogo'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Datos básicos */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Nombre *</label>
                  <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={`${input} w-full`} placeholder="Valentina" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Apellido *</label>
                  <input value={apellido} onChange={(e) => setApellido(e.target.value)} className={`${input} w-full`} placeholder="García" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Matrícula (MP)</label>
                  <input value={matricula} onChange={(e) => setMatricula(e.target.value)} className={`${input} w-full`} placeholder="12345" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Especialidad</label>
                  <input value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} className={`${input} w-full`} placeholder="Ortodoncia" />
                </div>
              </div>

              {/* Color de agenda */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Color en la agenda</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Días y horarios */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Días y horarios de atención</label>
                <div className="space-y-2">
                  {DIAS.map((dia, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border ${dias[i].activo ? 'border-brand-200 bg-brand-50/40' : 'border-gray-100'}`}
                    >
                      <button
                        onClick={() => toggleDia(i)}
                        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${dias[i].activo ? 'bg-brand-500' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${dias[i].activo ? 'translate-x-5' : ''}`} />
                      </button>
                      <span className="w-20 text-sm font-medium text-gray-700">{DIAS_CORTO[i]} <span className="hidden sm:inline">{dia.slice(3)}</span></span>
                      {dias[i].activo ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <input type="time" value={dias[i].horaInicio} onChange={(e) => setDiaCampo(i, 'horaInicio', e.target.value)} className={`${input} w-28`} />
                          <span className="text-gray-400 text-sm">a</span>
                          <input type="time" value={dias[i].horaFin} onChange={(e) => setDiaCampo(i, 'horaFin', e.target.value)} className={`${input} w-28`} />
                          <select
                            value={dias[i].duracionSlotMin}
                            onChange={(e) => setDiaCampo(i, 'duracionSlotMin', parseInt(e.target.value, 10))}
                            className={`${input}`}
                          >
                            <option value={15}>15 min</option>
                            <option value={20}>20 min</option>
                            <option value={30}>30 min</option>
                            <option value={45}>45 min</option>
                            <option value={60}>60 min</option>
                          </select>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-300">No atiende</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-5 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saveMut.isPending}
                className="px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-60"
              >
                {saveMut.isPending ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear odontólogo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
