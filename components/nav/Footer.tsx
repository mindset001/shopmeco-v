import Link from 'next/link'
import { Wrench, Mail, Phone } from 'lucide-react'

const CONTACT_EMAIL = 'shopmecko01@gmail.com'
const CONTACT_PHONE = '+2348160071243'

// Add real social URLs here once available, e.g. { label: 'Instagram', href: 'https://instagram.com/shopmecko', icon: Instagram }
const socialLinks: { label: string; href: string; icon: React.ElementType }[] = []

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--color-border)', marginTop: 'var(--space-12)' }}>
      <div className="container" style={{ padding: 'var(--space-8) var(--space-4)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
            <Wrench size={18} />
            <span>ShopMecko</span>
          </div>
          <p style={{ color: 'var(--color-text-300)', fontSize: '0.85rem', maxWidth: 320 }}>
            Connecting car owners with verified mechanics and spare parts sellers across Nigeria.
          </p>
        </div>

        <div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 'var(--space-3)' }}>Contact</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <Link href="/contact" style={{ color: 'var(--color-text-300)', fontSize: '0.85rem', textDecoration: 'none' }}>
              Contact Us
            </Link>
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-300)', fontSize: '0.85rem', textDecoration: 'none' }}>
              <Mail size={14} /> {CONTACT_EMAIL}
            </a>
            <a href={`tel:${CONTACT_PHONE}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-300)', fontSize: '0.85rem', textDecoration: 'none' }}>
              <Phone size={14} /> {CONTACT_PHONE}
            </a>
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 'var(--space-3)' }}>Legal</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <Link href="/terms" style={{ color: 'var(--color-text-300)', fontSize: '0.85rem', textDecoration: 'none' }}>
              Terms of Service
            </Link>
            <Link href="/privacy" style={{ color: 'var(--color-text-300)', fontSize: '0.85rem', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
          </div>
        </div>

        {socialLinks.length > 0 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 'var(--space-3)' }}>Follow us</div>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} style={{ color: 'var(--color-text-300)' }}>
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--space-4)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-400)' }}>
        © {new Date().getFullYear()} ShopMecko. All rights reserved.
      </div>
    </footer>
  )
}
