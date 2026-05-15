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
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!hydrated) return
    const token = getAccessToken()
    if (!token) {
      router.push('/auth/login')
    }
    setChecked(true)
  }, [hydrated, router])

  // Mostrar nada hasta que el store esté hidratado (evita flash)
  if (!checked && !getAccessToken()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      <ModalManager />
      </div>
    </div>
  )
}
