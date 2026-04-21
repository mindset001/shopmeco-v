import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/utils/profile'
import Navbar from '@/components/nav/Navbar'
import Sidebar from '@/components/nav/Sidebar'
import NotificationPermissionRequest from '@/components/NotificationPermissionRequest'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  return (
    <>
      <NotificationPermissionRequest />
      <Navbar profile={profile} />
      <div className="dashboard-layout">
        <Sidebar role={profile.role} />
        <main className="dashboard-main">{children}</main>
      </div>
    </>
  )
}
