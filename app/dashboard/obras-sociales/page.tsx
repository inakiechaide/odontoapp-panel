'use client'
// app/dashboard/obras-sociales/page.tsx
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { INSURANCE_LABELS } from '@/lib/utils'
import type { InsuranceCoverage } from '@/types'

export default function ObrasSocialesPage() {
  const { data: coverages, isLoading } = useQuery({
    queryKey: ['insurance', 'all'],
    queryFn: async () => {
      // Obtener coberturas de todas las OS
      const obras = ['IOMA', 'PAMI', 'OSDE', 'SWISS_MEDICAL', 'GALENO', 'OSPEDYC', 'IOSFA']
      const results = await Promise.all(
        obras.map((os) => api.get(`/insurance/coverage/${os}`).then((r) => r.data as InsuranceCoverage[]))
      )
      return obras.flatMap((os, i) => results[i].map((c) => ({ ...c, obraSocial: os as any })))
    },
  })

  // Agrupar por obra social
  const grouped = (coverages ?? []).reduce<Record<string, InsuranceCoverage[]>>((acc, c) => {
    const key = c.obraSocial
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Obras Sociales</h1>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando coberturas...</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([os, items]) => (
            <div key={os} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h2 className="font-semibold text-gray-900">{INSURANCE_LABELS[os] ?? os}</h2>
                <p className="text-xs text-gray-400">{items.length} prestaciones cubiertas</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-5 py-2 text-xs text-gray-400">Tratamiento</th>
                    <th className="text-right px-4 py-2 text-xs text-gray-400">Cobertura</th>
                    <th className="text-center px-4 py-2 text-xs text-gray-400">Autorización</th>
                    <th className="text-left px-4 py-2 text-xs text-gray-400 hidden md:table-cell">Código</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-5 py-2.5 text-gray-700">{c.treatment.nombre}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`font-semibold ${Number(c.porcentajeCobertura) >= 80 ? 'text-green-600' : Number(c.porcentajeCobertura) >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {Number(c.porcentajeCobertura).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {c.requiereAutorizacion ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">Requiere</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Directa</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-gray-400 text-xs hidden md:table-cell">{c.codigoPrestacion || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
