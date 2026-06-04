import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { AppointmentStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt, { locale: es })
}

export function formatDateTime(date: string | Date) {
  return formatDate(date, "dd/MM/yyyy 'a las' HH:mm")
}

export function formatTime(date: string | Date) {
  return formatDate(date, 'HH:mm')
}

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  EN_CURSO: 'En curso',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
  AUSENTE: 'Ausente (sin aviso)',
  ASISTIO: 'Asistió',
  LLEGO_TARDE: 'Llegó tarde',
  AUSENTE_CON_AVISO: 'Ausente (avisó)',
}

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMADO: 'bg-green-100 text-green-800 border-green-200',
  EN_CURSO: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETADO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELADO: 'bg-red-100 text-red-800 border-red-200',
  AUSENTE: 'bg-gray-200 text-gray-700 border-gray-300',
  ASISTIO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  LLEGO_TARDE: 'bg-orange-100 text-orange-800 border-orange-200',
  AUSENTE_CON_AVISO: 'bg-gray-100 text-gray-600 border-gray-200',
}

export const INSURANCE_LABELS: Record<string, string> = {
  IOMA: 'IOMA', PAMI: 'PAMI', OSDE: 'OSDE',
  SWISS_MEDICAL: 'Swiss Medical', GALENO: 'Galeno',
  OSPEDYC: 'OSPEDYC', IOSFA: 'IOSFA', MEDICUS: 'Medicus',
  SANCOR: 'Sancor Salud', OMINT: 'Omint', ACCORD: 'Accord Salud',
  DASPU: 'DASPU', UNION_PERSONAL: 'Unión Personal',
  JERARCAS: 'Jerarcas', OSECAC: 'OSECAC', PARTICULAR: 'Particular',
}

export function validateCuil(cuil: string): boolean {
  const clean = cuil.replace(/[-\s]/g, '')
  if (!/^\d{11}$/.test(clean)) return false
  const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const sum = mult.reduce((acc, m, i) => acc + m * parseInt(clean[i]), 0)
  const rem = sum % 11
  const check = rem === 0 ? 0 : rem === 1 ? 9 : 11 - rem
  return check === parseInt(clean[10])
}
