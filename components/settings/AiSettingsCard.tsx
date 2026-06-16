'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bot, Save, Thermometer, MessageSquareText, Mic, Gauge } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

type VoiceMode = 'never' | 'audio' | 'always'

interface AiSettings {
  id: string
  model: string
  temperature: number
  maxTokens: number
  voiceMode: VoiceMode
  voiceId: string | null
  voiceName: string | null
}

// Modelos de Mistral disponibles para conversar (con tools). De más a menos potente.
const MODELS: { id: string; label: string; desc: string }[] = [
  {
    id: 'mistral-medium-2508',
    label: 'Mistral Medium — recomendado',
    desc: 'El mejor equilibrio entre inteligencia y velocidad. La opción ideal para el uso diario.',
  },
  {
    id: 'mistral-large-2512',
    label: 'Mistral Large — máxima inteligencia',
    desc: 'El más capaz para conversaciones enredadas (cancelar, reprogramar, cambiar motivo). Más lento y con menos cuota en plan gratis: puede tardar más o caer al respaldo.',
  },
  {
    id: 'mistral-medium-2505',
    label: 'Mistral Medium — versión anterior',
    desc: 'Variante previa del medium. Útil como alternativa si la nueva falla.',
  },
  {
    id: 'mistral-small-2506',
    label: 'Mistral Small — rápido',
    desc: 'Más veloz y con mucha cuota, pero menos inteligente: puede equivocarse o inventar más seguido.',
  },
  {
    id: 'magistral-medium-2509',
    label: 'Magistral Medium — razonador',
    desc: 'Piensa más antes de responder y sigue mejor las instrucciones complejas, pero es más lento.',
  },
  {
    id: 'open-mistral-nemo',
    label: 'Mistral Nemo — liviano',
    desc: 'Liviano y rápido, con mucha cuota. Para cuando se agota la de los modelos de arriba.',
  },
]

// Voces preset de Mistral (no se pueden clonar voces propias en plan gratis).
// Ninguna es español nativo: Marie (francés) es la que mejor lee castellano.
const VOICES: { id: string; label: string }[] = [
  { id: '5a271406-039d-46fe-835b-fbbb00eaf08d', label: 'Marie · Neutral (francés)' },
  { id: '49d024dd-981b-4462-bb17-74d381eb8fd7', label: 'Marie · Alegre (francés)' },
  { id: '2f62b1af-aea3-4079-9d10-7ca665ee7243', label: 'Marie · Entusiasta (francés)' },
  { id: 'e0580ce5-e63c-4cbe-88c8-a983b80c5f1f', label: 'Marie · Curiosa (francés)' },
  { id: '4adeb2c6-25a3-44bc-8100-5234dfc1193b', label: 'Marie · Triste (francés)' },
  { id: 'a7c07cdc-1c35-4d87-a938-c610a654f600', label: 'Marie · Enojada (francés)' },
  { id: '82c99ee6-f932-423f-a4a3-d403c8914b8d', label: 'Jane · Neutral (inglés)' },
  { id: 'cbe96cf0-85ec-4a10-accb-0b35c93b6dfd', label: 'Jane · Segura (inglés)' },
  { id: '5de47977-6e47-4266-a938-3bc1d76b4676', label: 'Jane · Curiosa (inglés)' },
  { id: 'c7a8eb83-5247-4540-89f3-6650d349100d', label: 'Jane · Triste (inglés)' },
]

const VOICE_MODES: { v: VoiceMode; label: string; desc: string }[] = [
  { v: 'never', label: 'Nunca', desc: 'Sofía siempre responde por texto.' },
  { v: 'audio', label: 'Solo si el paciente manda un audio', desc: 'Responde con voz únicamente cuando le mandan una nota de voz.' },
  { v: 'always', label: 'Siempre', desc: 'Responde con voz a todos los mensajes.' },
]

