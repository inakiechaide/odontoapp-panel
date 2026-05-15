'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

// ── Sistema FDI (ISO 3950) — Estándar argentino ───────────────────
// Cuadrantes permanentes: 1=sup.derecho, 2=sup.izquierdo, 3=inf.izquierdo, 4=inf.derecho
// Cuadrantes deciduos:    5=sup.derecho, 6=sup.izquierdo, 7=inf.izquierdo, 8=inf.derecho

export type ToothCondition =
  | 'SANO'           // Blanco
  | 'CARIES'         // Rojo
  | 'OBTURADO'       // Azul - restauración
  | 'EXTRAIDO'       // X negra
  | 'AUSENTE'        // X negra (congénito)
  | 'CORONA'         // Amarillo - corona/prótesis
  | 'IMPLANTE'       // Verde
  | 'ENDODONCIA'     // Naranja
  | 'FRACTURA'       // Línea diagonal
  | 'SELLANTE'       // Celeste

export type ToothFace = 'V' | 'L' | 'M' | 'D' | 'O' // Vestibular, Lingual, Mesial, Distal, Oclusal/Incisal

export interface ToothState {
  condition: ToothCondition
  faces?: Partial<Record<ToothFace, ToothCondition>>
  notes?: string
}

interface ToothData {
  number: number    // FDI number e.g. 11, 36, 48
  name: string      // Clinical name
  type: 'incisor' | 'canine' | 'premolar' | 'molar'
}

// Dentición permanente FDI
const UPPER_RIGHT: ToothData[] = [
  { number: 18, name: 'Molar del juicio', type: 'molar' },
  { number: 17, name: 'Segundo molar', type: 'molar' },
  { number: 16, name: 'Primer molar', type: 'molar' },
  { number: 15, name: 'Segundo premolar', type: 'premolar' },
  { number: 14, name: 'Primer premolar', type: 'premolar' },
  { number: 13, name: 'Canino', type: 'canine' },
  { number: 12, name: 'Incisivo lateral', type: 'incisor' },
  { number: 11, name: 'Incisivo central', type: 'incisor' },
]
const UPPER_LEFT: ToothData[] = [
  { number: 21, name: 'Incisivo central', type: 'incisor' },
  { number: 22, name: 'Incisivo lateral', type: 'incisor' },
  { number: 23, name: 'Canino', type: 'canine' },
  { number: 24, name: 'Primer premolar', type: 'premolar' },
  { number: 25, name: 'Segundo premolar', type: 'premolar' },
  { number: 26, name: 'Primer molar', type: 'molar' },
  { number: 27, name: 'Segundo molar', type: 'molar' },
  { number: 28, name: 'Molar del juicio', type: 'molar' },
]
const LOWER_LEFT: ToothData[] = [
  { number: 31, name: 'Incisivo central', type: 'incisor' },
  { number: 32, name: 'Incisivo lateral', type: 'incisor' },
  { number: 33, name: 'Canino', type: 'canine' },
  { number: 34, name: 'Primer premolar', type: 'premolar' },
  { number: 35, name: 'Segundo premolar', type: 'premolar' },
  { number: 36, name: 'Primer molar', type: 'molar' },
  { number: 37, name: 'Segundo molar', type: 'molar' },
  { number: 38, name: 'Molar del juicio', type: 'molar' },
]
const LOWER_RIGHT: ToothData[] = [
  { number: 48, name: 'Molar del juicio', type: 'molar' },
  { number: 47, name: 'Segundo molar', type: 'molar' },
  { number: 46, name: 'Primer molar', type: 'molar' },
  { number: 45, name: 'Segundo premolar', type: 'premolar' },
  { number: 44, name: 'Primer premolar', type: 'premolar' },
  { number: 43, name: 'Canino', type: 'canine' },
  { number: 42, name: 'Incisivo lateral', type: 'incisor' },
  { number: 41, name: 'Incisivo central', type: 'incisor' },
]

const CONDITION_COLORS: Record<ToothCondition, string> = {
  SANO:       'fill-white stroke-gray-400',
  CARIES:     'fill-red-400 stroke-red-600',
  OBTURADO:   'fill-blue-300 stroke-blue-600',
  EXTRAIDO:   'fill-gray-100 stroke-gray-400',
  AUSENTE:    'fill-gray-100 stroke-gray-400',
  CORONA:     'fill-yellow-200 stroke-yellow-500',
  IMPLANTE:   'fill-green-200 stroke-green-600',
  ENDODONCIA: 'fill-orange-200 stroke-orange-500',
  FRACTURA:   'fill-white stroke-gray-400',
  SELLANTE:   'fill-sky-100 stroke-sky-400',
}

