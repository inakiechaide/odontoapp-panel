'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { getAccessToken } from '@/lib/api'
import { ModalManager } from '@/components/shared/ModalManager'
import { useUIStore } from '@/stores/ui.store'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const hydrated = useUIStore((s) => s._hydrated)
  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen)
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!hydrated) return
    const token = getAccessToken()
    if (!token) {
      router.push('/auth/login')
    }
    setChecked(true)
  }, [hydrated, router])

  // Hasta que el efecto de montaje confirme la sesión, renderizar SIEMPRE el
  // mismo árbol (spinner) en servidor y cliente. Leer el token durante el
  // render rompía la hidratación (#418/#423): el server no ve el token y el
  // cliente sí, generando HTML distinto.
  if (!checked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      {/* Backdrop del drawer en mobile */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden
        />
      )}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      <ModalManager />
      </div>
    </div>
  )
}
