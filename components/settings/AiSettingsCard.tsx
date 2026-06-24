'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bot, Save, Thermometer, MessageSquareText, Mic, Sparkles, Zap, Brain,
  Feather, Cpu, SlidersHorizontal, ChevronDown, Check, Volume2,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

type VoiceMode = 'never' | 'audio' | 'always'
type BotMode = 'IA' | 'CODE'

interface AiSettings {
  id: string
  model: string
  temperature: number
  maxTokens: number
  voiceMode: VoiceMode
  voiceId: string | null
  voiceName: string | null
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  botMode?: BotMode
}

// Modelos de Mistral aptos para conversar con tools. IDs exactos de la cuenta.
const MODELS = [
  { id: 'mistral-medium-2508', name: 'Mistral Medium', tag: 'Recomendado', Icon: Sparkles, color: 'indigo',
    desc: 'El mejor equilibrio entre inteligencia y velocidad. Ideal para el día a día.' },
  { id: 'mistral-large-2512', name: 'Mistral Large', tag: 'Más potente', Icon: Brain, color: 'violet',
    desc: 'El más capaz para conversaciones enredadas. Más lento y con menos cuota en gratis.' },
  { id: 'mistral-medium-2505', name: 'Mistral Medium (2505)', tag: 'Alternativa', Icon: Cpu, color: 'slate',
    desc: 'Versión anterior del medium. Útil si la nueva llegara a fallar.' },
  { id: 'mistral-small-2506', name: 'Mistral Small', tag: 'Rápido', Icon: Zap, color: 'amber',
    desc: 'Más veloz y con mucha cuota, pero menos inteligente: puede errar o inventar más.' },
  { id: 'magistral-medium-2509', name: 'Magistral Medium', tag: 'Razonador', Icon: Brain, color: 'blue',
    desc: 'Piensa más antes de responder; sigue mejor lo complejo, pero es más lento.' },
  { id: 'open-mistral-nemo', name: 'Mistral Nemo', tag: 'Liviano', Icon: Feather, color: 'teal',
    desc: 'Liviano y rápido, con mucha cuota. Para cuando se agota la de los de arriba.' },
] as const

const TAG_COLORS: Record<string, string> = {
  indigo: 'bg-indigo-100 text-indigo-700',
  violet: 'bg-violet-100 text-violet-700',
  slate: 'bg-slate-100 text-slate-600',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  teal: 'bg-teal-100 text-teal-700',
}

// Voces preset (no se pueden clonar voces propias en plan gratis).
const VOICES_MARIE = [
  { id: '5a271406-039d-46fe-835b-fbbb00eaf08d', label: 'Neutral' },
  { id: '49d024dd-981b-4462-bb17-74d381eb8fd7', label: 'Alegre' },
  { id: '2f62b1af-aea3-4079-9d10-7ca665ee7243', label: 'Entusiasta' },
  { id: 'e0580ce5-e63c-4cbe-88c8-a983b80c5f1f', label: 'Curiosa' },
  { id: '4adeb2c6-25a3-44bc-8100-5234dfc1193b', label: 'Triste' },
  { id: 'a7c07cdc-1c35-4d87-a938-c610a654f600', label: 'Enojada' },
]
const VOICES_JANE = [
  { id: '82c99ee6-f932-423f-a4a3-d403c8914b8d', label: 'Neutral' },
  { id: 'cbe96cf0-85ec-4a10-accb-0b35c93b6dfd', label: 'Segura' },
  { id: '5de47977-6e47-4266-a938-3bc1d76b4676', label: 'Curiosa' },
  { id: 'c7a8eb83-5247-4540-89f3-6650d349100d', label: 'Triste' },
]
function voiceLabel(id: string | null): string {
  if (!id) return ''
  const m = VOICES_MARIE.find((v) => v.id === id)
  if (m) return `Marie · ${m.label} (francés)`
  const j = VOICES_JANE.find((v) => v.id === id)
  if (j) return `Jane · ${j.label} (inglés)`
  return ''
}

const VOICE_MODES: { v: VoiceMode; label: string; desc: string }[] = [
  { v: 'never', label: 'Solo texto', desc: 'Sofía nunca manda audios.' },
  { v: 'audio', label: 'Si le mandan audio', desc: 'Responde con voz solo cuando el paciente manda una nota de voz.' },
  { v: 'always', label: 'Siempre con voz', desc: 'Responde con voz a todos los mensajes.' },
]

