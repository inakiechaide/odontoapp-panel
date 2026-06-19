'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserPlus, KeyRound, Power, Copy, Check, Stethoscope, ShieldCheck, X, Users as UsersIcon, CalendarClock,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useUIStore } from '@/stores/ui.store'
import ScheduleCard from '@/components/settings/ScheduleCard'

interface TeamUser {
  id: string
  email: string
  nombre: string
  apellido: string
  role: 'ADMIN' | 'DENTIST' | 'RECEPTIONIST' | 'ASSISTANT'
  phone: string | null
  active: boolean
  dentistProfile: { id: string; matricula: string | null; especialidad: string | null } | null
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador', DENTIST: 'Doctor/a', RECEPTIONIST: 'Recepción', ASSISTANT: 'Asistente',
}
const ROLE_COLOR: Record<string, string> = {
  ADMIN: 'bg-violet-100 text-violet-700', DENTIST: 'bg-indigo-100 text-indigo-700',
  RECEPTIONIST: 'bg-teal-100 text-teal-700', ASSISTANT: 'bg-slate-100 text-slate-600',
}

export default function EquipoPage() {
  const qc = useQueryClient()
  const me = useUIStore((s) => s.user)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', matricula: '', especialidad: '' })
  const [cred, setCred] = useState<{ email: string; password: string; titulo: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [abierto, setAbierto] = useState<string | null>(null)

  const { data: users, isLoading } = useQuery<TeamUser[]>({
    queryKey: ['team'],
    queryFn: async () => (await api.get('/users')).data,
    enabled: me?.role === 'ADMIN',
  })

  const createDentist = useMutation({
    mutationFn: async () => (await api.post('/users/dentist', form)).data,
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['team'] })
      setCred({ email: form.email, password: res.tempPassword, titulo: 'Doctor/a creado/a' })
      setForm({ nombre: '', apellido: '', email: '', matricula: '', especialidad: '' })
      setShowForm(false)
      toast.success('Doctor/a dado/a de alta')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'No se pudo crear'),
  })

  const resetPassword = useMutation({
    mutationFn: async (u: TeamUser) => ({ u, data: (await api.put(`/users/${u.id}/reset-password`, {})).data }),
    onSuccess: ({ u, data }: any) => {
      setCred({ email: u.email, password: data.tempPassword, titulo: `Nueva contraseña de ${u.nombre} ${u.apellido}` })
      toast.success('Contraseña reseteada')
    },
    onError: () => toast.error('No se pudo resetear'),
  })

  const toggleActive = useMutation({
    mutationFn: async (u: TeamUser) => (await api.patch(`/users/${u.id}/active`, { active: !u.active })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); toast.success('Estado actualizado') },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'No se pudo actualizar'),
  })

  const copy = () => {
    if (!cred) return
    navigator.clipboard.writeText(`Email: ${cred.email}\nContraseña: ${cred.password}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (me && me.role !== 'ADMIN') {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Sección solo para administradores</p>
          <p className="text-sm text-gray-400 mt-1">No tenés permiso para gestionar el equipo.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-indigo-500" /> Equipo
          </h1>
          <p className="text-sm text-gray-400">Gestioná los accesos del consultorio.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <UserPlus className="w-4 h-4" /> Agregar doctor/a
        </button>
      </div>

      {/* Credencial generada (se muestra una sola vez) */}
      {cred && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-800">{cred.titulo}</p>
              <p className="text-xs text-emerald-600 mt-0.5">Anotá o copiá esta contraseña: no se vuelve a mostrar.</p>
              <div className="mt-2 font-mono text-sm text-gray-800 bg-white rounded-lg border border-emerald-100 px-3 py-2">
                <div>Email: <b>{cred.email}</b></div>
                <div>Contraseña: <b>{cred.password}</b></div>
              </div>
            </div>
            <button onClick={() => setCred(null)} className="text-emerald-400 hover:text-emerald-600"><X className="w-4 h-4" /></button>
          </div>
          <button onClick={copy} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-900">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      )}

      {/* Form de alta */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-medium text-gray-900 flex items-center gap-2"><Stethoscope className="w-4 h-4 text-indigo-500" /> Nuevo doctor/a</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Apellido" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm sm:col-span-2" />
            <input placeholder="Matrícula (opcional)" value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Especialidad (opcional)" value={form.especialidad} onChange={(e) => setForm({ ...form, especialidad: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <p className="text-xs text-gray-400">Se genera una contraseña temporal automáticamente; el doctor la cambia desde Configuración.</p>
          <div className="flex gap-2">
            <button onClick={() => createDentist.mutate()} disabled={createDentist.isPending || !form.nombre || !form.apellido || !form.email}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
              {createDentist.isPending ? 'Creando…' : 'Crear'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500 px-3">Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {isLoading ? (
          <p className="text-sm text-gray-400 p-5">Cargando…</p>
        ) : (
          users?.map((u) => (
            <div key={u.id}>
              <div className="flex items-center justify-between p-4 gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">{u.nombre} {u.apellido}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${ROLE_COLOR[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                    {!u.active && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-600">Inactivo</span>}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{u.email}{u.dentistProfile?.matricula ? ` · Mat. ${u.dentistProfile.matricula}` : ''}{u.dentistProfile?.especialidad ? ` · ${u.dentistProfile.especialidad}` : ''}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {u.dentistProfile && (
                    <button onClick={() => setAbierto(abierto === u.id ? null : u.id)} title="Franja horaria"
                      className={`p-2 rounded-lg hover:bg-gray-100 ${abierto === u.id ? 'text-indigo-600' : 'text-gray-500'}`}>
                      <CalendarClock className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => resetPassword.mutate(u)} title="Resetear contraseña"
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" disabled={resetPassword.isPending}>
                    <KeyRound className="w-4 h-4" />
                  </button>
                  {u.id !== me?.id && (
                    <button onClick={() => toggleActive.mutate(u)} title={u.active ? 'Desactivar' : 'Activar'}
                      className={`p-2 rounded-lg hover:bg-gray-100 ${u.active ? 'text-gray-500' : 'text-emerald-600'}`}>
                      <Power className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {abierto === u.id && u.dentistProfile && (
                <div className="px-4 pb-4">
                  <ScheduleCard dentistId={u.dentistProfile.id} titulo={`Franja de ${u.nombre} ${u.apellido}`} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
