'use client'

import { useQuery } from '@tanstack/react-query'
import { Shield, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import api from '@/lib/api'
import { INSURANCE_LABELS } from '@/lib/utils'

const OS_LIST = [
  'IOMA','PAMI','OSDE','SWISS_MEDICAL','GALENO',
  'OSPEDYC','IOSFA','MEDICUS','SANCOR','OMINT','PARTICULAR'
]

export default function ObrasSocialesPage() {
  // Obtener coberturas de las obras sociales principales
  const { data: coberturas, isLoading } = useQuery({
    queryKey: ['insurance', 'all'],
    queryFn: async () => {
      const results = await Promise.allSettled(
        OS_LIST.slice(0, 5).map(os =>
          api.get(`/insurance/coverage/${os}`)
            .then(r => ({ os, data: r.data }))
            .catch(() => ({ os, data: [] }))
        )
      )
      return results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => (r as any).value.data.map((c: any) => ({
          ...c,
          obraSocialKey: (r as any).value.os
        })))
    },
    staleTime: 300_000,
  })

  // Agrupar por obra social
  const grouped = (coberturas ?? []).reduce<Record<string, any[]>>((acc, c) => {
    const key = c.obraSocialKey || c.obraSocial
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Obras Sociales</h1>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {OS_LIST.slice(0,8).map(os => {
          const count = grouped[os]?.length ?? 0
          return (
            <div key={os} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">{INSURANCE_LABELS[os] ?? os}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{count}</p>
                  <p className="text-xs text-gray-400">prestaciones</p>
                </div>
                <Shield className={`w-6 h-6 mt-1 ${count > 0 ? 'text-brand-500' : 'text-gray-300'}`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabla de coberturas */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando coberturas...</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([os, items]) => (
            <div key={os} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{INSURANCE_LABELS[os] ?? os}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{items.length} prestaciones cubiertas</p>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-5 py-2 text-xs text-gray-400 font-medium">Tratamiento</th>
                    <th className="text-right px-4 py-2 text-xs text-gray-400 font-medium">Cobertura</th>
                    <th className="text-center px-4 py-2 text-xs text-gray-400 font-medium">Autorización</th>
                    <th className="text-left px-4 py-2 text-xs text-gray-400 font-medium hidden md:table-cell">Código</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((c: any) => {
                    const pct = Number(c.porcentajeCobertura)
                    return (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-2.5 text-gray-700">
                          {c.treatment?.nombre ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`font-bold ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                            {pct.toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {c.requiereAutorizacion ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                              <AlertCircle className="w-3 h-3" /> Requiere
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              <CheckCircle className="w-3 h-3" /> Directa
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 text-xs hidden md:table-cell font-mono">
                          {c.codigoPrestacion || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              <Shield className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No hay coberturas configuradas</p>
              <p className="text-xs mt-1">Las coberturas se configuran en Supabase</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
