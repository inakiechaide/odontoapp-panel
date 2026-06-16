'use client'

import { useQuery } from '@tanstack/react-query'
import { Wifi, WifiOff, RefreshCw, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import AiSettingsCard from '@/components/settings/AiSettingsCard'
import ChangePasswordCard from '@/components/settings/ChangePasswordCard'

interface WAStatus {
  connected: boolean
  qr?: string | null
  qrDataUrl?: string | null
  phone?: string | null
}

export default function ConfiguracionPage() {
  const [secondsLeft, setSecondsLeft] = useState(30)

  // Despertar el worker de WhatsApp en paralelo (Render free se duerme).
  // Ping directo no-cors a su /health para que arranque sin esperar la cadena
  // Vercel -> API -> worker. Se reintenta mientras no esté conectado.
  useEffect(() => {
    const wake = () => {
      fetch('https://odontoapp-whatsapp.onrender.com/health', { mode: 'no-cors' }).catch(() => {})
    }
    wake()
    const t = setInterval(wake, 15_000)
    return () => clearInterval(t)
  }, [])

  const { data: waStatus, refetch, isRefetching, dataUpdatedAt } = useQuery<WAStatus>({
    queryKey: ['whatsapp', 'status'],
    queryFn: async () => {
      const res = await api.get('/whatsapp/status')
      return res.data
    },
    refetchInterval: 10_000, // refrescar cada 10 segundos
  })

  // Countdown visual hasta próximo refresh
  useEffect(() => {
    setSecondsLeft(10)
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 10 : s - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [dataUpdatedAt])

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900">Configuración</h1>

      {/* WhatsApp */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-500">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            WhatsApp Bot
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">actualiza en {secondsLeft}s</span>
            <button onClick={() => refetch()} disabled={isRefetching}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors" title="Actualizar ahora">
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {waStatus?.connected ? (
          /* ── CONECTADO ───────────────────────────────────────────── */
          <div className="flex items-center gap-4 p-5 bg-green-50 rounded-xl border border-green-200">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Wifi className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-800 text-lg">✅ Bot Sofía activo</p>
              {waStatus.phone && (
                <p className="text-sm text-green-600 mt-0.5 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  Número vinculado: {waStatus.phone}
                </p>
              )}
              <p className="text-sm text-green-600 mt-1">El bot está respondiendo automáticamente</p>
            </div>
          </div>
        ) : waStatus?.qrDataUrl || waStatus?.qr ? (
          /* ── QR DISPONIBLE ───────────────────────────────────────── */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <WifiOff className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800">Bot desconectado — escanear QR</p>
                <p className="text-sm text-amber-600">El código se renueva cada 30 segundos</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 p-6 bg-white border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-sm font-medium text-gray-600 text-center">
                Escaneá este código con WhatsApp
              </p>

              {waStatus.qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={waStatus.qrDataUrl}
                  alt="Código QR de WhatsApp"
                  className="w-56 h-56 rounded-xl border border-gray-100"
                />
              ) : (
                <pre className="text-xs bg-gray-50 p-3 rounded-lg font-mono overflow-auto max-h-48 w-full">
                  {waStatus.qr}
                </pre>
              )}

              <div className="text-xs text-gray-400 text-center space-y-1">
                <p>1. Abrí WhatsApp en tu celular</p>
                <p>2. Tocá ⋮ (tres puntos) → Dispositivos vinculados</p>
                <p>3. Tocá "Vincular dispositivo" y escaneá el QR</p>
              </div>
            </div>
          </div>
        ) : (
          /* ── SIN QR AUN ───────────────────────────────────────────── */
          <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <WifiOff className="w-7 h-7 text-gray-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">Iniciando servicio WhatsApp...</p>
              <p className="text-sm text-gray-400 mt-1">El QR aparecerá automáticamente en unos segundos. Si demora, el servicio puede estar iniciando (Plan gratuito de Render).</p>
            </div>
          </div>
        )}
      </div>

      {/* Mi contraseña */}
      <ChangePasswordCard />

      {/* Inteligencia de Sofía */}
      <AiSettingsCard />

      {/* Info del sistema */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Información del sistema</h2>
        <dl className="space-y-0 text-sm divide-y divide-gray-50">
          {[
            ['Backend', process.env.NEXT_PUBLIC_API_URL ?? '—'],
            ['Base de datos', 'Supabase PostgreSQL (sa-east-1)'],
            ['IA', 'Mistral (configurable arriba) + Gemini de respaldo'],
            ['Transcripción de audio', 'Voxtral (Mistral)'],
            ['Panel', 'https://odontoapp-panel.vercel.app'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2.5">
              <dt className="text-gray-500 font-medium">{k}</dt>
              <dd className="text-gray-700 text-right truncate max-w-xs text-xs font-mono">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
