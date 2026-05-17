'use client'

import { useQuery } from '@tanstack/react-query'
import { Wifi, WifiOff, QrCode, RefreshCw, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react'
import api from '@/lib/api'

export default function ConfiguracionPage() {
  const { data: waStatus, refetch, isRefetching } = useQuery({
    queryKey: ['whatsapp', 'status'],
    queryFn: async () => {
      try {
        const res = await api.get('/whatsapp/status')
        return res.data as { connected: boolean; qr?: string; qrDataUrl?: string; phone?: string }
      } catch { return { connected: false } }
    },
    refetchInterval: 10_000,
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900">Configuración</h1>

      {/* WhatsApp */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-500"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            Conexión WhatsApp Bot
          </h2>
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
              {waStatus.phone && <p className="text-sm text-green-600">Número: {waStatus.phone}</p>}
              <p className="text-sm text-green-600 mt-0.5">WhatsApp activo y respondiendo automáticamente</p>
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
                <p className="text-sm text-red-500">Necesita escanear el código QR para activarse</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <p className="font-semibold text-blue-800 flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                Cómo conectar el bot:
              </p>
              <ol className="space-y-2 text-sm text-blue-700 list-none">
                {[
                  ['1', 'Ir a Render Dashboard → servicio "odontoapp-whatsapp" → Logs'],
                  ['2', 'Buscar el código QR en los logs (aparece como texto ASCII)'],
                  ['3', 'Abrir WhatsApp en tu celular → ⋮ → Dispositivos vinculados'],
                  ['4', 'Tocar "Vincular dispositivo" y escanear el QR de los logs'],
                  ['5', 'Una vez escaneado, esta página mostrará "Conectado" ✅'],
                ].map(([n, t]) => (
                  <li key={n} className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 text-xs font-bold flex items-center justify-center flex-shrink-0">{n}</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ol>
              <a href="https://dashboard.render.com" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-800 underline font-medium">
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir Render Dashboard → odontoapp-whatsapp → Logs
              </a>
            </div>
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
