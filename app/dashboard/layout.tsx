'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useUIStore } from '@/stores/ui.store'
import { getAccessToken } from '@/lib/api'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = useUIStore((s) => s.user)

  useEffect(() => {
    // Redirigir si no hay token (protección básica — el middleware maneja el resto)
    if (!user && !getAccessToken()) {
      router.push('/auth/login')
    }
  }, [user, router])

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
