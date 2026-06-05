'use client'

import { useState, useEffect } from 'react'

// ── Tipos ─────────────────────────────────────────────────────────
export type Cara = 'O' | 'V' | 'L' | 'M' | 'D' | 'TODO'
export type Grupo = 'existente' | 'por_hacer' | 'realizado'

export interface OdontogramMark {
  diente: number
  cara: Cara
  grupo: Grupo
  tipo?: string
}

// ── Colores por grupo (convención del consultorio) ───────────────
const GRUPO_COLOR: Record<Grupo, string> = {
  existente: '#dc2626', // rojo: ya hecho / preexistente / ausencias
  por_hacer: '#2563eb', // azul: por realizarse
  realizado: '#16a34a', // verde: lo realizado por el profesional
}
const GRUPO_LABEL: Record<Grupo, string> = {
  existente: 'Existente (rojo)',
  por_hacer: 'Por hacer (azul)',
  realizado: 'Realizado (verde)',
}

// Tipos de hallazgo por grupo. Los marcados como "diente completo" se aplican a toda la pieza.
const TIPOS: Record<Grupo, string[]> = {
  existente: ['Obturación', 'Corona', 'Endodoncia', 'Implante', 'Resto radicular', 'Ausente'],
  por_hacer: ['Caries', 'Obturación', 'Corona', 'Endodoncia', 'Extracción', 'Implante'],
  realizado: ['Obturación', 'Corona', 'Endodoncia', 'Extracción', 'Sellante', 'Limpieza'],
}
// Tipos que afectan a TODA la pieza (no a una cara puntual)
const TIPOS_DIENTE_COMPLETO = new Set([
  'Corona', 'Endodoncia', 'Implante', 'Resto radicular', 'Ausente', 'Extracción',
])
// Tipos que se dibujan como X sobre la pieza
const TIPOS_X = new Set(['Ausente', 'Extracción'])

// ── Numeración FDI ────────────────────────────────────────────────
const FILA_SUP = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const FILA_INF = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

// Posición en pantalla → cara anatómica (mesial siempre hacia la línea media)
function zoneToCara(zone: string, diente: number): Cara {
  const q = Math.floor(diente / 10)
  const rightIsMesial = q === 1 || q === 4
  switch (zone) {
    case 'top': return 'V'
    case 'bottom': return 'L'
    case 'center': return 'O'
    case 'left': return rightIsMesial ? 'D' : 'M'
    case 'right': return rightIsMesial ? 'M' : 'D'
    default: return 'O'
  }
}

const key = (d: number, c: Cara) => `${d}-${c}`

