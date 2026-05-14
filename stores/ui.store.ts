import { create } from 'zustand'
import { User } from '@/types'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  createdAt: Date
}

interface UIStore {
  // Auth
  user: User | null
  setUser: (user: User | null) => void

  // Sidebar
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Agenda
  selectedDentistId: string | null
  setSelectedDentistId: (id: string | null) => void
  agendaView: 'week' | 'day'
  setAgendaView: (v: 'week' | 'day') => void
  agendaDate: Date
  setAgendaDate: (d: Date) => void

  // Modal activo
  activeModal: string | null
  modalData: Record<string, unknown>
  openModal: (modal: string, data?: Record<string, unknown>) => void
  closeModal: () => void

  // Notificaciones en tiempo real
  notifications: Notification[]
  addNotification: (n: Omit<Notification, 'id' | 'createdAt'>) => void
  removeNotification: (id: string) => void
}

export const useUIStore = create<UIStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  selectedDentistId: null,
  setSelectedDentistId: (id) => set({ selectedDentistId: id }),
  agendaView: 'week',
  setAgendaView: (v) => set({ agendaView: v }),
  agendaDate: new Date(),
  setAgendaDate: (d) => set({ agendaDate: d }),

  activeModal: null,
  modalData: {},
  openModal: (modal, data = {}) => set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: {} }),

  notifications: [],
  addNotification: (n) =>
    set((s) => ({
      notifications: [
        ...s.notifications,
        { ...n, id: crypto.randomUUID(), createdAt: new Date() },
      ].slice(-10), // máx 10
    })),
  removeNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
}))
