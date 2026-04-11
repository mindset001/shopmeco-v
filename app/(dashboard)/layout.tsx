import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/utils/profile'
import Navbar from '@/components/nav/Navbar'
import Sidebar from '@/components/nav/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  return (
    <>
      <Navbar profile={profile} />
      <div className="dashboard-layout">
        <Sidebar role={profile.role} />
        <main className="dashboard-main">{children}</main>
      </div>
    </>
  )
}
