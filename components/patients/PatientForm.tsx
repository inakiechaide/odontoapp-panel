'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { validateCuil, INSURANCE_LABELS } from '@/lib/utils'
import type { Patient, InsuranceName } from '@/types'

const INSURANCE_OPTIONS = Object.entries(INSURANCE_LABELS) as [InsuranceName, string][]

const patientSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  apellido: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  dni: z.string()
    .regex(/^\d{7,8}$/, 'DNI: 7 u 8 dígitos sin puntos')
    .optional().or(z.literal('')),
  cuil: z.string()
    .refine((v) => !v || validateCuil(v), 'CUIL inválido (dígito verificador incorrecto)')
    .optional().or(z.literal('')),
  telefonoWhatsapp: z.string()
    .regex(/^\+54\s?9?\s?\d{2,4}\s?\d{4}-?\d{4}$|^\+549\d{10}$/, 'Formato: +54 9 11 XXXX-XXXX')
    .optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  fechaNacimiento: z.string().optional(),
  localidad: z.string().optional(),
  provincia: z.string().optional(),
  obraSocial: z.string().optional(),
  nroAfiliado: z.string().optional(),
  planObraSocial: z.string().optional(),
  alergias: z.string().optional(), // comma-separated
  medicacionActual: z.string().optional(),
  notasMedicas: z.string().optional(),
})

type PatientFormData = z.infer<typeof patientSchema>

interface PatientFormProps {
  defaultValues?: Partial<Patient>
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  isLoading?: boolean
}

export function PatientForm({ defaultValues, onSubmit, isLoading }: PatientFormProps) {
  const [alergiaInput, setAlergiaInput] = useState('')
  const [alergias, setAlergias] = useState<string[]>(defaultValues?.alergias ?? [])

  const {
    register, handleSubmit, watch,
    formState: { errors }
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      nombre: defaultValues?.nombre ?? '',
      apellido: defaultValues?.apellido ?? '',
      dni: defaultValues?.dni ?? '',
      cuil: defaultValues?.cuil ?? '',
      telefonoWhatsapp: defaultValues?.telefonoWhatsapp ?? '',
      email: defaultValues?.email ?? '',
      fechaNacimiento: defaultValues?.fechaNacimiento?.split('T')[0] ?? '',
      localidad: defaultValues?.localidad ?? '',
      provincia: defaultValues?.provincia ?? 'Buenos Aires',
      obraSocial: defaultValues?.obraSocial ?? '',
      nroAfiliado: defaultValues?.nroAfiliado ?? '',
      planObraSocial: defaultValues?.planObraSocial ?? '',
      notasMedicas: defaultValues?.notasMedicas ?? '',
    },
  })

  const obraSocialValue = watch('obraSocial')

  const handleFormSubmit = async (data: PatientFormData) => {
    await onSubmit(({
      ...data,
      dni: data.dni || undefined,
      cuil: data.cuil || undefined,
      telefonoWhatsapp: data.telefonoWhatsapp || undefined,
      email: data.email || undefined,
      obraSocial: (data.obraSocial as InsuranceName | undefined) || undefined,
      alergias,
      fechaNacimiento: data.fechaNacimiento || undefined,
    }) as Partial<Patient>)
  }

  const addAlergia = () => {
    if (alergiaInput.trim() && !alergias.includes(alergiaInput.trim())) {
      setAlergias([...alergias, alergiaInput.trim()])
      setAlergiaInput('')
    }
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
  const errorClass = 'text-red-500 text-xs mt-1'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">

      {/* Nombre y Apellido */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nombre *</label>
          <input {...register('nombre')} className={inputClass} placeholder="María" />
          {errors.nombre && <p className={errorClass}>{errors.nombre.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Apellido *</label>
          <input {...register('apellido')} className={inputClass} placeholder="González" />
          {errors.apellido && <p className={errorClass}>{errors.apellido.message}</p>}
        </div>
      </div>

      {/* DNI y CUIL */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>DNI</label>
          <input {...register('dni')} className={inputClass} placeholder="35123456" maxLength={8} />
          {errors.dni && <p className={errorClass}>{errors.dni.message}</p>}
        </div>
        <div>
          <label className={labelClass}>CUIL</label>
          <input {...register('cuil')} className={inputClass} placeholder="20-35123456-7" />
          {errors.cuil && <p className={errorClass}>{errors.cuil.message}</p>}
        </div>
      </div>

      {/* WhatsApp y Email */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>WhatsApp</label>
          <input {...register('telefonoWhatsapp')} className={inputClass}
            placeholder="+54 9 11 1234-5678" />
          {errors.telefonoWhatsapp && <p className={errorClass}>{errors.telefonoWhatsapp.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input {...register('email')} type="email" className={inputClass}
            placeholder="maria@gmail.com" />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>
      </div>

      {/* Fecha de nacimiento y localidad */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Fecha de nacimiento</label>
          <input {...register('fechaNacimiento')} type="date" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Localidad</label>
          <input {...register('localidad')} className={inputClass} placeholder="San Isidro" />
        </div>
      </div>

      {/* Obra Social */}
      <div>
        <label className={labelClass}>Obra Social</label>
        <select {...register('obraSocial')} className={inputClass}>
          <option value="">Sin obra social / Particular</option>
          {INSURANCE_OPTIONS.map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Nro Afiliado (solo si tiene obra social) */}
      {obraSocialValue && obraSocialValue !== 'PARTICULAR' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nro de afiliado</label>
            <input {...register('nroAfiliado')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Plan</label>
            <input {...register('planObraSocial')} className={inputClass} placeholder="310" />
          </div>
        </div>
      )}

      {/* Alergias */}
      <div>
        <label className={labelClass}>Alergias</label>
        <div className="flex gap-2 mb-2">
          <input
            value={alergiaInput}
            onChange={(e) => setAlergiaInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAlergia())}
            className={inputClass}
            placeholder="Ej: Penicilina"
          />
          <button type="button" onClick={addAlergia}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
            +
          </button>
        </div>
        {alergias.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {alergias.map((a) => (
              <span key={a} className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                {a}
                <button type="button" onClick={() => setAlergias(alergias.filter((x) => x !== a))}
                  className="ml-0.5 hover:text-red-600">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Notas médicas */}
      <div>
        <label className={labelClass}>Notas médicas</label>
        <textarea {...register('notasMedicas')} rows={3}
          className={`${inputClass} resize-none`}
          placeholder="Observaciones clínicas relevantes..." />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
      >
        {isLoading ? 'Guardando...' : defaultValues ? 'Actualizar paciente' : 'Crear paciente'}
      </button>
    </form>
  )
}
