'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Wrench,
  Menu,
  X,
  ShoppingBag,
  MessageSquare,
  Package,
  LayoutDashboard,
  User,
  LogOut,
  Car,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import Avatar from '../ui/Avatar'
import ThemeToggle from '../ui/ThemeToggle'

interface NavbarProps {
  profile: Profile | null
}

const navLinks = [
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { href: '/repairers', label: 'Find Repairers', icon: Wrench },
  { href: '/cars', label: 'Cars', icon: Car },
]

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <Link href="/" className="navbar__brand">
          <Wrench size={22} className="navbar__logo-icon" />
          <span>ShopMeco</span>
        </Link>

        <div className="navbar__links">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`navbar__link${pathname.startsWith(href) ? ' navbar__link--active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="navbar__actions">
          <ThemeToggle />
          {profile ? (
            <>
              <Link href="/dashboard" className="navbar__action">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
              <Link href="/chat" className="navbar__action">
                <MessageSquare size={18} />
              </Link>
              <div className="navbar__user">
                <Avatar
                  src={profile.avatar_url}
                  name={profile.full_name}
                  size="sm"
                />
                <div className="navbar__dropdown">
                  <Link href="/profile" className="navbar__dropdown-item">
                    <User size={14} /> Profile
                  </Link>
                  <Link href="/orders" className="navbar__dropdown-item">
                    <Package size={14} /> Orders
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="navbar__dropdown-item navbar__dropdown-item--danger"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn--ghost btn--sm">
                Log in
              </Link>
              <Link href="/register" className="btn btn--primary btn--sm">
                Get Started
              </Link>
            </>
          )}

          <button
            className="navbar__hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="navbar__mobile">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="navbar__mobile-link"
              onClick={() => setMenuOpen(false)}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
          {profile ? (
            <>
              <Link
                href="/dashboard"
                className="navbar__mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link
                href="/profile"
                className="navbar__mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                <User size={16} /> Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="navbar__mobile-link navbar__mobile-link--danger"
              >
                <LogOut size={16} /> Sign out
              </button>
            </>
          ) : (
            <div className="navbar__mobile-auth">
              <Link
                href="/login"
                className="btn btn--ghost btn--sm"
                onClick={() => setMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="btn btn--primary btn--sm"
                onClick={() => setMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