const CONDITION_LABELS: Record<ToothCondition, string> = {
  SANO:       '✓ Sano',
  CARIES:     '● Caries',
  OBTURADO:   '■ Obturado/Restaurado',
  EXTRAIDO:   '✕ Extraído',
  AUSENTE:    '○ Ausente',
  CORONA:     '♦ Corona/Prótesis',
  IMPLANTE:   '+ Implante',
  ENDODONCIA: '↓ Endodoncia',
  FRACTURA:   '/ Fractura',
  SELLANTE:   '· Sellante',
}

interface ToothProps {
  tooth: ToothData
  state: ToothState
  selected: boolean
  onClick: () => void
  isUpper: boolean
}

function ToothSVG({ tooth, state, selected, onClick, isUpper }: ToothProps) {
  const isMolar = tooth.type === 'molar'
  const isExtraido = state.condition === 'EXTRAIDO' || state.condition === 'AUSENTE'
  const baseColor = CONDITION_COLORS[state.condition]

  return (
    <div
      className={cn(
        'flex flex-col items-center cursor-pointer group',
        isUpper ? 'flex-col' : 'flex-col-reverse'
      )}
      onClick={onClick}
    >
      {/* Número FDI */}
      <span className={cn(
        'text-[10px] font-mono font-bold mb-0.5',
        selected ? 'text-blue-700' : 'text-gray-500',
        isUpper ? 'order-last mt-0.5' : 'order-first mb-0.5'
      )}>
        {tooth.number}
      </span>

      {/* Diente SVG */}
      <div className={cn(
        'relative transition-transform group-hover:scale-110',
        selected && 'ring-2 ring-blue-500 ring-offset-1 rounded'
      )}>
        <svg
          width={isMolar ? 28 : 22}
          height={isUpper ? 36 : 36}
          viewBox="0 0 28 40"
          xmlns="http://www.w3.org/2000/svg"
        >
          {isExtraido ? (
            <>
              {/* X para extraído */}
              <line x1="4" y1="4" x2="24" y2="36" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="24" y1="4" x2="4" y2="36" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round"/>
            </>
          ) : (
            <>
              {/* Corona del diente */}
              <rect
                x="3" y={isUpper ? "4" : "4"}
                width="22" height="20"
                rx="3"
                className={baseColor}
                strokeWidth="1.5"
              />
              {/* Raíz */}
              {isMolar ? (
                <>
                  <rect x="6" y={isUpper ? "22" : "14"} width="5" height="14" rx="2"
                    className={baseColor} strokeWidth="1.5"/>
                  <rect x="13" y={isUpper ? "22" : "14"} width="5" height="16" rx="2"
                    className={baseColor} strokeWidth="1.5"/>
                </>
              ) : tooth.type === 'premolar' ? (
                <>
                  <rect x="8" y={isUpper ? "22" : "14"} width="5" height="14" rx="2"
                    className={baseColor} strokeWidth="1.5"/>
                  <rect x="15" y={isUpper ? "22" : "14"} width="5" height="12" rx="2"
                    className={baseColor} strokeWidth="1.5"/>
                </>
              ) : (
                <rect x="9" y={isUpper ? "22" : "14"} width="10" height="16" rx="2"
                  className={baseColor} strokeWidth="1.5"/>
              )}
              {/* Punto de endodoncia */}
              {state.condition === 'ENDODONCIA' && (
                <circle cx="14" cy="14" r="3" fill="#f97316" stroke="#ea580c" strokeWidth="1"/>
              )}
              {/* Línea de fractura */}
              {state.condition === 'FRACTURA' && (
                <line x1="14" y1="4" x2="10" y2="24" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,2"/>
              )}
            </>
          )}
        </svg>
      </div>
    </div>
  )
}

// ── CONDICIONES disponibles para seleccionar ──
const CONDITIONS: ToothCondition[] = [
  'SANO', 'CARIES', 'OBTURADO', 'EXTRAIDO',
  'CORONA', 'IMPLANTE', 'ENDODONCIA', 'FRACTURA', 'SELLANTE'
]

const CONDITION_COLORS_UI: Record<ToothCondition, string> = {
  SANO:       'bg-white border-gray-300 text-gray-700',
  CARIES:     'bg-red-100 border-red-400 text-red-800',
  OBTURADO:   'bg-blue-100 border-blue-400 text-blue-800',
  EXTRAIDO:   'bg-gray-100 border-gray-400 text-gray-600',
  AUSENTE:    'bg-gray-100 border-gray-400 text-gray-600',
  CORONA:     'bg-yellow-100 border-yellow-400 text-yellow-800',
  IMPLANTE:   'bg-green-100 border-green-500 text-green-800',
  ENDODONCIA: 'bg-orange-100 border-orange-400 text-orange-800',
  FRACTURA:   'bg-red-50 border-red-300 text-red-700',
  SELLANTE:   'bg-sky-100 border-sky-400 text-sky-800',
}

