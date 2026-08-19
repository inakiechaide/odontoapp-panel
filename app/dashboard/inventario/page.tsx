'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, Plus, AlertTriangle, Search, Edit2, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface Item {
  id: string
  nombre: string
  descripcion?: string
  categoria: string
  unidad: string
  stockActual: number
  stockMinimo: number
  stockMaximo?: number
  precioUnitario?: number
  proveedor?: string
  fechaVencimiento?: string | null
}

const CATEGORIAS = ['MATERIAL_CLINICO','MEDICAMENTO','INSTRUMENTAL','DESCARTABLE','LIMPIEZA','OTRO']
const CAT_LABELS: Record<string, string> = {
  MATERIAL_CLINICO: 'Material clínico', MEDICAMENTO: 'Medicamento',
  INSTRUMENTAL: 'Instrumental', DESCARTABLE: 'Descartable',
  LIMPIEZA: 'Limpieza', OTRO: 'Otro'
}

const DIAS_AVISO = 30

// Estado de vencimiento de un item: null | 'vencido' | 'por_vencer'
function vencimientoEstado(fecha?: string | null): null | 'vencido' | 'por_vencer' {
  if (!fecha) return null
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const v = new Date(fecha); v.setHours(0, 0, 0, 0)
  const dias = Math.round((v.getTime() - hoy.getTime()) / 86400000)
  if (dias < 0) return 'vencido'
  if (dias <= DIAS_AVISO) return 'por_vencer'
  return null
}

