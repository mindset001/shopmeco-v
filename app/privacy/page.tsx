import type { Metadata } from 'next'
import { getCurrentProfile } from '@/lib/utils/profile'
import Navbar from '@/components/nav/Navbar'
import Footer from '@/components/nav/Footer'
import LegalDocument from '@/components/legal/LegalDocument'

export const metadata: Metadata = {
  title: 'Privacy Policy — ShopMecko',
  description: 'How ShopMecko collects, uses, and protects your data.',
}

const LAST_UPDATED = 'September 2026'

export default async function PrivacyPage() {
  const profile = await getCurrentProfile()

  return (
    <>
      <Navbar profile={profile} />
      <LegalDocument title="Privacy Policy" lastUpdated={LAST_UPDATED}>
        <p>
          This Privacy Policy explains what personal data ShopMecko collects, how we use it, and the
          choices you have. It applies to everyone who uses ShopMecko — car owners, repairers, parts
          sellers, and field agents.
        </p>

        <h2>1. Information we collect</h2>
        <p>We collect information you provide directly, and some information automatically:</p>
        <ul>
          <li><strong>Account information:</strong> name, email, phone number, password, and your selected role</li>
          <li><strong>Profile information:</strong> avatar, bio, address, city, state, and (if you share it) your location coordinates, used to match you with nearby repairers or customers</li>
          <li><strong>Vehicle information:</strong> make, model, year, mileage, photos, and service history for cars you add to your garage</li>
          <li><strong>Booking and order information:</strong> service requests, symptoms described, delivery addresses, and messages exchanged with other users</li>
          <li><strong>Verification documents:</strong> if you apply for a &quot;verified&quot; badge as a repairer or parts seller, identity or business documents you submit</li>
          <li><strong>Payment information:</strong> ShopMecko does not store your card details — payments are processed by Paystack, and we retain only transaction references, amounts, and status</li>
          <li><strong>Device and usage information:</strong> basic technical data (like browser/device type) and, if you enable them, push notification subscriptions</li>
        </ul>

        <h2>2. How we use your information</h2>
        <ul>
          <li>To operate the marketplace — matching you with repairers or customers, processing bookings and orders</li>
          <li>To process payments, hold funds in escrow, and pay out provider wallets</li>
          <li>To verify provider identity/business details when you request a verified badge</li>
          <li>To send booking, order, payment, and message notifications</li>
          <li>To investigate disputes, reports, and suspected fraud or policy violations</li>
          <li>To improve and secure the platform</li>
        </ul>

        <h2>3. Who we share information with</h2>
        <p>We share information only where necessary to operate ShopMecko:</p>
        <ul>
          <li><strong>Other users, as needed for a transaction</strong> — for example, a repairer you book sees your name, contact details, and the vehicle/service information relevant to that booking; a seller you order from sees your delivery address</li>
          <li><strong>Paystack</strong>, to process payments</li>
          <li><strong>Supabase</strong>, our database and file storage provider, which hosts the data described above</li>
          <li><strong>Our admin team</strong>, for account verification, dispute resolution, and platform safety</li>
          <li><strong>Law enforcement or regulators</strong>, where required by law</li>
        </ul>
        <p>We do not sell your personal data.</p>

        <h2>4. Data retention</h2>
        <p>
          We keep your information for as long as your account is active, and for a reasonable period
          afterward to meet legal, tax, and dispute-resolution obligations (for example, transaction
          records related to escrow payments).
        </p>

        <h2>5. Your rights</h2>
        <p>
          Under the Nigeria Data Protection Act, you have the right to access the personal data we hold
          about you, request correction of inaccurate data, request deletion of your account and
          associated data (subject to our legal retention obligations), and object to certain uses of
          your data. To exercise any of these rights, contact us using the details below.
        </p>

        <h2>6. Security</h2>
        <p>
          We use industry-standard measures — including access controls and encryption in transit — to
          protect your data. No system is completely secure, and we can&apos;t guarantee absolute
          security.
        </p>

        <h2>7. Cookies and local storage</h2>
        <p>
          We use your browser&apos;s local storage to keep you signed in and to remember preferences
          like your light/dark theme. We don&apos;t use third-party advertising trackers.
        </p>

        <h2>8. Children&apos;s privacy</h2>
        <p>ShopMecko is not intended for anyone under 18, and we don&apos;t knowingly collect data from children.</p>

        <h2>9. Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We&apos;ll update the &quot;last
          updated&quot; date above when we do.
        </p>

        <h2>10. Contact us</h2>
        <p>
          For privacy questions or to exercise your data rights, contact us at{' '}
          <a href="mailto:shopmecko01@gmail.com">shopmecko01@gmail.com</a> or{' '}
          <a href="tel:+2348160071243">+234 816 007 1243</a>.
        </p>
      </LegalDocument>
      <Footer />
    </>
  )
}
