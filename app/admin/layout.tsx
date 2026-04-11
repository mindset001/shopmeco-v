import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/utils/profile'
import Navbar from '@/components/nav/Navbar'
import Sidebar from '@/components/nav/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  return (
    <>
      <Navbar profile={profile} />
      <div className="dashboard-layout">
        <Sidebar role="admin" />
        <main className="dashboard-main">{children}</main>
      </div>
    </>
  )
}
