'use client'

import { useState } from 'react'
import { useDebounce } from 'use-debounce'
import { Search, UserPlus, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePatients } from '@/hooks/useData'
import { INSURANCE_LABELS, formatDate } from '@/lib/utils'
import type { InsuranceName } from '@/types'

export default function PacientesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [debouncedSearch] = useDebounce(search, 400)

  const { data, isLoading } = usePatients({
    q: debouncedSearch || undefined,
    page,
    limit: 20,
  })

  const patients = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Pacientes</h1>
        <Link href="/dashboard/pacientes/nuevo"
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
          <UserPlus className="w-4 h-4" />
          Nuevo paciente
        </Link>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Buscar por nombre, DNI, teléfono..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : patients.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {search ? `Sin resultados para "${search}"` : 'No hay pacientes registrados'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Paciente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">DNI</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">WhatsApp</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Obra Social</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-brand-700">
                            {p.nombre[0]}{p.apellido[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{p.apellido}, {p.nombre}</p>
                          <p className="text-xs text-gray-400">{p.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{p.dni || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{p.telefonoWhatsapp || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {p.obraSocial ? (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                          {INSURANCE_LABELS[p.obraSocial]}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/pacientes/${p.id}`}
                        className="p-1 rounded hover:bg-gray-200 transition-colors inline-flex">
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>

            {/* Paginación */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  {meta.total} pacientes · página {meta.page} de {meta.totalPages}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-40">
                    Anterior
                  </button>
                  <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
                    className="px-3 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-40">
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
