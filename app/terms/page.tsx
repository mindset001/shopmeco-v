import type { Metadata } from 'next'
import { getCurrentProfile } from '@/lib/utils/profile'
import Navbar from '@/components/nav/Navbar'
import Footer from '@/components/nav/Footer'
import LegalDocument from '@/components/legal/LegalDocument'

export const metadata: Metadata = {
  title: 'Terms of Service — ShopMecko',
  description: 'The terms that govern your use of ShopMecko.',
}

const LAST_UPDATED = 'September 2026'

export default async function TermsPage() {
  const profile = await getCurrentProfile()

  return (
    <>
      <Navbar profile={profile} />
      <LegalDocument title="Terms of Service" lastUpdated={LAST_UPDATED}>
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of ShopMecko
          (&quot;ShopMecko&quot;, &quot;we&quot;, &quot;us&quot;), a marketplace connecting car owners with
          repairers and parts sellers in Nigeria. By creating an account or using ShopMecko, you agree
          to these Terms.
        </p>

        <h2>1. Who can use ShopMecko</h2>
        <p>
          You must be at least 18 years old and able to form a binding contract to create an account.
          You&apos;re responsible for the accuracy of the information you provide and for keeping your
          login credentials secure. One account per person; accounts are not transferable.
        </p>

        <h2>2. Account roles</h2>
        <p>
          ShopMecko supports several account types: car owners (who book services and buy parts),
          repairers (who offer repair services), parts sellers (who list parts for sale), and field
          agents (who help onboard businesses on our behalf). Each role has its own responsibilities
          described elsewhere in these Terms and in the relevant parts of the app.
        </p>

        <h2>3. ShopMecko is a marketplace, not a party to your transaction</h2>
        <p>
          ShopMecko connects car owners with independent repairers and parts sellers. We are not a
          party to the repair service or sale of goods itself, and we don&apos;t guarantee the quality,
          safety, legality, or fitness of any listed part, or the competence of any repairer. You are
          responsible for evaluating who you transact with. We may verify certain provider information
          (see &quot;Verification&quot; below), but verification is not a guarantee of quality or an
          endorsement.
        </p>

        <h2>4. Listings and bookings</h2>
        <p>
          Parts sellers and repairers are responsible for the accuracy of their listings — pricing,
          condition, availability, specializations, and service areas. Car owners are responsible for
          providing accurate booking details (vehicle, symptoms, delivery address). We may remove
          listings or suspend accounts that violate these Terms, misrepresent goods or services, or
          are reported as fraudulent.
        </p>

        <h2>5. Payments and escrow</h2>
        <p>
          Payments on ShopMecko are processed through Paystack. When you pay for a booking or order,
          funds are held in escrow by ShopMecko rather than paid directly to the repairer or seller.
          Escrowed funds are released to the provider&apos;s ShopMecko wallet once the transaction is
          confirmed complete, minus ShopMecko&apos;s platform commission and (for marketplace orders) the
          delivery fee. Commission rates, delivery fees, featured-listing fees, and provider
          subscription fees are set by ShopMecko and may change; the current rates are shown at the
          point of payment.
        </p>
        <p>
          Wallet balances can be withdrawn by submitting a withdrawal request, which is reviewed and
          approved manually. We may hold, delay, or reverse a payment or withdrawal where we reasonably
          suspect fraud, a policy violation, or a legal obligation to do so.
        </p>

        <h2>6. Provider subscriptions and featured listings</h2>
        <p>
          Repairers and parts sellers may need an active subscription to receive new bookings and
          orders through ShopMecko, and may optionally pay to feature a listing more prominently in
          search results. These are separate, non-refundable fees unless required otherwise by law.
        </p>

        <h2>7. Verification</h2>
        <p>
          We may ask repairers and parts sellers to submit identity or business verification documents
          to display a &quot;verified&quot; badge. Submitting documents does not guarantee verification,
          and we may request additional information or decline to verify an account at our discretion.
        </p>

        <h2>8. Prohibited conduct</h2>
        <p>You agree not to:</p>
        <ul>
          <li>List counterfeit, stolen, or misrepresented parts or services</li>
          <li>Attempt to complete a transaction outside ShopMecko&apos;s payment system to avoid fees or escrow protection</li>
          <li>Submit false reviews, ratings, or verification documents</li>
          <li>Harass, threaten, or discriminate against another user</li>
          <li>Use the platform for any unlawful purpose</li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate these Terms, and may report unlawful
          conduct to the relevant authorities.
        </p>

        <h2>9. Disputes</h2>
        <p>
          If a booking or order goes wrong, you can raise a dispute through the app. ShopMecko&apos;s
          admin team reviews disputes and may hold escrowed funds, request evidence from both parties,
          and make a final decision on release or refund. This process is offered as a convenience and
          does not replace your legal rights.
        </p>

        <h2>10. Your content</h2>
        <p>
          You retain ownership of the photos, descriptions, and messages you upload, and you grant
          ShopMecko a license to display and use that content to operate the platform (for example,
          showing your listing photos in search results). You&apos;re responsible for having the rights
          to anything you upload.
        </p>

        <h2>11. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, ShopMecko is not liable for indirect, incidental, or
          consequential damages arising from your use of the platform, or for the acts or omissions of
          other users (including the quality of a repair or a part you purchase). Our aggregate
          liability for any claim is limited to the fees you paid ShopMecko in the 3 months before the
          claim arose.
        </p>

        <h2>12. Termination</h2>
        <p>
          You may stop using ShopMecko at any time. We may suspend or terminate your account for
          violating these Terms, at our discretion, with or without notice where warranted (for
          example, suspected fraud).
        </p>

        <h2>13. Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. Continued use of ShopMecko after a change takes
          effect means you accept the updated Terms.
        </p>

        <h2>14. Governing law</h2>
        <p>These Terms are governed by the laws of the Federal Republic of Nigeria.</p>

        <h2>15. Contact</h2>
        <p>
          Questions about these Terms? Reach us at{' '}
          <a href="mailto:shopmecko01@gmail.com">shopmecko01@gmail.com</a> or{' '}
          <a href="tel:+2348160071243">+234 816 007 1243</a>.
        </p>
      </LegalDocument>
      <Footer />
    </>
  )
}
