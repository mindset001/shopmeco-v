import { redirect, notFound } from 'next/navigation'
import { getCurrentProfile } from '@/lib/utils/profile'
import { createClient } from '@/lib/supabase/server'
import EditCarForm from './EditCarForm'
import type { Car } from '@/types'

export default async function EditCarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()
  const { data: car } = await supabase.from('cars').select('*').eq('id', id).eq('owner_id', profile.id).single()

  if (!car) notFound()

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Edit Car</h1>
        <p className="page-subtitle">{car.year} {car.make} {car.model}</p>
      </div>
      <EditCarForm car={car as Car} />
    </div>
  )
}