interface OdontogramProps {
  value?: Record<number, ToothState>
  onChange?: (teeth: Record<number, ToothState>) => void
  readOnly?: boolean
}

export function Odontogram({ value = {}, onChange, readOnly = false }: OdontogramProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [teeth, setTeeth] = useState<Record<number, ToothState>>(value)

  const getState = (num: number): ToothState =>
    teeth[num] ?? { condition: 'SANO' }

  const setCondition = (condition: ToothCondition) => {
    if (!selectedTooth || readOnly) return
    const updated = { ...teeth, [selectedTooth]: { ...getState(selectedTooth), condition } }
    setTeeth(updated)
    onChange?.(updated)
  }

  const selectedState = selectedTooth ? getState(selectedTooth) : null

  const renderRow = (row: ToothData[], isUpper: boolean) => (
    <div className="flex items-end gap-0.5">
      {row.map((tooth) => (
        <ToothSVG
          key={tooth.number}
          tooth={tooth}
          state={getState(tooth.number)}
          selected={selectedTooth === tooth.number}
          onClick={() => !readOnly && setSelectedTooth(
            selectedTooth === tooth.number ? null : tooth.number
          )}
          isUpper={isUpper}
        />
      ))}
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-sm">
          Odontograma <span className="text-gray-400 font-normal">(Sistema FDI)</span>
        </h3>
        <div className="flex gap-3 text-xs text-gray-400">
          <span>Der. paciente →</span>
          <span>← Izq. paciente</span>
        </div>
      </div>

      {/* Leyenda lateral */}
      <div className="flex gap-4">
        <div className="flex-1">
          {/* Arcada superior */}
          <div className="mb-0.5">
            <div className="text-[10px] text-gray-400 text-center mb-1 font-medium tracking-wide uppercase">
              Superior — Maxilar
            </div>
            <div className="flex justify-center gap-1">
              {/* Línea divisoria cuadrantes */}
              <div className="flex items-end">
                {renderRow(UPPER_RIGHT, true)}
                <div className="w-px h-8 bg-gray-300 mx-1 mb-1"/>
                {renderRow(UPPER_LEFT, true)}
              </div>
            </div>
          </div>

          {/* Separador oclusal */}
          <div className="w-full h-px bg-gray-200 my-2"/>

          {/* Arcada inferior */}
          <div className="mt-0.5">
            <div className="flex justify-center gap-1">
              <div className="flex items-start">
                {renderRow(LOWER_RIGHT, false)}
                <div className="w-px h-8 bg-gray-300 mx-1 mt-1"/>
                {renderRow(LOWER_LEFT, false)}
              </div>
            </div>
            <div className="text-[10px] text-gray-400 text-center mt-1 font-medium tracking-wide uppercase">
              Inferior — Mandíbular
            </div>
          </div>
        </div>
      </div>

      {/* Panel de edición al seleccionar una pieza */}
      {selectedTooth && !readOnly && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-blue-800">
              Pieza {selectedTooth}
              <span className="font-normal text-blue-600 ml-2">
                {[...UPPER_RIGHT, ...UPPER_LEFT, ...LOWER_LEFT, ...LOWER_RIGHT]
                  .find(t => t.number === selectedTooth)?.name}
              </span>
            </p>
            <button
              onClick={() => setSelectedTooth(null)}
              className="text-blue-400 hover:text-blue-600 text-xs"
            >
              Cerrar ✕
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CONDITIONS.map((cond) => (
              <button
                key={cond}
                onClick={() => setCondition(cond)}
                className={cn(
                  'px-2 py-1 text-xs rounded-full border font-medium transition-all',
                  selectedState?.condition === cond
                    ? 'ring-2 ring-offset-1 ring-blue-500 scale-105'
                    : 'hover:scale-105',
                  CONDITION_COLORS_UI[cond]
                )}
              >
                {CONDITION_LABELS[cond]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 mb-1.5 font-medium">REFERENCIAS:</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {CONDITIONS.map((cond) => (
            <span key={cond} className="flex items-center gap-1 text-[10px] text-gray-500">
              <span className={cn(
                'w-3 h-3 rounded-sm border inline-block',
                CONDITION_COLORS_UI[cond].replace('text-', 'border-').split(' ')[1]
              )} style={{
                backgroundColor: {
                  SANO: 'white', CARIES: '#fca5a5', OBTURADO: '#93c5fd',
                  EXTRAIDO: '#e5e7eb', AUSENTE: '#e5e7eb', CORONA: '#fde68a',
                  IMPLANTE: '#a7f3d0', ENDODONCIA: '#fed7aa', FRACTURA: '#fee2e2', SELLANTE: '#e0f2fe'
                }[cond]
              }}/>
              {CONDITION_LABELS[cond].split(' ').slice(1).join(' ')}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
