import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/utils/profile'
import NewCarForm from './NewCarForm'

export default async function NewCarPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'car_owner') redirect('/dashboard')

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Add a Car</h1>
        <p className="page-subtitle">Register your vehicle to get better service matches</p>
      </div>
      <NewCarForm ownerId={profile.id} />
    </div>
  )
}
