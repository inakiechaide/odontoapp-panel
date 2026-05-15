'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { PatientForm } from '@/components/patients/PatientForm'
import { useCreatePatient } from '@/hooks/useData'

export default function NuevoPacientePage() {
  const router = useRouter()
  const create = useCreatePatient()

  const handleSubmit = async (data: Record<string, unknown>) => {
    await create.mutateAsync(data as any)
    toast.success('Paciente creado exitosamente')
    router.push('/dashboard/pacientes')
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/pacientes"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Nuevo paciente</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <PatientForm
          onSubmit={handleSubmit}
          isLoading={create.isPending}
        />
      </div>
    </div>
  )
}
