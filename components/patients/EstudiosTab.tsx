'use client'

import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, FileText, Trash2, Loader2, ImageIcon, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

const CATEGORIAS = [
  'Rx panorámica',
  'Rx periapical',
  'Rx bitewing',
  'Foto intraoral',
  'Foto extraoral',
  'Documento',
  'Otro',
]

interface Attachment {
  id: string
  nombreArchivo: string
  categoria: string | null
  mimeType: string | null
  tamanioBytes: number | null
  createdAt: string
  url: string | null
}

function esImagen(mime: string | null) {
  return !!mime && mime.startsWith('image/')
}
function pesoLegible(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function EstudiosTab({ patientId }: { patientId: string }) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [categoria, setCategoria] = useState(CATEGORIAS[0])
  const [uploading, setUploading] = useState(false)

  const { data: items, isLoading } = useQuery<Attachment[]>({
    queryKey: ['attachments', patientId],
    queryFn: async () => (await api.get(`/patients/${patientId}/attachments`)).data,
  })

  const delMut = useMutation({
    mutationFn: (id: string) => api.delete(`/attachments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments', patientId] })
      toast.success('Archivo eliminado')
    },
    onError: () => toast.error('No se pudo eliminar'),
  })

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`${file.name} supera los 15 MB`)
          continue
        }
        const fd = new FormData()
        fd.append('file', file)
        fd.append('categoria', categoria)
        await api.post(`/patients/${patientId}/attachments`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
        })
      }
      qc.invalidateQueries({ queryKey: ['attachments', patientId] })
      toast.success('Archivo(s) subido(s)')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'No se pudo subir el archivo')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // Agrupar por categoría
  const grupos = (items ?? []).reduce<Record<string, Attachment[]>>((acc, it) => {
    const k = it.categoria || 'Otro'
    ;(acc[k] = acc[k] || []).push(it)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {/* Subir */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Subir estudio o foto</h3>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-400 font-medium block mb-1">Tipo</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Subiendo...' : 'Elegir archivo'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">Imágenes (JPG, PNG, WEBP, HEIC) o PDF. Hasta 15 MB por archivo.</p>
      </div>

      {/* Galería */}
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-gray-300 animate-spin" /></div>
      ) : !items || items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Todavía no hay estudios ni fotos</p>
          <p className="text-sm text-gray-400 mt-1">Subí radiografías, fotos intraorales o documentos del paciente.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {CATEGORIAS.filter((c) => grupos[c]?.length).map((cat) => (
            <div key={cat}>
              <h4 className="text-sm font-semibold text-gray-600 mb-2">{cat} <span className="text-gray-400 font-normal">({grupos[cat].length})</span></h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {grupos[cat].map((a) => (
                  <div key={a.id} className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <a href={a.url ?? '#'} target="_blank" rel="noopener noreferrer" className="block">
                      {esImagen(a.mimeType) && a.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.url} alt={a.nombreArchivo} className="w-full h-32 object-cover bg-gray-50" />
                      ) : (
                        <div className="w-full h-32 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                          <FileText className="w-8 h-8" />
                          <span className="text-xs mt-1">PDF</span>
                        </div>
                      )}
                    </a>
                    <div className="p-2">
                      <p className="text-xs text-gray-600 truncate" title={a.nombreArchivo}>{a.nombreArchivo}</p>
                      <p className="text-[10px] text-gray-400">{pesoLegible(a.tamanioBytes)}</p>
                    </div>
                    {/* Acciones */}
                    <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={a.url ?? '#'} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 bg-white/90 rounded-lg text-gray-600 hover:text-brand-600 shadow-sm" title="Abrir">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => { if (confirm(`¿Eliminar "${a.nombreArchivo}"?`)) delMut.mutate(a.id) }}
                        className="p-1.5 bg-white/90 rounded-lg text-gray-600 hover:text-red-600 shadow-sm" title="Eliminar">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
