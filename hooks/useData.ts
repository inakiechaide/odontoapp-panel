import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import api, { PaginatedResponse } from '@/lib/api'
import type { Patient, Conversation, Message, InventoryItem } from '@/types'

// ═══════════════════════════════════════════════
// PATIENTS
// ═══════════════════════════════════════════════

export function usePatients(filters: {
  q?: string; obraSocial?: string; page?: number; limit?: number
} = {}) {
  return useQuery({
    queryKey: ['patients', 'list', filters],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Patient>>('/patients', { params: filters })
      return res.data
    },
    staleTime: 60_000,
  })
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: async () => {
      const res = await api.get<Patient>(`/patients/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useSearchPatients(q: string) {
  return useQuery({
    queryKey: ['patients', 'search', q],
    queryFn: async () => {
      const res = await api.get<Patient[]>('/patients/search', { params: { q } })
      return res.data
    },
    enabled: q.length >= 2,
    staleTime: 30_000,
  })
}

export function useCreatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Patient>) => {
      const res = await api.post<Patient>('/patients', data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  })
}

export function useUpdatePatient(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Patient>) => {
      const res = await api.put<Patient>(`/patients/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] })
      qc.invalidateQueries({ queryKey: ['patients', id] })
    },
  })
}

// ═══════════════════════════════════════════════
// CONVERSATIONS / INBOX
// ═══════════════════════════════════════════════

export function useConversations(status?: string) {
  return useQuery({
    queryKey: ['conversations', 'list', status],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Conversation>>('/conversations', {
        params: { status, limit: 50 },
      })
      return res.data
    },
    staleTime: 5_000, // refetch frecuente
    refetchInterval: 5_000, // polling cada 5s
  })
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['conversations', id],
    queryFn: async () => {
      const res = await api.get<Conversation>(`/conversations/${id}`)
      return res.data
    },
    enabled: !!id,
    refetchInterval: 5_000,
  })
}

export function useTakeOverConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.put(`/conversations/${id}/takeover`, {})
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  })
}

export function useCloseConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.put(`/conversations/${id}/close`, {})
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  })
}

export function useReplyConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, message }: { id: string; message: string }) => {
      const res = await api.post<Message>(`/conversations/${id}/reply`, { message })
      return res.data
    },
    onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: ['conversations', id] }),
  })
}

// ═══════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════

export function useInventory(filters: { categoria?: string; stockBajo?: boolean } = {}) {
  return useQuery({
    queryKey: ['inventory', 'list', filters],
    queryFn: async () => {
      const res = await api.get<InventoryItem[]>('/inventory', { params: filters })
      return res.data
    },
    staleTime: 60_000,
  })
}

export function useLowStockAlerts() {
  return useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: async () => {
      const res = await api.get<InventoryItem[]>('/inventory/alertas/stock-bajo')
      return res.data
    },
    staleTime: 120_000,
    refetchInterval: 300_000, // cada 5 minutos
  })
}

export function useRegisterMovement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      itemId,
      tipo,
      cantidad,
      motivo,
    }: {
      itemId: string
      tipo: string
      cantidad: number
      motivo?: string
    }) => {
      const res = await api.post(`/inventory/${itemId}/movements`, { tipo, cantidad, motivo })
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}
