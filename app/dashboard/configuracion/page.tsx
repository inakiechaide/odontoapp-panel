'use client'

import { useQuery } from '@tanstack/react-query'
import { Wifi, WifiOff, QrCode, RefreshCw } from 'lucide-react'
import api from '@/lib/api'

export default function ConfiguracionPage() {
  const { data: waStatus, refetch, isRefetching } = useQuery({
    queryKey: ['whatsapp', 'status'],
    queryFn: async () => {
      const res = await api.get('/whatsapp/status')
      return res.data as { connected: boolean; qr: string | null }
    },
    refetchInterval: 10_000,
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900">Configuración</h1>

      {/* WhatsApp Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Conexión WhatsApp</h2>
          <button onClick={() => refetch()} disabled={isRefetching}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {waStatus?.connected ? (
            <>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Wifi className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-700">Bot Sofía conectado</p>
                <p className="text-sm text-gray-400">WhatsApp activo y respondiendo</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <WifiOff className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-red-600">Desconectado</p>
                <p className="text-sm text-gray-400">El bot no está activo</p>
              </div>
            </>
          )}
        </div>

        {/* QR Code */}
        {!waStatus?.connected && waStatus?.qr && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 mb-3 flex items-center justify-center gap-1.5">
              <QrCode className="w-4 h-4" />
              Escaneá el QR con WhatsApp para conectar el bot
            </p>
            <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl">
              {/* Mostrar QR como texto por ahora — en prod usar qrcode.react */}
              <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded">
                <div className="text-center">
                  <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">QR disponible en los logs de Render</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info del sistema */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Información del sistema</h2>
        <dl className="space-y-2 text-sm">
          {[
            ['Backend', process.env.NEXT_PUBLIC_API_URL ?? 'No configurado'],
            ['Base de datos', 'Supabase PostgreSQL (sa-east-1)'],
            ['IA', 'Gemini 2.0 Flash'],
            ['STT', 'Groq Whisper Large v3 Turbo'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-1.5 border-b border-gray-50">
              <dt className="text-gray-500">{k}</dt>
              <dd className="font-medium text-gray-800 text-right truncate max-w-xs">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
