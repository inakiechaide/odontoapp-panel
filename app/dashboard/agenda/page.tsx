'use client'
// app/dashboard/agenda/page.tsx
import { WeekView } from '@/components/agenda/WeekView'
import { useUIStore } from '@/stores/ui.store'

export default function AgendaPage() {
  return (
    <div className="h-full flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">Agenda</h1>
      <div className="flex-1 overflow-hidden">
        <WeekView />
      </div>
    </div>
  )
}
