'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Shield, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

const OS_LIST = [
  {key:'IOMA', label:'IOMA', color:'bg-blue-100 text-blue-800'},
  {key:'PAMI', label:'PAMI', color:'bg-green-100 text-green-800'},
  {key:'OSDE', label:'OSDE', color:'bg-purple-100 text-purple-800'},
  {key:'SWISS_MEDICAL', label:'Swiss Medical', color:'bg-indigo-100 text-indigo-800'},
  {key:'GALENO', label:'Galeno', color:'bg-orange-100 text-orange-800'},
  {key:'OSPEDYC', label:'OSPEDYC', color:'bg-rose-100 text-rose-800'},
  {key:'SANCOR', label:'Sancor Salud', color:'bg-amber-100 text-amber-800'},
  {key:'MEDICUS', label:'Medicus', color:'bg-teal-100 text-teal-800'},
  {key:'OMINT', label:'OMINT', color:'bg-cyan-100 text-cyan-800'},
  {key:'IOSFA', label:'IOSFA', color:'bg-emerald-100 text-emerald-800'},
]

export default function ObrasSocialesPage() {
  const [expanded, setExpanded] = useState<string | null>('IOMA')

  const { data: allCoverage, isLoading } = useQuery({
    queryKey: ['insurance', 'all'],
    queryFn: async () => {
      const results = await Promise.allSettled(
        OS_LIST.map(os =>
          api.get(`/insurance/coverage/${os.key}`)
            .then(r => ({ os: os.key, items: r.data }))
            .catch(() => ({ os: os.key, items: [] }))
        )
      )
      const map: Record<string, any[]> = {}
      results.forEach(r => {
        if (r.status === 'fulfilled') map[r.value.os] = r.value.items
      })
      return map
    },
    staleTime: 300_000,
  })

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Obras Sociales</h1>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {OS_LIST.slice(0,10).map(os => {
          const count = allCoverage?.[os.key]?.length ?? 0
          return (
            <button key={os.key}
              onClick={() => setExpanded(expanded === os.key ? null : os.key)}
              className={cn('bg-white rounded-xl border p-3 text-left transition-all hover:shadow-sm', expanded === os.key ? 'border-brand-400 ring-1 ring-brand-400' : 'border-gray-200')}>
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', os.color)}>{os.label}</span>
              <p className="text-2xl font-bold text-gray-800 mt-2">{count}</p>
              <p className="text-xs text-gray-400">prestaciones</p>
            </button>
          )
        })}
      </div>

      {/* Detalle de cobertura */}
      {OS_LIST.map(os => {
        const items = allCoverage?.[os.key] ?? []
        if (expanded !== os.key) return null
        return (
          <div key={os.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-brand-500" />
                <div>
                  <h2 className="font-semibold text-gray-900">{os.label}</h2>
                  <p className="text-xs text-gray-400">{items.length} prestaciones en el nomenclador</p>
                </div>
              </div>
              <button onClick={() => setExpanded(null)} className="p-1 rounded hover:bg-gray-100">
                <ChevronUp className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {isLoading ? (
              <div className="p-6 text-center text-gray-400 text-sm">Cargando...</div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">Sin prestaciones configuradas</div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-50 bg-gray-50">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase">Tratamiento</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Cobertura %</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Autorización</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Código</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Límite</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((c: any) => {
                    const pct = Number(c.porcentajeCobertura)
                    return (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-5 py-2.5 font-medium text-gray-700">{c.treatment?.nombre ?? '—'}</td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div className={cn('h-full rounded-full', pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400')}
                                style={{width: `${pct}%`}} />
                            </div>
                            <span className={cn('font-bold text-sm', pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500')}>
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {c.requiereAutorizacion
                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full"><AlertCircle className="w-3 h-3"/>Requiere</span>
                            : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"><CheckCircle className="w-3 h-3"/>Directa</span>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 text-xs hidden lg:table-cell font-mono">{c.codigoPrestacion??'—'}</td>
                        <td className="px-4 py-2.5 text-gray-400 text-xs hidden lg:table-cell">{c.limiteAnual ? `${c.limiteAnual}/año` : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )
      })}
    </div>
  )
}
