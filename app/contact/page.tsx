import { Mail, Phone } from 'lucide-react'
import type { Metadata } from 'next'
import { getCurrentProfile } from '@/lib/utils/profile'
import Navbar from '@/components/nav/Navbar'
import Footer from '@/components/nav/Footer'

export const metadata: Metadata = {
  title: 'Contact Us — ShopMecko',
  description: 'Get in touch with the ShopMecko team.',
}

const CONTACT_EMAIL = 'shopmecko01@gmail.com'
const CONTACT_PHONE = '+2348160071243'

export default async function ContactPage() {
  const profile = await getCurrentProfile()

  return (
    <>
      <Navbar profile={profile} />
      <div className="container section" style={{ maxWidth: 640 }}>
        <div className="page-header">
          <h1 className="page-title">Contact Us</h1>
          <p className="page-subtitle">Have a question or need help? Reach out and we&apos;ll get back to you.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="card"
            style={{ padding: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', textDecoration: 'none' }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-full)', background: 'var(--color-surface-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Mail size={20} color="var(--color-accent)" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-300)' }}>Email</div>
              <div style={{ fontWeight: 700, color: 'var(--color-text-100)' }}>{CONTACT_EMAIL}</div>
            </div>
          </a>

          <a
            href={`tel:${CONTACT_PHONE}`}
            className="card"
            style={{ padding: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', textDecoration: 'none' }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-full)', background: 'var(--color-surface-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Phone size={20} color="var(--color-accent)" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-300)' }}>Phone</div>
              <div style={{ fontWeight: 700, color: 'var(--color-text-100)' }}>{CONTACT_PHONE}</div>
            </div>
          </a>
        </div>
      </div>
      <Footer />
    </>
  )
}