// ── Diente individual (SVG) ───────────────────────────────────────
function Tooth({
  diente, marks, onZone, readOnly,
}: {
  diente: number
  marks: Record<string, OdontogramMark>
  onZone: (cara: Cara) => void
  readOnly: boolean
}) {
  const fill = (cara: Cara) => {
    const m = marks[key(diente, cara)]
    return m ? GRUPO_COLOR[m.grupo] : '#ffffff'
  }
  const todo = marks[key(diente, 'TODO')]
  const todoColor = todo ? GRUPO_COLOR[todo.grupo] : null
  const esX = todo && TIPOS_X.has(todo.tipo || '')

  const zones: { id: string; cara: Cara; points: string }[] = [
    { id: 'top', cara: zoneToCara('top', diente), points: '0,0 40,0 20,20' },
    { id: 'right', cara: zoneToCara('right', diente), points: '40,0 40,40 20,20' },
    { id: 'bottom', cara: zoneToCara('bottom', diente), points: '0,40 40,40 20,20' },
    { id: 'left', cara: zoneToCara('left', diente), points: '0,0 0,40 20,20' },
  ]

  function handle(cara: Cara) {
    if (readOnly) return
    onZone(cara)
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] font-semibold text-gray-500 tabular-nums">{diente}</span>
      <svg viewBox="0 0 40 40" className="w-9 h-9" style={{ cursor: readOnly ? 'default' : 'pointer' }}>
        {/* Caras laterales/superior/inferior */}
        {zones.map((z) => (
          <polygon
            key={z.id}
            points={z.points}
            fill={fill(z.cara)}
            stroke="#cbd5e1"
            strokeWidth={0.8}
            onClick={() => handle(z.cara)}
          />
        ))}
        {/* Oclusal (centro) */}
        <rect
          x={12} y={12} width={16} height={16}
          fill={fill('O')}
          stroke="#cbd5e1"
          strokeWidth={0.8}
          onClick={() => handle('O')}
        />
        {/* Diente completo: borde de color o X */}
        {todoColor && !esX && (
          <rect x={1} y={1} width={38} height={38} fill="none" stroke={todoColor} strokeWidth={2.5} rx={2} />
        )}
        {esX && (
          <g stroke={todoColor!} strokeWidth={3} strokeLinecap="round">
            <line x1={4} y1={4} x2={36} y2={36} />
            <line x1={36} y1={4} x2={4} y2={36} />
          </g>
        )}
        {/* Capa invisible para click en diente completo cuando hay X (cubre todo) */}
        {!readOnly && (
          <rect x={0} y={0} width={40} height={40} fill="transparent" pointerEvents="none" />
        )}
      </svg>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────
interface Props {
  value?: OdontogramMark[]
  onChange?: (marks: OdontogramMark[]) => void
  readOnly?: boolean
}

export function Odontogram({ value = [], onChange, readOnly = false }: Props) {
  const [marks, setMarks] = useState<Record<string, OdontogramMark>>({})
  const [grupo, setGrupo] = useState<Grupo>('por_hacer')
  const [tipo, setTipo] = useState<string>('Caries')
  const [borrar, setBorrar] = useState(false)

  // Sincronizar con value entrante
  useEffect(() => {
    const map: Record<string, OdontogramMark> = {}
    for (const m of value) map[key(m.diente, m.cara)] = m
    setMarks(map)
  }, [JSON.stringify(value)]) // eslint-disable-line react-hooks/exhaustive-deps

  function emit(next: Record<string, OdontogramMark>) {
    setMarks(next)
    onChange?.(Object.values(next))
  }

  function aplicar(diente: number, cara: Cara) {
    const dienteCompleto = TIPOS_DIENTE_COMPLETO.has(tipo)
    const caraFinal: Cara = dienteCompleto ? 'TODO' : cara
    const k = key(diente, caraFinal)
    const next = { ...marks }

    if (borrar) {
      delete next[k]
      // Si borro y el diente tiene TODO, al clickear cualquier cara en modo borrar quito también TODO si aplica
      emit(next)
      return
    }
    next[k] = { diente, cara: caraFinal, grupo, tipo }
    emit(next)
  }

  function onSelectGrupo(g: Grupo) {
    setGrupo(g)
    setTipo(TIPOS[g][0])
    setBorrar(false)
  }

  return (
    <div className="space-y-4">
      {/* Barra de herramientas */}
      {!readOnly && (
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(GRUPO_COLOR) as Grupo[]).map((g) => (
              <button
                key={g}
                onClick={() => onSelectGrupo(g)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"
                style={{
                  borderColor: grupo === g && !borrar ? GRUPO_COLOR[g] : '#e5e7eb',
                  backgroundColor: grupo === g && !borrar ? `${GRUPO_COLOR[g]}14` : '#fff',
                  color: grupo === g && !borrar ? GRUPO_COLOR[g] : '#6b7280',
                }}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: GRUPO_COLOR[g] }} />
                {GRUPO_LABEL[g]}
              </button>
            ))}

            <select
              value={tipo}
              onChange={(e) => { setTipo(e.target.value); setBorrar(false) }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {TIPOS[grupo].map((t) => (
                <option key={t} value={t}>{t}{TIPOS_DIENTE_COMPLETO.has(t) ? ' (pieza)' : ''}</option>
              ))}
            </select>

            <button
              onClick={() => setBorrar((b) => !b)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${borrar ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              Borrar
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Elegí color y tipo, después tocá la cara del diente (oclusal al centro, vestibular arriba, lingual/palatina abajo, mesial y distal a los lados). Los tipos marcados como “(pieza)” se aplican al diente completo.
          </p>
        </div>
      )}

      {/* Arcadas */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
        <div className="min-w-[680px] space-y-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Superior</p>
            <div className="flex justify-center gap-1">
              {FILA_SUP.map((d, i) => (
                <div key={d} className={i === 8 ? 'ml-3' : ''}>
                  <Tooth diente={d} marks={marks} onZone={(c) => aplicar(d, c)} readOnly={readOnly} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-center gap-1">
              {FILA_INF.map((d, i) => (
                <div key={d} className={i === 8 ? 'ml-3' : ''}>
                  <Tooth diente={d} marks={marks} onZone={(c) => aplicar(d, c)} readOnly={readOnly} />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">Inferior</p>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: GRUPO_COLOR.existente }} /> Existente / ausencias</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: GRUPO_COLOR.por_hacer }} /> Por hacer</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: GRUPO_COLOR.realizado }} /> Realizado por vos</span>
      </div>
    </div>
  )
}
