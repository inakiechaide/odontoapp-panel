'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, MessageSquare, User, Phone, CheckCircle, Plus, X, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

interface Conversation {
  id: string
  telefonoWhatsapp: string
  status: string
  ultimoMensajeAt: string
  patient?: { nombre: string; apellido: string }
}

interface Message {
  id: string
  content: string
  direction: 'INBOUND' | 'OUTBOUND'
  tipo: string
  createdAt: string
  leido: boolean
}

function timeAgo(iso: string) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'Ahora'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`
  if (diff < 86_400_000) return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

const STATUS_LABEL: Record<string, string> = { BOT: 'Bot', HUMANO: 'Humano', CERRADO: 'Cerrado' }
const STATUS_COLOR: Record<string, string> = {
  BOT: 'bg-blue-100 text-blue-700',
  HUMANO: 'bg-green-100 text-green-700',
  CERRADO: 'bg-gray-100 text-gray-500',
}

export default function InboxPage() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [showNewMsg, setShowNewMsg] = useState(false)
  const [newPhone, setNewPhone] = useState('+54')
  const [newText, setNewText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: convs = [] } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const r = await api.get('/conversations?limit=50')
      return r.data?.data ?? []
    },
    refetchInterval: 5000,
  })

  const { data: detail } = useQuery({
    queryKey: ['conv-detail', selectedId],
    queryFn: async () => {
      const r = await api.get(`/conversations/${selectedId}`)
      return r.data as Conversation & { messages?: Message[] }
    },
    enabled: !!selectedId,
    refetchInterval: 3000,
  })

  const messages = detail?.messages ?? []
  const selected = convs.find(c => c.id === selectedId)

  const sendMut = useMutation({
    mutationFn: ({ id, msg }: { id: string; msg: string }) =>
      api.post(`/conversations/${id}/reply`, { message: msg }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conv-detail', selectedId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
      setText('')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error al enviar'),
  })

  const newMsgMut = useMutation({
    mutationFn: ({ phone, msg }: { phone: string; msg: string }) =>
      api.post('/conversations/send', { phone, message: msg }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      setShowNewMsg(false)
      setNewPhone('+54')
      setNewText('')
      toast.success('Mensaje enviado por WhatsApp')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error al enviar'),
  })

  const takeoverMut = useMutation({
    mutationFn: (id: string) => api.put(`/conversations/${id}/takeover`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      toast.success('Conversación tomada')
    },
  })

  const closeMut = useMutation({
    mutationFn: (id: string) => api.put(`/conversations/${id}/close`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      setSelectedId(null)
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = () => {
    if (!text.trim() || !selectedId) return
    sendMut.mutate({ id: selectedId, msg: text.trim() })
  }

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

  return (
    <div className="flex h-[calc(100vh-130px)] bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Sidebar */}
      <div className={cn("w-full lg:w-72 flex-shrink-0 border-r border-gray-100 flex flex-col", selectedId && "hidden lg:flex")}>
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <span className="font-semibold text-gray-900 text-sm">WhatsApp</span>
          {convs.length > 0 && (
            <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full font-medium">
              {convs.length}
            </span>
          )}
          <button
            onClick={() => setShowNewMsg(true)}
            className="ml-auto w-7 h-7 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors"
            title="Enviar nuevo mensaje"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {convs.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Sin conversaciones</p>
              <p className="text-xs mt-1 text-gray-300">Los mensajes aparecen automáticamente</p>
              <button
                onClick={() => setShowNewMsg(true)}
                className="mt-3 px-4 py-2 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600"
              >
                Enviar primer mensaje
              </button>
            </div>
          ) : convs.map(conv => (
            <button
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={cn(
                'w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors',
                selectedId === conv.id && 'bg-brand-50 border-l-2 border-l-brand-500'
              )}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-800 text-sm truncate">
                      {conv.patient ? `${conv.patient.nombre} ${conv.patient.apellido}` : conv.telefonoWhatsapp}
                    </p>
                    <span className="text-xs text-gray-400 ml-1 flex-shrink-0">{timeAgo(conv.ultimoMensajeAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', STATUS_COLOR[conv.status] ?? 'bg-gray-100 text-gray-500')}>
                      {STATUS_LABEL[conv.status] ?? conv.status}
                    </span>
                    <span className="text-xs text-gray-400 truncate">{conv.telefonoWhatsapp}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      {selectedId && selected ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedId(null)} className="p-1 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden" aria-label="Volver">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  {selected.patient ? `${selected.patient.nombre} ${selected.patient.apellido}` : selected.telefonoWhatsapp}
                </p>
                <p className="text-xs text-gray-400">{selected.telefonoWhatsapp}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {selected.status === 'BOT' && (
                <button onClick={() => takeoverMut.mutate(selectedId)}
                  className="px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700">
                  Tomar conversación
                </button>
              )}
              {selected.status !== 'CERRADO' && (
                <button onClick={() => closeMut.mutate(selectedId)}
                  className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50">
                  Cerrar
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#f0f2f5]">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-10">Sin mensajes</div>
            ) : messages.map(msg => (
              <div key={msg.id} className={cn('flex', msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-sm px-3.5 py-2 rounded-2xl text-sm shadow-sm',
                  msg.direction === 'OUTBOUND' ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-sm' : 'bg-white text-gray-800 rounded-tl-sm'
                )}>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {timeAgo(msg.createdAt)}
                    {msg.direction === 'OUTBOUND' && <CheckCircle className="w-3 h-3 inline ml-1 text-green-500" />}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-3 border-t border-gray-100 bg-white">
            {selected.status === 'CERRADO' ? (
              <p className="text-center text-sm text-gray-400">Conversación cerrada</p>
            ) : selected.status === 'BOT' ? (
              <p className="text-center text-sm text-amber-600 bg-amber-50 rounded-lg py-2 px-3">
                Hacé clic en <strong>"Tomar conversación"</strong> para responder manualmente
              </p>
            ) : (
              <div className="flex gap-2 items-end">
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Escribí un mensaje... (Enter para enviar)"
                  rows={2}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none bg-gray-50"
                />
                <button onClick={handleSend} disabled={!text.trim() || sendMut.isPending}
                  className="w-10 h-10 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                  {sendMut.isPending
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Send className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden lg:flex items-center justify-center bg-[#f0f2f5]">
          <div className="text-center text-gray-400">
            <MessageSquare className="w-14 h-14 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-gray-500">Seleccioná una conversación</p>
            <p className="text-sm mt-1">o enviá un mensaje nuevo con el botón +</p>
          </div>
        </div>
      )}

      {/* Modal nuevo mensaje */}
      {showNewMsg && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Nuevo mensaje WhatsApp</h3>
              <button onClick={() => setShowNewMsg(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Número de WhatsApp *</label>
                <input
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="+5492494671348"
                  className={inp}
                />
                <p className="text-xs text-gray-400 mt-1">Incluí el código de país (+54 para Argentina)</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mensaje *</label>
                <textarea
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  rows={4}
                  placeholder="Hola! Te recordamos que tenés un turno mañana a las 10:00hs."
                  className={`${inp} resize-none`}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowNewMsg(false); setNewPhone('+54'); setNewText('') }}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!newPhone.trim() || !newText.trim()) return toast.error('Completá número y mensaje')
                  newMsgMut.mutate({ phone: newPhone.trim(), msg: newText.trim() })
                }}
                disabled={newMsgMut.isPending}
                className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2"
              >
                {newMsgMut.isPending
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enviando...</>
                  : <><Send className="w-4 h-4" /> Enviar mensaje</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
