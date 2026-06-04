'use client'
import { useUIStore } from '@/stores/ui.store'
import { NewAppointmentModal } from '@/components/agenda/NewAppointmentModal'
import { AppointmentDetailModal } from '@/components/agenda/AppointmentDetailModal'

export function ModalManager() {
  const { activeModal } = useUIStore()
  if (activeModal === 'new-appointment') return <NewAppointmentModal />
  if (activeModal === 'appointment-detail') return <AppointmentDetailModal />
  return null
}
