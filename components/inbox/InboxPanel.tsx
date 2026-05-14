'use client'

import { useState, useEffect, useRef } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  MessageSquare, Bot, UserCheck, X, Send, RefreshCw,
  Volume2, FileText, Image as ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useConversations, useConversation,
  useTakeOverConversation, useCloseConversation, useReplyConversation
} from '@/hooks/useData'
import type { Conversation, Message } from '@/types'
import { toast } from 'sonner'

function ConversationBadge({ status }: { status: string }) {
  if (status === 'HUMANO') return (
    <span className="px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">
      ⚠ Atención
    </span>
  )
  if (status === 'BOT') return (
    <span className="px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
      🤖 Bot
    </span>
  )
  return null
}

function MessageBubble({ message }: { message: Message }) {
  const isBot = message.remitente === 'BOT' || message.remitente === 'HUMANO'

  return (
    <div className={cn('flex', isBot ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
          isBot
            ? 'bg-brand-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        )}
      >
        {message.tipo === 'TEXT' && <p className="whitespace-pre-wrap">{message.contenido}</p>}
        {message.tipo === 'AUDIO' && (
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            <audio controls src={message.urlAdjunto} className="h-6 max-w-[180px]" />
          </div>
        )}
        {message.tipo === 'IMAGE' && (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={message.urlAdjunto} alt="imagen" className="rounded max-w-[200px]" />
            {message.contenido && <p className="mt-1">{message.contenido}</p>}
          </div>
        )}
        {message.tipo === 'DOCUMENT' && (
          <a href={message.urlAdjunto} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 underline">
            <FileText className="w-4 h-4" />
            {message.contenido || 'Documento'}
          </a>
        )}
        <p className={cn(
          'text-xs mt-1',
          isBot ? 'text-white/60' : 'text-gray-400'
        )}>
          {formatDistanceToNow(parseISO(message.createdAt), { locale: es, addSuffix: true })}
          {message.remitente === 'HUMANO' && ' · Secretaría'}
          {message.remitente === 'BOT' && ' · Sofía'}
        </p>
      </div>
    </div>
  )
}

export function InboxPanel() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: conversations } = useConversations()
  const { data: conversation } = useConversation(selectedId ?? '')
  const takeOver = useTakeOverConversation()
  const close = useCloseConversation()
  const reply = useReplyConversation()

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages])

  const handleReply = async () => {
    if (!replyText.trim() || !selectedId) return
    try {
      await reply.mutateAsync({ id: selectedId, message: replyText })
      setReplyText('')
    } catch {
      toast.error('No se pudo enviar el mensaje')
    }
  }

  const convList: Conversation[] = conversations?.data ?? []
  const humanCount = convList.filter((c) => c.status === 'HUMANO').length

  return (
    <div className="flex h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Lista de conversaciones */}
      <div className="w-72 border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">WhatsApp</h2>
            {humanCount > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                {humanCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {convList.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sin conversaciones</p>
            </div>
          )}
          {convList.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={cn(
                'w-full text-left p-3 hover:bg-gray-50 transition-colors',
                selectedId === conv.id && 'bg-brand-50'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-600">
                  {conv.patient
                    ? `${conv.patient.nombre[0]}${conv.patient.apellido[0]}`
                    : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conv.patient
                        ? `${conv.patient.nombre} ${conv.patient.apellido}`
                        : conv.telefonoWhatsapp}
                    </p>
                    {((conv?._count?.messages ?? 0) > 0) && (
                      <span className="w-5 h-5 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                        {(conv?._count as any)?.messages ?? 0}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <ConversationBadge status={conv.status} />
                    {conv.ultimoMensajeAt && (
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(parseISO(conv.ultimoMensajeAt), { locale: es, addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Panel de chat */}
      {selectedId && conversation ? (
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header del chat */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">
                {conversation.patient
                  ? `${conversation.patient.nombre} ${conversation.patient.apellido}`
                  : conversation.telefonoWhatsapp}
              </p>
              <p className="text-xs text-gray-400">{conversation.telefonoWhatsapp}</p>
            </div>
            <div className="flex items-center gap-2">
              {conversation.status === 'BOT' && (
                <button
                  onClick={() => takeOver.mutate(selectedId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-lg transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Tomar control
                </button>
              )}
              {conversation.status === 'HUMANO' && (
                <button
                  onClick={async () => {
                    // Devolver al bot via close + re-open como BOT
                    await close.mutateAsync(selectedId)
                    toast.success('Conversación devuelta al bot')
                    setSelectedId(null)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg transition-colors"
                >
                  <Bot className="w-3.5 h-3.5" />
                  Devolver al bot
                </button>
              )}
              <button
                onClick={() => { close.mutate(selectedId); setSelectedId(null) }}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {(conversation.messages ?? []).map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de respuesta (solo si HUMANO) */}
          {conversation.status === 'HUMANO' ? (
            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply()}
                  placeholder="Escribir respuesta..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || reply.isPending}
                  className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                El bot Sofía está manejando esta conversación
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Seleccioná una conversación</p>
          </div>
        </div>
      )}
    </div>
  )
}
