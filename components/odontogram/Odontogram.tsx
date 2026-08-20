'use client'
import { useState, useEffect } from 'react'

// ── Tipos ─────────────────────────────────────────────────────────
export type Cara = 'O' | 'V' | 'L' | 'M' | 'D' | 'TODO' | 'APICE' | 'FURCA' | 'MARGEN' | 'INTER' | 'UNIDA'
export type Grupo = 'existente' | 'por_hacer' | 'realizado'
export interface OdontogramMark {
  diente: number
  cara: Cara
  grupo: Grupo
  tipo?: string
}

type ColorKey = 'rojo' | 'azul'
const COLORS: Record<ColorKey, string> = { rojo: '#dc2626', azul: '#2563eb' }

type Slot = 'cara' | 'pieza' | 'apice' | 'furca' | 'margen' | 'inter' | 'unida'
type Render =
  | 'cara_fill' | 'cara_dual' | 'tc' | 'oclusal_fill'
  | 'pieza_fill' | 'x' | 'circulo' | 'doble_circulo' | 'incisal' | 'erupcionar' | 'doble_linea'
  | 'punto' | 'cuadrito' | 'triangulo' | 'margen_line'
  | 'inter_linea' | 'inter_flecha' | 'conector'

interface Prestacion {
  id: string
  label: string
  cat: string
  color: ColorKey
  color2?: ColorKey
  slot: Slot
  render: Render
  grados?: boolean
}

// ── Catálogo de prestaciones (convención del consultorio) ─────────
const PRESTACIONES: Prestacion[] = [
  { id: 'caries', label: 'Caries', cat: 'Caras', color: 'azul', slot: 'cara', render: 'cara_fill' },
  { id: 'restauracion', label: 'Restauración presente', cat: 'Caras', color: 'rojo', slot: 'cara', render: 'cara_fill' },
  { id: 'restauracion_filtrada', label: 'Restauración filtrada', cat: 'Caras', color: 'rojo', color2: 'azul', slot: 'cara', render: 'cara_dual' },
  { id: 'conducto', label: 'Conducto a realizar (TC)', cat: 'Caras', color: 'azul', slot: 'cara', render: 'tc' },
  { id: 'surco_cariado', label: 'Surco profundo cariado', cat: 'Caras', color: 'azul', slot: 'cara', render: 'oclusal_fill' },

  { id: 'implante', label: 'Implante', cat: 'Pieza completa', color: 'rojo', slot: 'pieza', render: 'pieza_fill' },
  { id: 'resto_radicular', label: 'Resto radicular', cat: 'Pieza completa', color: 'azul', slot: 'pieza', render: 'pieza_fill' },
  { id: 'ausente_exfoliacion', label: 'Ausente (por exfoliación)', cat: 'Pieza completa', color: 'rojo', slot: 'pieza', render: 'x' },
  { id: 'ausente_no_erupcion', label: 'Ausente (por no erupción)', cat: 'Pieza completa', color: 'azul', slot: 'pieza', render: 'x' },
  { id: 'corona', label: 'Corona', cat: 'Pieza completa', color: 'rojo', slot: 'pieza', render: 'circulo' },
  { id: 'corona_filtrada', label: 'Corona filtrada', cat: 'Pieza completa', color: 'rojo', color2: 'azul', slot: 'pieza', render: 'doble_circulo' },
  { id: 'facetas', label: 'Facetas y atriciones', cat: 'Pieza completa', color: 'azul', slot: 'pieza', render: 'incisal' },
  { id: 'erupcionar', label: 'Diente a erupcionar', cat: 'Pieza completa', color: 'azul', slot: 'pieza', render: 'erupcionar' },
  { id: 'extraccion', label: 'Indicado a extracción', cat: 'Pieza completa', color: 'azul', slot: 'pieza', render: 'doble_linea' },

  { id: 'fistula', label: 'Fístula', cat: 'Raíz / ápice', color: 'rojo', slot: 'apice', render: 'punto' },
  { id: 'periapical', label: 'Lesión periapical', cat: 'Raíz / ápice', color: 'azul', slot: 'apice', render: 'punto' },
  { id: 'ortodoncia', label: 'Ortodoncia', cat: 'Raíz / ápice', color: 'rojo', slot: 'apice', render: 'cuadrito' },
  { id: 'furca', label: 'Lesión de furca', cat: 'Raíz / ápice', color: 'rojo', slot: 'furca', render: 'triangulo', grados: true },
  { id: 'margen_gingival', label: 'Altura margen gingival', cat: 'Raíz / ápice', color: 'rojo', slot: 'margen', render: 'margen_line' },

  { id: 'diastema', label: 'Diastema', cat: 'Entre piezas', color: 'rojo', slot: 'inter', render: 'inter_linea' },
  { id: 'empaquetamiento', label: 'Empaquetamiento de comida', cat: 'Entre piezas', color: 'azul', slot: 'inter', render: 'inter_flecha' },
  { id: 'puente', label: 'Puente fijo', cat: 'Entre piezas', color: 'rojo', slot: 'unida', render: 'conector' },
  { id: 'protesis', label: 'Prótesis', cat: 'Entre piezas', color: 'rojo', slot: 'unida', render: 'conector' },
]
const P_BY_ID: Record<string, Prestacion> = Object.fromEntries(PRESTACIONES.map((p) => [p.id, p]))

