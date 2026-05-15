'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useCreatePatient } from '@/hooks/useData'
import { INSURANCE_LABELS, validateCuil } from '@/lib/utils'

const INSURANCE_OPTIONS = Object.entries(INSURANCE_LABELS)

export default function NuevoPacientePage() {
  const router = useRouter()
  const create = useCreatePatient()
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()
  const obraSocial = watch('obraSocial')

  const onSubmit = async (data: any) => {
    try {
      await create.mutateAsync({
        ...data,
        dni: data.dni || undefined,
        cuil: data.cuil || undefined,
        telefonoWhatsapp: data.telefonoWhatsapp || undefined,
        email: data.email || undefined,
        obraSocial: data.obraSocial || undefined,
        fechaNacimiento: data.fechaNacimiento || undefined,
        alergias: data.alergias ? data.alergias.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
      })
      toast.success('Paciente creado exitosamente')
      router.push('/dashboard/pacientes')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al crear el paciente')
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/pacientes"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Nuevo paciente</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input {...register('nombre', { required: true })} className={inputCls} placeholder="María" />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">Requerido</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
            <input {...register('apellido', { required: true })} className={inputCls} placeholder="González" />
            {errors.apellido && <p className="text-red-500 text-xs mt-1">Requerido</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
            <input {...register('dni', { pattern: /^\d{7,8}$/ })} className={inputCls} placeholder="35123456" maxLength={8} />
            {errors.dni && <p className="text-red-500 text-xs mt-1">7-8 dígitos</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input {...register('telefonoWhatsapp')} className={inputCls} placeholder="+54 9 11 1234-5678" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input {...register('email')} type="email" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
            <input {...register('fechaNacimiento')} type="date" className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Obra Social</label>
          <select {...register('obraSocial')} className={inputCls}>
            <option value="">Particular / Sin obra social</option>
            {INSURANCE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {obraSocial && obraSocial !== 'PARTICULAR' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nro de afiliado</label>
              <input {...register('nroAfiliado')} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <input {...register('planObraSocial')} className={inputCls} placeholder="310" />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alergias <span className="text-gray-400 font-normal">(separadas por coma)</span>
          </label>
          <input {...register('alergias')} className={inputCls} placeholder="Penicilina, Ibuprofeno" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas médicas</label>
          <textarea {...register('notasMedicas')} rows={3} className={`${inputCls} resize-none`} />
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/dashboard/pacientes"
            className="flex-1 py-2.5 text-center border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            Cancelar
          </Link>
          <button type="submit" disabled={isSubmitting || create.isPending}
            className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors">
            {create.isPending ? 'Guardando...' : 'Crear paciente'}
          </button>
        </div>
      </form>
    </div>
  )
}
