'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, MessageSquare, User, Phone, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

interface Conversation {
  id: string
  telefonoWhatsapp: string
  status: string
  ultimoMensajeAt: string
  patient?: { nombre: string; apellido: string }
  _count?: { messages: number }
}

interface Message {
  id: string
  content: string
  direction: 'INBOUND' | 'OUTBOUND'
  tipo: string
  createdAt: string
  leido: boolean
}

function formatTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return 'Ahora'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`
  if (diff < 86_400_000) return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

export default function InboxPage() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: convs } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const r = await api.get('/conversations?limit=50')
      return (r.data?.data ?? []) as Conversation[]
    },
    refetchInterval: 5000,
  })

  const { data: convDetail } = useQuery({
    queryKey: ['conversation-detail', selectedId],
    queryFn: async () => {
      const r = await api.get(`/conversations/${selectedId}`)
      return r.data as { messages?: Message[] } & Conversation
    },
    enabled: !!selectedId,
    refetchInterval: 3000,
  })

  const messages = convDetail?.messages ?? []
  const selected = convs?.find(c => c.id === selectedId)

  const sendMut = useMutation({
    mutationFn: ({ convId, message }: { convId: string; message: string }) =>
      api.post(`/conversations/${convId}/reply`, { message }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation-detail', selectedId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
      setText('')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error al enviar mensaje'),
  })

  const takeoverMut = useMutation({
    mutationFn: (id: string) => api.put(`/conversations/${id}/takeover`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      toast.success('Conversación tomada — ahora podés responder')
    },
  })

  const closeMut = useMutation({
    mutationFn: (id: string) => api.put(`/conversations/${id}/close`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      setSelectedId(null)
      toast.success('Conversación cerrada')
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = () => {
    if (!text.trim() || !selectedId || sendMut.isPending) return
    sendMut.mutate({ convId: selectedId, message: text.trim() })
  }

  const statusLabel: Record<string, string> = {
    BOT: 'Bot', HUMANO: 'Humano', CERRADO: 'Cerrado', SPAM: 'Spam'
  }
  const statusColor: Record<string, string> = {
    BOT: 'bg-blue-100 text-blue-700',
    HUMANO: 'bg-green-100 text-green-700',
    CERRADO: 'bg-gray-100 text-gray-500',
    SPAM: 'bg-red-100 text-red-600',
  }

  return (
    <div className="flex h-[calc(100vh-130px)] bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col">
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-500 flex-shrink-0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          <span className="font-semibold text-gray-900 text-sm">WhatsApp</span>
          {convs && convs.length > 0 && (
            <span className="ml-auto text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full font-medium">
              {convs.length}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {!convs || convs.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Sin conversaciones</p>
              <p className="text-xs mt-1 text-gray-300">Los mensajes aparecerán automáticamente</p>
            </div>
          ) : convs.map(conv => (
            <button key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={cn(
                'w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors',
                selectedId === conv.id && 'bg-brand-50 border-l-2 border-l-brand-500'
              )}>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-800 text-sm truncate">
                      {conv.patient ? `${conv.patient.nombre} ${conv.patient.apellido}` : conv.telefonoWhatsapp}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{formatTime(conv.ultimoMensajeAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', statusColor[conv.status] ?? 'bg-gray-100 text-gray-500')}>
                      {statusLabel[conv.status] ?? conv.status}
                    </span>
                    <span className="text-xs text-gray-400 truncate">{conv.telefonoWhatsapp}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat panel */}
      {selectedId && selected ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header del chat */}
          <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  {selected.patient ? `${selected.patient.nombre} ${selected.patient.apellido}` : selected.telefonoWhatsapp}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Phone className="w-3 h-3" />{selected.telefonoWhatsapp}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selected.status === 'BOT' && (
                <button onClick={() => takeoverMut.mutate(selectedId)}
                  disabled={takeoverMut.isPending}
                  className="px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 disabled:opacity-60">
                  Tomar conversación
                </button>
              )}
              {selected.status !== 'CERRADO' && (
                <button onClick={() => closeMut.mutate(selectedId)}
                  disabled={closeMut.isPending}
                  className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50 disabled:opacity-60">
                  Cerrar
                </button>
              )}
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#f0f2f5]">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-10">Sin mensajes aún</div>
            ) : messages.map(msg => (
              <div key={msg.id} className={cn('flex', msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-sm px-3.5 py-2 rounded-2xl text-sm shadow-sm',
                  msg.direction === 'OUTBOUND'
                    ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-sm'
                    : 'bg-white text-gray-800 rounded-tl-sm'
                )}>
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                  <p className="text-xs text-gray-400 mt-1 text-right flex items-center justify-end gap-1">
                    {formatTime(msg.createdAt)}
                    {msg.direction === 'OUTBOUND' && <CheckCircle className="w-3 h-3 text-brand-500" />}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-100 bg-white">
            {selected.status === 'CERRADO' ? (
              <div className="text-center text-sm text-gray-400 py-1">Conversación cerrada</div>
            ) : selected.status === 'BOT' ? (
              <div className="text-center text-sm text-amber-600 bg-amber-50 rounded-lg py-2 px-3">
                El bot está respondiendo. Hacé clic en <strong>"Tomar conversación"</strong> para responder vos.
              </div>
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
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || sendMut.isPending}
                  className="w-10 h-10 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                >
                  {sendMut.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#f0f2f5]">
          <div className="text-center text-gray-400">
            <MessageSquare className="w-14 h-14 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-gray-500">Seleccioná una conversación</p>
            <p className="text-sm mt-1">para ver y responder mensajes</p>
          </div>
        </div>
      )}
    </div>
  )
}
