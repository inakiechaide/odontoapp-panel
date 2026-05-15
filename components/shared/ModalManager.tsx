'use client'
import { useUIStore } from '@/stores/ui.store'
import { NewAppointmentModal } from '@/components/agenda/NewAppointmentModal'

export function ModalManager() {
  const { activeModal } = useUIStore()
  if (activeModal === 'new-appointment') return <NewAppointmentModal />
  return null
}
