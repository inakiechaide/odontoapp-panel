'use client'

import { useState } from 'react'
import { Package, AlertTriangle, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { useInventory, useRegisterMovement } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function InventarioPage() {
  const [movementModal, setMovementModal] = useState<{ id: string; nombre: string } | null>(null)
  const [tipo, setTipo] = useState<'ENTRADA' | 'SALIDA' | 'CONSUMO'>('CONSUMO')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')

  const { data: items, isLoading } = useInventory()
  const registerMovement = useRegisterMovement()

  const handleMovement = async () => {
    if (!movementModal || !cantidad) return
    try {
      await registerMovement.mutateAsync({
        itemId: movementModal.id,
        tipo,
        cantidad: parseFloat(cantidad),
        motivo: motivo || undefined,
      })
      toast.success('Movimiento registrado')
      setMovementModal(null)
      setCantidad('')
      setMotivo('')
    } catch {
      toast.error('Error al registrar movimiento')
    }
  }

  const lowStock = items?.filter(
    (i) => i.stockMinimo && Number(i.stockActual) <= Number(i.stockMinimo)
  ) ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Inventario</h1>
        {lowStock.length > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg">
            <AlertTriangle className="w-4 h-4" />
            {lowStock.length} ítem{lowStock.length > 1 ? 's' : ''} con stock bajo
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando inventario...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Insumo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Categoría</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stock actual</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Mínimo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items?.map((item) => {
                const isLow = item.stockMinimo && Number(item.stockActual) <= Number(item.stockMinimo)
                return (
                  <tr key={item.id} className={cn('hover:bg-gray-50', isLow && 'bg-red-50/30')}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {isLow && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                        <span className="font-medium text-gray-900">{item.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.categoria || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        'font-semibold',
                        isLow ? 'text-red-600' : 'text-gray-900'
                      )}>
                        {Number(item.stockActual).toFixed(1)}
                      </span>
                      <span className="text-gray-400 text-xs ml-1">{item.unidadMedida}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 hidden md:table-cell">
                      {Number(item.stockMinimo).toFixed(1)} {item.unidadMedida}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setMovementModal({ id: item.id, nombre: item.nombre })}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Movimiento
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de movimiento */}
      {movementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Registrar movimiento</h3>
            <p className="text-sm text-gray-500">{movementModal.nombre}</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="ENTRADA">Entrada (recepción de mercadería)</option>
                <option value="CONSUMO">Consumo (uso en consultorio)</option>
                <option value="SALIDA">Salida (otro motivo)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
                min="0.001" step="0.001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="0.000" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
              <input value={motivo} onChange={(e) => setMotivo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Ej: Cirugía de extracción compleja" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setMovementModal(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleMovement} disabled={!cantidad || registerMovement.isPending}
                className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-60">
                {registerMovement.isPending ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
