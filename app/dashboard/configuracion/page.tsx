'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Wifi, WifiOff, QrCode, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/api'

export default function ConfiguracionPage() {
  const qc = useQueryClient()

  const { data: waStatus, refetch, isRefetching } = useQuery({
    queryKey: ['whatsapp', 'status'],
    queryFn: async () => {
      try {
        const res = await api.get('/whatsapp/status')
        return res.data as { connected: boolean; qr: string | null; qrDataUrl?: string }
      } catch {
        return { connected: false, qr: null }
      }
    },
    refetchInterval: 8_000,
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900">Configuración</h1>

      {/* WhatsApp */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Conexión WhatsApp Bot</h2>
          <button onClick={() => refetch()} disabled={isRefetching}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {waStatus?.connected ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Wifi className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-800">✅ Bot Sofía conectado</p>
              <p className="text-sm text-green-600">WhatsApp activo y respondiendo automáticamente</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <WifiOff className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-red-700">Bot Sofía desconectado</p>
                <p className="text-sm text-red-500">El servicio de WhatsApp necesita ser configurado</p>
              </div>
            </div>

            {/* Instrucciones de conexión */}
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="font-medium text-amber-800 flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4" />
                Para conectar el bot de WhatsApp:
              </p>
              <ol className="space-y-2 text-sm text-amber-700">
                <li className="flex gap-2">
                  <span className="font-bold flex-shrink-0">1.</span>
                  El servicio WhatsApp necesita estar deployado en Render con su propio repo
                </li>
                <li className="flex gap-2">
                  <span className="font-bold flex-shrink-0">2.</span>
                  Una vez deployado, aparecerá el código QR acá para escanear con WhatsApp
                </li>
                <li className="flex gap-2">
                  <span className="font-bold flex-shrink-0">3.</span>
                  Abrir WhatsApp → Dispositivos vinculados → Vincular dispositivo → Escanear QR
                </li>
              </ol>
              <a
                href="https://dashboard.render.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-amber-800 underline font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ir a Render Dashboard
              </a>
            </div>

            {/* QR si está disponible */}
            {waStatus?.qr && (
              <div className="text-center p-6 bg-white border-2 border-dashed border-gray-300 rounded-xl">
                <QrCode className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700 mb-3">Escaneá este QR con WhatsApp</p>
                {waStatus.qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={waStatus.qrDataUrl} alt="WhatsApp QR" className="mx-auto rounded-lg" width={200} height={200} />
                ) : (
                  <pre className="text-xs bg-gray-50 p-3 rounded text-left overflow-auto max-h-32">{waStatus.qr}</pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info del sistema */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Información del sistema</h2>
        <dl className="space-y-2 text-sm">
          {[
            ['Backend', process.env.NEXT_PUBLIC_API_URL ?? '—'],
            ['Base de datos', 'Supabase PostgreSQL (sa-east-1)'],
            ['IA', 'Gemini 2.0 Flash'],
            ['STT', 'Groq Whisper Large v3 Turbo'],
            ['Panel', 'https://odontoapp-panel.vercel.app'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <dt className="text-gray-500 font-medium">{k}</dt>
              <dd className="text-gray-700 text-right truncate max-w-xs text-xs font-mono">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
