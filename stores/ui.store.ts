import { create } from 'zustand'
import type { User } from '@/types'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  createdAt: Date
}

interface UIStore {
  user: User | null
  _hydrated: boolean
  setUser: (user: User | null) => void
  hydrate: () => void
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  selectedDentistId: string | null
  setSelectedDentistId: (id: string | null) => void
  agendaView: 'week' | 'day'
  setAgendaView: (v: 'week' | 'day') => void
  agendaDate: Date | null   // null en SSR, Date en cliente
  setAgendaDate: (d: Date) => void
  activeModal: string | null
  modalData: Record<string, unknown>
  openModal: (modal: string, data?: Record<string, unknown>) => void
  closeModal: () => void
  notifications: Notification[]
  addNotification: (n: Omit<Notification, 'id' | 'createdAt'>) => void
  removeNotification: (id: string) => void
}

const USER_KEY = 'odontoapp_user'

export const useUIStore = create<UIStore>((set) => ({
  // null en SSR — se asigna en hydrate() del cliente
  user: null,
  _hydrated: false,

  hydrate: () => {
    try {
      const stored = localStorage.getItem(USER_KEY)
      const user = stored ? JSON.parse(stored) : null
      set({ user, _hydrated: true, agendaDate: new Date() })
    } catch {
      set({ _hydrated: true, agendaDate: new Date() })
    }
  },

  setUser: (user) => {
    try {
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
      else localStorage.removeItem(USER_KEY)
    } catch { /* SSR */ }
    set({ user })
  },

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  selectedDentistId: null,
  setSelectedDentistId: (id) => set({ selectedDentistId: id }),
  agendaView: 'week',
  setAgendaView: (v) => set({ agendaView: v }),
  agendaDate: null,  // ← null en SSR, se setea en hydrate()
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
      ].slice(-10),
    })),
  removeNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
}))
