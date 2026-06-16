'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Lock, Save } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

export default function ChangePasswordCard() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')

  const save = useMutation({
    mutationFn: async () => (await api.put('/auth/change-password', { currentPassword: current, newPassword: next })).data,
    onSuccess: () => {
      toast.success('Contraseña actualizada')
      setCurrent(''); setNext(''); setRepeat('')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'No se pudo cambiar la contraseña'),
  })

  const canSave = current.length >= 1 && next.length >= 6 && next === repeat

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
        <Lock className="w-5 h-5 text-indigo-500" /> Mi contraseña
      </h2>
      <p className="text-sm text-gray-400 mb-5">Cambiá tu propia contraseña de acceso al panel.</p>

      <div className="space-y-3 max-w-sm">
        <input type="password" placeholder="Contraseña actual" value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <input type="password" placeholder="Nueva contraseña (mín. 6)" value={next}
          onChange={(e) => setNext(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <input type="password" placeholder="Repetir nueva contraseña" value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        {next && repeat && next !== repeat && (
          <p className="text-xs text-red-500">Las contraseñas no coinciden.</p>
        )}
        <button onClick={() => save.mutate()} disabled={!canSave || save.isPending}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg">
          <Save className="w-4 h-4" />
          {save.isPending ? 'Guardando…' : 'Cambiar contraseña'}
        </button>
      </div>
    </div>
  )
}
