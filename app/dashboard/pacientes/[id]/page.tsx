'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Odontogram } from '@/components/odontogram/Odontogram'
import { ArrowLeft, Phone, Shield, Pill, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { usePatient } from '@/hooks/useData'
import { useAppointments } from '@/hooks/useAppointments'
import { formatDate, formatDateTime, INSURANCE_LABELS, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import { cn } from '@/lib/utils'

type Tab = 'datos' | 'turnos' | 'tratamientos' | 'odontograma'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>('datos')

  const isValidUUID = UUID_REGEX.test(id ?? '')
  const { data: patient, isLoading } = usePatient(isValidUUID ? id : '')
  const { data: appointments } = useAppointments(
    isValidUUID ? { patientId: id, limit: 20 } as any : {} as any
  )

  if (!isValidUUID) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p className="text-lg mb-2">ID de paciente inválido</p>
        <Link href="/dashboard/pacientes" className="text-brand-600 underline">
          ← Volver a pacientes
        </Link>
      </div>
    )
  }

  if (isLoading) return <div className="p-8 text-center text-gray-400">Cargando...</div>
  if (!patient) return (
    <div className="p-8 text-center text-gray-400">
      <p className="text-lg mb-2">Paciente no encontrado</p>
      <Link href="/dashboard/pacientes" className="text-brand-600 underline">
        ← Volver a pacientes
      </Link>
    </div>
  )

  const appts = appointments?.data ?? []

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/pacientes"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-xl font-bold text-brand-700">
            {patient.nombre[0]}{patient.apellido[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{patient.nombre} {patient.apellido}</h1>
            <div className="flex items-center gap-3 mt-1">
              {patient.obraSocial && (
                <span className="flex items-center gap-1 text-sm text-brand-600">
                  <Shield className="w-3.5 h-3.5" />
                  {INSURANCE_LABELS[patient.obraSocial]}{patient.nroAfiliado && ` · ${patient.nroAfiliado}`}
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

      <div className="flex gap-1 border-b border-gray-200">
        {(['datos', 'turnos', 'tratamientos', 'odontograma'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            )}>
            {t === 'datos' ? 'Datos personales' : t === 'turnos' ? 'Historial de turnos' : t === 'tratamientos' ? 'Tratamientos' : 'Odontograma'}
          </button>
        ))}
      </div>

      {tab === 'datos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Datos personales</h3>
            {[
              ['DNI', patient.dni ?? '—'],
              ['CUIL', patient.cuil ?? '—'],
              ['Nacimiento', patient.fechaNacimiento ? formatDate(patient.fechaNacimiento) : '—'],
              ['Email', patient.email ?? '—'],
              ['Localidad', patient.localidad ?? '—'],
              ['Provincia', patient.provincia ?? '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                <span className="text-gray-400">{k}</span>
                <span className="text-gray-800 font-medium">{v}</span>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {patient.alergias.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="font-semibold text-amber-800 text-sm flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-4 h-4" /> Alergias
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {patient.alergias.map((a) => (
                    <span key={a} className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">{a}</span>
                  ))}
                </div>
              </div>
            )}
            {patient.notasMedicas && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="font-semibold text-gray-700 text-sm mb-2">Notas médicas</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{patient.notasMedicas}</p>
              </div>
            )}
            <p className="text-xs text-gray-400">
              Alta: {formatDateTime(patient.createdAt)} · Actualización: {formatDateTime(patient.updatedAt)}
            </p>
          </div>
        </div>
      )}

      {tab === 'turnos' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {appts.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Sin turnos registrados</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Fecha y hora</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tratamiento</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appts.map((a: any) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700">{formatDateTime(a.fechaHora)}</td>
                    <td className="px-4 py-3 text-gray-600">{a.tipoTratamiento || 'Consulta'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', (STATUS_COLORS as Record<string,string>)[a.status])}>
                        {(STATUS_LABELS as Record<string,string>)[a.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'odontograma' && <Odontogram />}

      {tab === 'tratamientos' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          <Pill className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>Módulo de tratamientos — próximamente</p>
        </div>
      )}
    </div>
  )
}
