'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WeekView } from '@/components/agenda/WeekView'
import { useUIStore } from '@/stores/ui.store'
import api from '@/lib/api'

export default function AgendaPage() {
  const { selectedDentistId, setSelectedDentistId } = useUIStore()

  // Cargar dentistas y auto-seleccionar el primero
  const { data: dentists } = useQuery({
    queryKey: ['dentists'],
    queryFn: async () => {
      const res = await api.get('/dentists')
      return res.data
    },
  })

  useEffect(() => {
    if (!selectedDentistId && dentists && dentists.length > 0) {
      setSelectedDentistId(dentists[0].id)
    }
  }, [dentists, selectedDentistId, setSelectedDentistId])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Agenda</h1>
        {dentists && dentists.length > 1 && (
          <select
            value={selectedDentistId ?? ''}
            onChange={(e) => setSelectedDentistId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {dentists.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.user?.nombre} {d.user?.apellido}
              </option>
            ))}
          </select>
        )}
      </div>
      <WeekView />
    </div>
  )
}
