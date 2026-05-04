'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  ShoppingBag,
  MessageSquare,
  Package,
  User,
  Wrench,
  Star,
  Users,
  Settings,
  BarChart2,
  Car,
  LogOut,
  CalendarCheck,
  Wallet,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'

import type { UserRole } from '@/types'

const navByRole: Record<
  UserRole,
  { href: string; label: string; icon: React.ElementType }[]
> = {
  car_owner: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/cars', label: 'My Cars', icon: Car },
    { href: '/repairers', label: 'Find Repairers', icon: Wrench },
    { href: '/bookings', label: 'My Bookings', icon: CalendarCheck },
    { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
    { href: '/orders', label: 'My Orders', icon: Package },
    { href: '/chat', label: 'Messages', icon: MessageSquare },
    { href: '/profile', label: 'Profile', icon: User },
  ],
  repairer: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/bookings', label: 'Bookings', icon: CalendarCheck },
    { href: '/orders', label: 'Service Requests', icon: Package },
    { href: '/chat', label: 'Messages', icon: MessageSquare },
    { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
    { href: '/wallet', label: 'Wallet', icon: Wallet },
    { href: '/dashboard/verification', label: 'Verification', icon: Star },
    { href: '/profile', label: 'Profile & Reviews', icon: Star },
  ],
  parts_seller: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/listings', label: 'My Listings', icon: ShoppingBag },
    { href: '/orders', label: 'Orders', icon: Package },
    { href: '/chat', label: 'Messages', icon: MessageSquare },
    { href: '/wallet', label: 'Wallet', icon: Wallet },
    { href: '/dashboard/verification', label: 'Verification', icon: Star },
    { href: '/profile', label: 'Profile', icon: User },
  ],
  admin: [
    { href: '/admin', label: 'Overview', icon: BarChart2 },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/users/verifications', label: 'Verifications', icon: Star },
    { href: '/admin/products', label: 'Products', icon: ShoppingBag },
    { href: '/admin/orders', label: 'Orders', icon: Package },
    { href: '/admin/cars', label: 'Cars', icon: Car },
    { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
    { href: '/admin/payments', label: 'Escrow', icon: CreditCard },
    { href: '/admin/payments/withdrawals', label: 'Withdrawals', icon: Wallet },
    { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
    { href: '/admin/reports', label: 'Reports', icon: ShieldCheck },
    { href: '/admin/disputes', label: 'Disputes', icon: ShieldAlert },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ],
}

interface SidebarProps {
  role: UserRole
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const links = navByRole[role]
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    async function fetchUnread() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: convs } = await supabase
        .from('conversations')
        .select('id')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      if (!convs?.length) return
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', convs.map((c) => c.id))
        .eq('is_read', false)
        .neq('sender_id', user.id)
      setUnread(count ?? 0)
    }
    fetchUnread()
  }, [pathname])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/dashboard'
              ? pathname === href
              : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar__link${active ? ' sidebar__link--active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {href === '/chat' && unread > 0 && (
                <span style={{
                  marginLeft: 'auto', background: 'var(--color-accent)', color: '#fff',
                  borderRadius: 999, fontSize: '0.65rem', fontWeight: 700,
                  padding: '1px 6px', lineHeight: 1.6,
                }}>
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
      <div className="sidebar__footer">
        <button onClick={handleSignOut} className="sidebar__link sidebar__link--danger">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