function fmtFecha(fecha?: string | null): string {
  if (!fecha) return '—'
  const d = new Date(fecha)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

export default function InventarioPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [form, setForm] = useState({ nombre:'', categoria:'MATERIAL_CLINICO', unidad:'unidad', stockActual:0, stockMinimo:5, proveedor:'', precioUnitario:'', fechaVencimiento:'' })

  const { data, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => { const r = await api.get('/inventory'); return r.data as Item[] },
  })
  const { data: alertas } = useQuery({
    queryKey: ['inventory', 'alertas'],
    queryFn: async () => { const r = await api.get('/inventory/alertas/stock-bajo'); return r.data as Item[] },
  })
  const { data: porVencer } = useQuery({
    queryKey: ['inventory', 'por-vencer'],
    queryFn: async () => { const r = await api.get('/inventory/alertas/por-vencer'); return r.data as Item[] },
  })

  const createMut = useMutation({
    mutationFn: (d: any) => api.post('/inventory', d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['inventory']}); setShowForm(false); toast.success('Item creado') }
  })
  const updateMut = useMutation({
    mutationFn: ({id,...d}: any) => api.put(`/inventory/${id}`, d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['inventory']}); setEditing(null); setShowForm(false); toast.success('Item actualizado') }
  })
  const moveMut = useMutation({
    mutationFn: ({id, tipo, cantidad, motivo}: any) => api.post(`/inventory/${id}/movements`, {tipo, cantidad, motivo}),
    onSuccess: () => { qc.invalidateQueries({queryKey:['inventory']}); toast.success('Movimiento registrado') }
  })

  const items = (data ?? []).filter(i => i.nombre.toLowerCase().includes(search.toLowerCase()))
  const input = 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-full'

  const resetForm = () => setForm({ nombre:'', categoria:'MATERIAL_CLINICO', unidad:'unidad', stockActual:0, stockMinimo:5, proveedor:'', precioUnitario:'', fechaVencimiento:'' })

  const handleSubmit = () => {
    const d = {
      ...form,
      stockActual: Number(form.stockActual),
      stockMinimo: Number(form.stockMinimo),
      precioUnitario: form.precioUnitario ? Number(form.precioUnitario) : undefined,
      fechaVencimiento: form.fechaVencimiento || null,
    }
    if (editing) updateMut.mutate({id: editing.id, ...d})
    else createMut.mutate(d)
  }

  const startEdit = (item: Item) => {
    setEditing(item)
    setForm({
      nombre: item.nombre, categoria: item.categoria, unidad: item.unidad,
      stockActual: item.stockActual, stockMinimo: item.stockMinimo,
      proveedor: item.proveedor ?? '', precioUnitario: item.precioUnitario?.toString() ?? '',
      fechaVencimiento: item.fechaVencimiento ? String(item.fechaVencimiento).slice(0, 10) : '',
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Inventario</h1>
        <button onClick={()=>{ setEditing(null); resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
          <Plus className="w-4 h-4" /> Nuevo item
        </button>
      </div>

      {/* Alerta stock bajo */}
      {alertas && alertas.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Stock bajo en {alertas.length} item{alertas.length>1?'s':''}</p>
            <p className="text-sm text-amber-700 mt-0.5">{alertas.map(a=>a.nombre).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Alerta próximo a vencer / vencido */}
      {porVencer && porVencer.length > 0 && (
        <div className="bg-orange-50 border border-orange-300 rounded-xl p-4 flex items-start gap-3">
          <CalendarClock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-900">
              {porVencer.length} item{porVencer.length>1?'s':''} por vencer o vencido{porVencer.length>1?'s':''}
            </p>
            <p className="text-sm text-orange-700 mt-0.5">
              {porVencer.map(a => `${a.nombre} (${fmtFecha(a.fechaVencimiento)})`).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">{editing ? 'Editar item' : 'Nuevo item'}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label><input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} className={input} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
              <select value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))} className={input}>
                {CATEGORIAS.map(c=><option key={c} value={c}>{CAT_LABELS[c]}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Unidad</label><input value={form.unidad} onChange={e=>setForm(f=>({...f,unidad:e.target.value}))} className={input} placeholder="unidad, caja, ml..." /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Stock actual</label><input type="number" value={form.stockActual} onChange={e=>setForm(f=>({...f,stockActual:Number(e.target.value)}))} className={input} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Stock mínimo</label><input type="number" value={form.stockMinimo} onChange={e=>setForm(f=>({...f,stockMinimo:Number(e.target.value)}))} className={input} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Proveedor</label><input value={form.proveedor} onChange={e=>setForm(f=>({...f,proveedor:e.target.value}))} className={input} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Precio unitario ($)</label><input type="number" value={form.precioUnitario} onChange={e=>setForm(f=>({...f,precioUnitario:e.target.value}))} className={input} /></div>
            <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Fecha de vencimiento</label><input type="date" value={form.fechaVencimiento} onChange={e=>setForm(f=>({...f,fechaVencimiento:e.target.value}))} className={input} /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={()=>setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
            <button onClick={handleSubmit} disabled={createMut.isPending||updateMut.isPending} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-60">
              {editing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-gray-400">Cargando...</div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[720px]">
            <thead><tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Mínimo</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Vence</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Proveedor</th>
              <th className="px-4 py-3"/>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(item => {
                const bajo = Number(item.stockActual) <= Number(item.stockMinimo)
                const venc = vencimientoEstado(item.fechaVencimiento)
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3"><p className="font-medium text-gray-800">{item.nombre}</p><p className="text-xs text-gray-400">{item.unidad}</p></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{CAT_LABELS[item.categoria]??item.categoria}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('font-bold text-base', bajo ? 'text-red-600' : 'text-gray-800')}>{item.stockActual}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400">{item.stockMinimo}</td>
                    <td className="px-4 py-3">
                      {venc === 'vencido' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                          Vencido · {fmtFecha(item.fechaVencimiento)}
                        </span>
                      ) : venc === 'por_vencer' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
                          Próximo a vencer · {fmtFecha(item.fechaVencimiento)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">{fmtFecha(item.fechaVencimiento)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{item.proveedor??'—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={()=>{ const c = prompt('Cantidad a ingresar:'); if(c) moveMut.mutate({id:item.id, tipo:'ENTRADA', cantidad:Number(c), motivo:'Reposición manual'})}} className="p-1.5 rounded hover:bg-green-50 text-green-600 text-xs font-bold">+</button>
                        <button onClick={()=>{ const c = prompt('Cantidad a usar:'); if(c) moveMut.mutate({id:item.id, tipo:'SALIDA', cantidad:Number(c), motivo:'Uso clínico'})}} className="p-1.5 rounded hover:bg-red-50 text-red-500 text-xs font-bold">−</button>
                        <button onClick={()=>startEdit(item)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><Edit2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  )
}