export default function AiSettingsCard() {
  const qc = useQueryClient()
  const [model, setModel] = useState('mistral-medium-2508')
  const [temperature, setTemperature] = useState(0.4)
  const [maxTokens, setMaxTokens] = useState(500)
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('audio')
  const [voiceId, setVoiceId] = useState<string>(VOICES[0].id)

  const { data, isLoading } = useQuery<AiSettings>({
    queryKey: ['ai-settings'],
    queryFn: async () => {
      const r = await api.get('/settings/ai')
      return r.data
    },
  })

  useEffect(() => {
    if (!data) return
    setModel(data.model)
    setTemperature(data.temperature)
    setMaxTokens(data.maxTokens)
    setVoiceMode(data.voiceMode)
    if (data.voiceId) setVoiceId(data.voiceId)
  }, [data])

  const save = useMutation({
    mutationFn: async () => {
      const voiceName = VOICES.find((v) => v.id === voiceId)?.label ?? null
      const r = await api.put('/settings/ai', {
        model,
        temperature,
        maxTokens,
        voiceMode,
        voiceId,
        voiceName,
      })
      return r.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-settings'] })
      toast.success('Configuración de la IA guardada')
    },
    onError: () => toast.error('No se pudo guardar la configuración'),
  })

  const modelDesc = MODELS.find((m) => m.id === model)?.desc

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
        <Bot className="w-5 h-5 text-indigo-500" />
        Inteligencia de Sofía
      </h2>
      <p className="text-sm text-gray-400 mb-6">
        Cambiá el modelo, su forma de responder y la voz. Los cambios se aplican a los próximos mensajes (sin reiniciar nada).
      </p>

      {isLoading ? (
        <p className="text-sm text-gray-400">Cargando…</p>
      ) : (
        <div className="space-y-7">
          {/* Modelo */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Gauge className="w-4 h-4 text-gray-400" /> Modelo de IA
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
              {/* Si la config tiene un modelo que no está en la lista, lo mostramos igual */}
              {!MODELS.some((m) => m.id === model) && <option value={model}>{model} (actual)</option>}
            </select>
            {modelDesc && <p className="text-xs text-gray-500 mt-1.5">{modelDesc}</p>}
          </div>

          {/* Temperatura */}
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1.5">
              <span className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-gray-400" /> Creatividad (temperatura)
              </span>
              <span className="text-indigo-600 font-mono">{temperature.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[11px] text-gray-400 mt-1">
              <span>0 · preciso y consistente</span>
              <span>1.5 · creativo y variado</span>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Controla cuánto “se arriesga” a variar las respuestas. <b>Bajo</b> (0.2–0.4): más preciso y repetible, ideal para una
              secretaria que no debe inventar. <b>Alto</b> (0.8+): más creativo pero también más propenso a divagar o equivocarse.
              Recomendado: <b>0.4</b>.
            </p>
          </div>

          {/* Máx tokens */}
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1.5">
              <span className="flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-gray-400" /> Largo máximo de respuesta
              </span>
              <span className="text-indigo-600 font-mono">{maxTokens} tokens</span>
            </label>
            <input
              type="range"
              min={100}
              max={2000}
              step={50}
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[11px] text-gray-400 mt-1">
              <span>100 · respuestas cortas</span>
              <span>2000 · respuestas largas</span>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Tope de longitud de cada respuesta (un token ≈ ¾ de una palabra). Más alto permite explicaciones largas, pero también
              respuestas más lentas y “charlatanas”. Para una secretaria, <b>400–600</b> suele ser ideal.
            </p>
          </div>

          {/* Voz: modo */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mic className="w-4 h-4 text-gray-400" /> Respuestas con voz
            </label>
            <div className="space-y-2">
              {VOICE_MODES.map((m) => (
                <label
                  key={m.v}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    voiceMode === m.v ? 'border-indigo-300 bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="voiceMode"
                    checked={voiceMode === m.v}
                    onChange={() => setVoiceMode(m.v)}
                    className="mt-0.5 accent-indigo-500"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-800">{m.label}</span>
                    <span className="block text-xs text-gray-500">{m.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Voz: cuál */}
          {voiceMode !== 'never' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Voz y tono</label>
              <select
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-amber-600 mt-1.5">
                ⚠️ En el plan gratis no se pueden clonar voces propias, solo usar estas preset. Ninguna es español nativo:
                <b> Marie</b> (francés) es la que mejor lee castellano, aunque con acento. Para una voz propia en español, hace
                falta el plan pago de Mistral.
              </p>
            </div>
          )}

          <div className="pt-1">
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {save.isPending ? 'Guardando…' : 'Guardar configuración'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
