// ── Enums (espejo del backend) ────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'DENTIST' | 'RECEPTIONIST' | 'ASSISTANT'
export type AppointmentStatus = 'PENDIENTE' | 'CONFIRMADO' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO' | 'AUSENTE'
export type ConversationStatus = 'BOT' | 'HUMANO' | 'CERRADO' | 'SPAM'
export type TreatmentStatus = 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO' | 'PAUSADO'
export type MovementType = 'ENTRADA' | 'SALIDA' | 'CONSUMO' | 'AJUSTE' | 'VENCIMIENTO'

export type InsuranceName =
  | 'IOMA' | 'PAMI' | 'OSDE' | 'SWISS_MEDICAL' | 'GALENO'
  | 'OSPEDYC' | 'IOSFA' | 'MEDICUS' | 'SANCOR' | 'OMINT'
  | 'ACCORD' | 'DASPU' | 'UNION_PERSONAL' | 'JERARCAS' | 'OSECAC' | 'PARTICULAR'

// ── Modelos ───────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  nombre: string
  apellido: string
  role: UserRole
  phone?: string
  avatarUrl?: string
  active: boolean
  createdAt: string
}

export interface DentistProfile {
  id: string
  userId: string
  matricula?: string
  especialidad?: string
  colorAgenda: string
  user: Pick<User, 'nombre' | 'apellido' | 'avatarUrl'>
}

export interface Patient {
  id: string
  nombre: string
  apellido: string
  dni?: string
  cuil?: string
  fechaNacimiento?: string
  telefonoWhatsapp?: string
  email?: string
  direccion?: string
  localidad?: string
  provincia?: string
  obraSocial?: InsuranceName
  nroAfiliado?: string
  planObraSocial?: string
  alergias: string[]
  medicacionActual: string[]
  notasMedicas?: string
  fotoUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Appointment {
  id: string
  patientId: string
  dentistId: string
  fechaHora: string
  duracionMin: number
  fechaHoraFin?: string
  status: AppointmentStatus
  tipoTratamiento?: string
  motivoConsulta?: string
  notasInternas?: string
  precioParticular?: number
  precioObraSocial?: number
  confirmadoPorPaciente: boolean
  confirmadoAt?: string
  canceladoMotivo?: string
  createdAt: string
  updatedAt: string
  patient: Pick<Patient, 'nombre' | 'apellido' | 'telefonoWhatsapp'>
  dentist: { user: Pick<User, 'nombre' | 'apellido' | 'avatarUrl'>; colorAgenda: string }
}

export interface TimeSlot {
  start: string
  end: string
  disponible: boolean
}

export interface DayAgenda {
  fecha: string
  dentistId: string
  dentistNombre: string
  colorAgenda: string
  esFeriado: boolean
  nombreFeriado?: string
  esDiaLaboral: boolean
  slots: TimeSlot[]
  turnosExistentes: {
    id: string
    start: string
    end: string
    patientNombre: string
    status: AppointmentStatus
  }[]
}

export interface Message {
  id: string
  conversationId: string
  remitente: 'BOT' | 'PACIENTE' | 'HUMANO'
  tipo: 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT'
  contenido?: string
  urlAdjunto?: string
  leido: boolean
  createdAt: string
}

export interface Conversation {
  id: string
  patientId?: string
  telefonoWhatsapp: string
  status: ConversationStatus
  ultimoMensajeAt?: string
  tomadoPor?: string
  createdAt: string
  patient?: Pick<Patient, 'nombre' | 'apellido' | 'fotoUrl'>
  takenByUser?: Pick<User, 'nombre' | 'apellido'>
  messages?: Message[]
  _count?: { messages: number }
}

export interface InventoryItem {
  id: string
  nombre: string
  categoria?: string
  unidadMedida: string
  stockActual: number
  stockMinimo: number
  stockMaximo?: number
  precioUnitarioArs?: number
  proveedor?: string
  fechaVencimiento?: string
  alertasActivas: boolean
}

export interface Treatment {
  id: string
  nombre: string
  codigoNomenclador?: string
  precioArs?: number
  duracionMin?: number
  activo: boolean
}

export interface InsuranceCoverage {
  id: string
  obraSocial: InsuranceName
  porcentajeCobertura: number
  requiereAutorizacion: boolean
  codigoPrestacion?: string
  treatment: Pick<Treatment, 'nombre'>
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}