function Slider({
  icon, label, value, min, max, step, suffix, hintLeft, hintRight, help, onChange,
}: {
  icon: React.ReactNode; label: string; value: number; min: number; max: number; step: number
  suffix?: string; hintLeft: string; hintRight: string; help: React.ReactNode
  onChange: (v: number) => void
}) {
  return (
    <div>
      <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1.5">
        <span className="flex items-center gap-2">{icon}{label}</span>
        <span className="text-indigo-600 font-mono text-xs bg-indigo-50 px-2 py-0.5 rounded">
          {value}{suffix ? ` ${suffix}` : ''}
        </span>
      </label>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-indigo-500" />
      <div className="flex justify-between text-[11px] text-gray-400 mt-1">
        <span>{hintLeft}</span><span>{hintRight}</span>
      </div>
      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{help}</p>
    </div>
  )
}

export default function AiSettingsCard() {
  const qc = useQueryClient()
  const [model, setModel] = useState('mistral-medium-2508')
  const [temperature, setTemperature] = useState(0.4)
  const [maxTokens, setMaxTokens] = useState(500)
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('audio')
  const [voiceId, setVoiceId] = useState(VOICES_MARIE[0].id)
  const [topP, setTopP] = useState(1)
  const [freqPen, setFreqPen] = useState(0)
  const [presPen, setPresPen] = useState(0)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [botMode, setBotMode] = useState<BotMode>('IA')

  const { data, isLoading } = useQuery<AiSettings>({
    queryKey: ['ai-settings'],
    queryFn: async () => (await api.get('/settings/ai')).data,
  })

  useEffect(() => {
    if (!data) return
    setModel(data.model)
    setTemperature(data.temperature)
    setMaxTokens(data.maxTokens)
    setVoiceMode(data.voiceMode)
    if (data.voiceId) setVoiceId(data.voiceId)
    setTopP(data.topP ?? 1)
    setFreqPen(data.frequencyPenalty ?? 0)
    setPresPen(data.presencePenalty ?? 0)
    if (data.botMode) setBotMode(data.botMode)
  }, [data])

  const save = useMutation({
    mutationFn: async () =>
      (await api.put('/settings/ai', {
        model, temperature, maxTokens, voiceMode, voiceId,
        voiceName: voiceLabel(voiceId),
        topP, frequencyPenalty: freqPen, presencePenalty: presPen,
        botMode,
      })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-settings'] })
      toast.success('Configuración guardada ✨')
    },
    onError: () => toast.error('No se pudo guardar'),
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50/60 to-transparent">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Bot className="w-4.5 h-4.5 text-indigo-600" />
          </span>
          Inteligencia de Sofía
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Elegí el modelo, cómo responde y la voz. Se aplica a los próximos mensajes, sin reiniciar nada.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400 p-6">Cargando…</p>
      ) : (
        <div className="p-6 space-y-8">
          {/* MODO DEL BOT */}
          <section className="pb-2">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">Modo del bot</p>
                <p className="text-xs text-gray-400">IA conversacional o turnos por menú (Code)</p>
              </div>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button type="button" onClick={() => setBotMode('IA')}
                  className={`px-3 py-1.5 text-sm transition-colors ${botMode === 'IA' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  IA
                </button>
                <button type="button" onClick={() => setBotMode('CODE')}
                  className={`px-3 py-1.5 text-sm transition-colors ${botMode === 'CODE' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  Code
                </button>
              </div>
            </div>
          </section>

          {/* MODELO */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Modelo de IA</h3>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {MODELS.map((m) => {
                const active = model === m.id
                return (
                  <button key={m.id} onClick={() => setModel(m.id)} type="button"
                    className={`text-left p-3.5 rounded-xl border transition-all ${
                      active ? 'border-indigo-400 ring-2 ring-indigo-100 bg-indigo-50/40' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-2 font-medium text-gray-900 text-sm">
                        <m.Icon className="w-4 h-4 text-gray-500" />{m.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${TAG_COLORS[m.color]}`}>{m.tag}</span>
                        {active && <Check className="w-4 h-4 text-indigo-600" />}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-snug">{m.desc}</p>
                    <p className="text-[10px] text-gray-300 font-mono mt-1.5">{m.id}</p>
                  </button>
                )
              })}
            </div>
          </section>

          {/* COMPORTAMIENTO */}
          <section className="space-y-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Comportamiento</h3>
            <Slider
              icon={<Thermometer className="w-4 h-4 text-gray-400" />}
              label="Creatividad (temperatura)" value={temperature} min={0} max={1.5} step={0.1}
              hintLeft="0 · preciso" hintRight="1.5 · creativo"
              help={<>Cuánto varía las respuestas. <b>Bajo (0.2–0.4):</b> preciso y consistente, ideal para que no invente. <b>Alto (0.8+):</b> más creativo pero divaga más. Recomendado: <b>0.4</b>.</>}
              onChange={setTemperature}
            />
            <Slider
              icon={<MessageSquareText className="w-4 h-4 text-gray-400" />}
              label="Largo máximo de respuesta" value={maxTokens} min={100} max={2000} step={50} suffix="tokens"
              hintLeft="100 · cortas" hintRight="2000 · largas"
              help={<>Tope de longitud por mensaje (1 token ≈ ¾ de palabra). Más alto = respuestas largas pero más lentas. Para secretaria, <b>400–600</b>.</>}
              onChange={setMaxTokens}
            />
          </section>

          {/* AVANZADO */}
          <section>
            <button type="button" onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600 transition-colors">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Ajustes avanzados
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
            {showAdvanced && (
              <div className="mt-4 space-y-6 p-4 bg-gray-50/70 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-400 -mt-1">
                  Controles finos. Si no estás seguro, dejá los valores por defecto (1 · 0 · 0).
                </p>
                <Slider
                  icon={<span className="text-gray-400 text-xs font-mono">top_p</span>}
                  label="Núcleo (top_p)" value={topP} min={0} max={1} step={0.05}
                  hintLeft="0.5 · enfocado" hintRight="1.0 · abierto"
                  help={<>Limita las palabras candidatas a las más probables. <b>1.0</b> = sin límite (usá la temperatura para variar). Bajarlo a 0.7–0.9 hace respuestas más enfocadas. Lo normal es dejarlo en <b>1.0</b>.</>}
                  onChange={setTopP}
                />
                <Slider
                  icon={<span className="text-gray-400 text-xs font-mono">freq</span>}
                  label="Penalización por frecuencia" value={freqPen} min={-2} max={2} step={0.1}
                  hintLeft="-2" hintRight="2"
                  help={<>Penaliza repetir las mismas palabras. <b>Subilo (0.3–0.8)</b> si notás que Sofía repite frases. <b>0</b> = sin penalización.</>}
                  onChange={setFreqPen}
                />
                <Slider
                  icon={<span className="text-gray-400 text-xs font-mono">pres</span>}
                  label="Penalización por presencia" value={presPen} min={-2} max={2} step={0.1}
                  hintLeft="-2" hintRight="2"
                  help={<>Empuja a introducir temas nuevos. Subilo si se queda “pegada” al mismo tema. <b>0</b> = neutro.</>}
                  onChange={setPresPen}
                />
              </div>
            )}
          </section>

          {/* VOZ */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-2">
              <Mic className="w-3.5 h-3.5" /> Respuestas con voz
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {VOICE_MODES.map((m) => {
                const active = voiceMode === m.v
                return (
                  <button key={m.v} type="button" onClick={() => setVoiceMode(m.v)}
                    title={m.desc}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      active ? 'border-indigo-400 ring-2 ring-indigo-100 bg-indigo-50/40 text-indigo-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}>
                    <span className="block text-xs font-medium">{m.label}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-500 mb-3">{VOICE_MODES.find((m) => m.v === voiceMode)?.desc}</p>

            {voiceMode !== 'never' && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-gray-400" /> Voz y tono
                </label>
                <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300">
                  <optgroup label="Marie (francés) — la que mejor lee español">
                    {VOICES_MARIE.map((v) => <option key={v.id} value={v.id}>Marie · {v.label}</option>)}
                  </optgroup>
                  <optgroup label="Jane (inglés)">
                    {VOICES_JANE.map((v) => <option key={v.id} value={v.id}>Jane · {v.label}</option>)}
                  </optgroup>
                </select>
                <p className="text-xs text-amber-600 mt-2 leading-relaxed">
                  ⚠️ En el plan gratis no se pueden clonar voces propias, solo estas preset. Ninguna es español nativo:
                  <b> Marie</b> es la que mejor lee castellano, aunque con acento. Para una voz propia en español hace falta el plan pago de Mistral.
                </p>
              </div>
            )}
          </section>

          {/* GUARDAR */}
          <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
            <button onClick={() => save.mutate()} disabled={save.isPending}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
              <Save className="w-4 h-4" />
              {save.isPending ? 'Guardando…' : 'Guardar configuración'}
            </button>
            {data && (
              <span className="text-xs text-gray-400">
                Activo ahora: <b className="text-gray-600">{MODELS.find((m) => m.id === data.model)?.name ?? data.model}</b>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