// Resuelve la prestación de una marca (soporta furca_1/2/3)
function presDe(tipo?: string): { p?: Prestacion; grado?: number } {
  if (!tipo) return {}
  if (P_BY_ID[tipo]) return { p: P_BY_ID[tipo] }
  const m = tipo.match(/^furca_(\d)$/)
  if (m) return { p: P_BY_ID['furca'], grado: Number(m[1]) }
  return {}
}

// ── Numeración FDI ────────────────────────────────────────────────
const FILA_SUP = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const FILA_INF = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

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

// Geometría del layout
const TW = 40, GAP = 10, MID = 20, MARGIN = 12, APICE = 22, NUM = 14
const stepX = (i: number) => MARGIN + i * (TW + GAP) + (i >= 8 ? MID : 0)
const rowWidth = MARGIN * 2 + 16 * TW + 15 * GAP + MID
const rowHeight = APICE + TW + NUM + 6

// ── Un diente (grupo SVG) ─────────────────────────────────────────
function ToothSVG({
  diente, x, apiceArriba, marks, onZone, readOnly,
}: {
  diente: number
  x: number
  apiceArriba: boolean
  marks: Record<string, OdontogramMark>
  onZone: (cara: Cara) => void
  readOnly: boolean
}) {
  const ty = apiceArriba ? APICE : NUM             // top del cuadrito
  const ay = apiceArriba ? APICE / 2 + 2 : ty + TW + APICE / 2 - 2  // centro zona ápice
  const numY = apiceArriba ? ty + TW + 11 : 11

  const piezaTodo = marks[key(diente, 'TODO')]
  const piezaPres = presDe(piezaTodo?.tipo).p

  // Color de fill de una cara (contempla pieza completa rellena)
  const fillCara = (cara: Cara): string => {
    if (piezaPres?.render === 'pieza_fill') return COLORS[piezaPres.color]
    const m = marks[key(diente, cara)]
    if (!m) return '#ffffff'
    const p = presDe(m.tipo).p
    if (!p) return '#ffffff'
    if (p.render === 'cara_fill' || p.render === 'cara_dual' || p.render === 'oclusal_fill') return COLORS[p.color]
    return '#ffffff'
  }
  const strokeCara = (cara: Cara): string => {
    const m = marks[key(diente, cara)]
    const p = m && presDe(m.tipo).p
    if (p?.render === 'cara_dual' && p.color2) return COLORS[p.color2]
    return '#cbd5e1'
  }
  const strokeWCara = (cara: Cara): number => {
    const m = marks[key(diente, cara)]
    const p = m && presDe(m.tipo).p
    return p?.render === 'cara_dual' ? 2 : 0.8
  }

  const zones = [
    { id: 'top', cara: zoneToCara('top', diente), points: `0,0 ${TW},0 ${TW / 2},${TW / 2}` },
    { id: 'right', cara: zoneToCara('right', diente), points: `${TW},0 ${TW},${TW} ${TW / 2},${TW / 2}` },
    { id: 'bottom', cara: zoneToCara('bottom', diente), points: `0,${TW} ${TW},${TW} ${TW / 2},${TW / 2}` },
    { id: 'left', cara: zoneToCara('left', diente), points: `0,0 0,${TW} ${TW / 2},${TW / 2}` },
  ]
  const cx = TW / 2, cy = TW / 2
  const col = piezaPres ? COLORS[piezaPres.color] : '#000'
  const col2 = piezaPres?.color2 ? COLORS[piezaPres.color2] : col
  const handle = (c: Cara) => { if (!readOnly) onZone(c) }

  return (
    <g transform={`translate(${x},0)`}>
      {/* Número */}
      <text x={cx} y={numY} textAnchor="middle" fontSize={10} fontWeight={600} fill="#64748b">{diente}</text>

      {/* Cuadrito de caras */}
      <g transform={`translate(0,${ty})`}>
        {zones.map((z) => (
          <polygon key={z.id} points={z.points} fill={fillCara(z.cara)}
            stroke={strokeCara(z.cara)} strokeWidth={strokeWCara(z.cara)}
            onClick={() => handle(z.cara)} style={{ cursor: readOnly ? 'default' : 'pointer' }} />
        ))}
        <rect x={12} y={12} width={16} height={16} fill={fillCara('O')}
          stroke={strokeCara('O')} strokeWidth={strokeWCara('O')}
          onClick={() => handle('O')} style={{ cursor: readOnly ? 'default' : 'pointer' }} />

        {/* Texto TC en caras con conducto */}
        {(['O', 'V', 'L', 'M', 'D'] as Cara[]).map((c) => {
          const m = marks[key(diente, c)]
          if (!m || presDe(m.tipo).p?.render !== 'tc') return null
          const pos: Record<string, [number, number]> = { O: [cx, cy + 2], V: [cx, 8], L: [cx, TW - 4], M: [6, cy + 2], D: [TW - 12, cy + 2] }
          const [px, py] = pos[c] ?? [cx, cy]
          return <text key={c} x={px} y={py} textAnchor="middle" fontSize={8} fontWeight={700} fill={COLORS[presDe(m.tipo).p!.color]} pointerEvents="none">TC</text>
        })}

        {/* Símbolo de pieza completa */}
        {piezaPres?.render === 'x' && (
          <g stroke={col} strokeWidth={3} strokeLinecap="round" pointerEvents="none">
            <line x1={4} y1={4} x2={TW - 4} y2={TW - 4} /><line x1={TW - 4} y1={4} x2={4} y2={TW - 4} />
          </g>
        )}
        {piezaPres?.render === 'circulo' && (
          <circle cx={cx} cy={cy} r={TW / 2 - 1} fill="none" stroke={col} strokeWidth={2.5} pointerEvents="none" />
        )}
        {piezaPres?.render === 'doble_circulo' && (
          <g fill="none" pointerEvents="none">
            <circle cx={cx} cy={cy} r={TW / 2 - 4} stroke={col} strokeWidth={2.2} />
            <circle cx={cx} cy={cy} r={TW / 2 - 1} stroke={col2} strokeWidth={2.2} />
          </g>
        )}
        {piezaPres?.render === 'incisal' && (
          <line x1={2} y1={2} x2={TW - 2} y2={2} stroke={col} strokeWidth={4} strokeLinecap="round" pointerEvents="none" />
        )}
        {piezaPres?.render === 'doble_linea' && (
          <g stroke={col} strokeWidth={2.4} pointerEvents="none">
            <line x1={0} y1={cy - 4} x2={TW} y2={cy - 4} /><line x1={0} y1={cy + 4} x2={TW} y2={cy + 4} />
          </g>
        )}
        {piezaPres?.render === 'erupcionar' && (
          <g stroke={col} strokeWidth={2.4} fill="none" strokeLinecap="round" pointerEvents="none">
            <line x1={cx - 6} y1={apiceArriba ? TW - 2 : 2} x2={cx - 6} y2={cy} /><line x1={cx + 6} y1={apiceArriba ? TW - 2 : 2} x2={cx + 6} y2={cy} />
            <path d={`M ${cx - 9} ${cy - 3} L ${cx - 6} ${cy} L ${cx - 3} ${cy - 3}`} />
            <path d={`M ${cx + 3} ${cy - 3} L ${cx + 6} ${cy} L ${cx + 9} ${cy - 3}`} />
          </g>
        )}
        {piezaPres?.render === 'margen_line' && (
          <path d={`M 0 ${TW - 3} Q ${cx / 2} ${TW - 9}, ${cx} ${TW - 3} T ${TW} ${TW - 3}`} fill="none" stroke={col} strokeWidth={2} pointerEvents="none" />
        )}

        {/* Margen gingival como símbolo propio (slot MARGEN) */}
        {(() => {
          const m = marks[key(diente, 'MARGEN')]
          const p = m && presDe(m.tipo).p
          if (p?.render !== 'margen_line') return null
          return <path d={`M 0 ${TW - 3} Q ${cx / 2} ${TW - 9}, ${cx} ${TW - 3} T ${TW} ${TW - 3}`} fill="none" stroke={COLORS[p.color]} strokeWidth={2} pointerEvents="none" />
        })()}
      </g>

      {/* Zona ápice: fístula / periapical (punto), ortodoncia (cuadrito), furca (triángulo) */}
      {(() => {
        const out: JSX.Element[] = []
        const ap = marks[key(diente, 'APICE')]
        const apP = ap && presDe(ap.tipo).p
        if (apP?.render === 'punto') out.push(<circle key="pt" cx={cx} cy={ay} r={3.5} fill={COLORS[apP.color]} pointerEvents="none" />)
        if (apP?.render === 'cuadrito') out.push(<rect key="sq" x={cx - 4} y={ay - 4} width={8} height={8} fill="none" stroke={COLORS[apP.color]} strokeWidth={1.6} pointerEvents="none" />)
        const fu = marks[key(diente, 'FURCA')]
        const fuInfo = fu && presDe(fu.tipo)
        if (fuInfo?.p?.render === 'triangulo') {
          const g = fuInfo.grado ?? 3
          const c = COLORS[fuInfo.p.color]
          out.push(
            <polygon key="fu" points={`${cx - 5},${ay - 4} ${cx + 5},${ay - 4} ${cx},${ay + 5}`}
              fill={g >= 2 ? c : 'none'} stroke={c} strokeWidth={1.6} pointerEvents="none" opacity={g === 2 ? 0.5 : 1} />,
          )
        }
        return out
      })()}

      {/* Capa invisible para captar clicks de símbolos de pieza (no bloquea caras: va detrás) */}
    </g>
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
  const [presId, setPresId] = useState<string>('caries')
  const [gradoFurca, setGradoFurca] = useState<number>(1)
  const [borrar, setBorrar] = useState(false)

  useEffect(() => {
    const map: Record<string, OdontogramMark> = {}
    for (const m of value) map[key(m.diente, m.cara)] = m
    setMarks(map)
  }, [JSON.stringify(value)]) // eslint-disable-line react-hooks/exhaustive-deps

  const pres = P_BY_ID[presId]

  function emit(next: Record<string, OdontogramMark>) {
    setMarks(next)
    onChange?.(Object.values(next))
  }

  function slotCara(p: Prestacion, caraClick: Cara): Cara {
    switch (p.slot) {
      case 'cara': return caraClick
      case 'pieza': return 'TODO'
      case 'apice': return 'APICE'
      case 'furca': return 'FURCA'
      case 'margen': return 'MARGEN'
      case 'inter': return 'INTER'
      case 'unida': return 'UNIDA'
    }
  }

  function aplicar(diente: number, caraClick: Cara) {
    if (borrar) {
      const next = { ...marks }
      // borra la cara tocada + todos los slots de símbolo del diente
      for (const c of [caraClick, 'TODO', 'APICE', 'FURCA', 'MARGEN', 'INTER', 'UNIDA'] as Cara[]) {
        delete next[key(diente, c)]
      }
      emit(next)
      return
    }
    if (!pres) return
    const cara = slotCara(pres, caraClick)
    const grupo: Grupo = pres.color === 'rojo' ? 'existente' : 'por_hacer'
    const tipo = pres.grados ? `${pres.id}_${gradoFurca}` : pres.id
    const next = { ...marks, [key(diente, cara)]: { diente, cara, grupo, tipo } }
    emit(next)
  }

  // Conectores entre piezas (INTER: diastema/empaquetamiento ; UNIDA: puente/prótesis)
  function conectores(fila: number[], apiceArriba: boolean) {
    const els: JSX.Element[] = []
    const baseY = apiceArriba ? NUM + TW / 2 : NUM + TW + 4
    for (let i = 0; i < fila.length; i++) {
      const d = fila[i]
      const xi = stepX(i)
      // INTER: relación con el siguiente diente en pantalla
      const inter = marks[key(d, 'INTER')]
      if (inter && i < fila.length - 1) {
        const p = presDe(inter.tipo).p!
        const c = COLORS[p.color]
        const x1 = xi + TW, x2 = stepX(i + 1)
        const midx = (x1 + x2) / 2
        if (p.render === 'inter_linea') {
          els.push(<g key={`in${d}`} stroke={c} strokeWidth={2}>
            <line x1={x1} y1={baseY} x2={x2} y2={baseY} />
            <line x1={x1} y1={baseY - 4} x2={x1} y2={baseY + 4} />
            <line x1={x2} y1={baseY - 4} x2={x2} y2={baseY + 4} />
          </g>)
        } else { // flecha empaquetamiento
          els.push(<g key={`in${d}`} stroke={c} strokeWidth={2} fill="none" strokeLinecap="round">
            <line x1={midx} y1={baseY + 6} x2={midx} y2={baseY - 8} />
            <path d={`M ${midx - 4} ${baseY - 4} L ${midx} ${baseY - 8} L ${midx + 4} ${baseY - 4}`} />
          </g>)
        }
      }
      // UNIDA: conecta con el siguiente si ambos están unidos
      const uni = marks[key(d, 'UNIDA')]
      if (uni && i < fila.length - 1 && marks[key(fila[i + 1], 'UNIDA')]) {
        const p = presDe(uni.tipo).p!
        els.push(<line key={`un${d}`} x1={xi + TW / 2} y1={baseY + 6} x2={stepX(i + 1) + TW / 2} y2={baseY + 6} stroke={COLORS[p.color]} strokeWidth={2.5} />)
      }
    }
    return els
  }

  const cats = Array.from(new Set(PRESTACIONES.map((p) => p.cat)))

  return (
    <div className="space-y-4">
      {/* Barra de herramientas */}
      {!readOnly && (
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[pres?.color ?? 'azul'] }} />
              <select
                value={presId}
                onChange={(e) => { setPresId(e.target.value); setBorrar(false) }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-w-[220px]"
              >
                {cats.map((cat) => (
                  <optgroup key={cat} label={cat}>
                    {PRESTACIONES.filter((p) => p.cat === cat).map((p) => (
                      <option key={p.id} value={p.id}>{p.label} · {p.color === 'rojo' ? 'rojo' : 'azul'}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {pres?.grados && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Grado:</span>
                {[1, 2, 3].map((g) => (
                  <button key={g} onClick={() => setGradoFurca(g)}
                    className={`w-7 h-7 rounded-lg border text-sm ${gradoFurca === g ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                    {g}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setBorrar((b) => !b)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${borrar ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              Borrar
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Elegí la prestación (el color es automático) y tocá el diente: las de “Caras” se marcan en la cara que tocás; las de pieza, raíz o entre-piezas se aplican con un click en el diente. Para diastema/empaquetamiento/puente, la marca conecta con el diente de la derecha.
          </p>
        </div>
      )}

      {/* Arcadas */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
        <div style={{ minWidth: rowWidth }} className="space-y-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Superior</p>
            <svg width={rowWidth} height={rowHeight} viewBox={`0 0 ${rowWidth} ${rowHeight}`}>
              {FILA_SUP.map((d, i) => (
                <ToothSVG key={d} diente={d} x={stepX(i)} apiceArriba marks={marks} onZone={(c) => aplicar(d, c)} readOnly={readOnly} />
              ))}
              {conectores(FILA_SUP, true)}
            </svg>
          </div>
          <div>
            <svg width={rowWidth} height={rowHeight} viewBox={`0 0 ${rowWidth} ${rowHeight}`}>
              {FILA_INF.map((d, i) => (
                <ToothSVG key={d} diente={d} x={stepX(i)} apiceArriba={false} marks={marks} onZone={(c) => aplicar(d, c)} readOnly={readOnly} />
              ))}
              {conectores(FILA_INF, false)}
            </svg>
            <p className="text-xs text-gray-400 mt-1">Inferior</p>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Referencias</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs text-gray-600">
          {PRESTACIONES.map((p) => (
            <span key={p.id} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: COLORS[p.color] }} />
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
