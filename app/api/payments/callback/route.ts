import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidPaystackMetadata, parsePaystackMetadata, verifyPaystackTransaction } from '@/lib/paystack'
import { holdEscrowPayment } from '@/lib/payments/escrow'
import { activatePlatformPurchase } from '@/lib/payments/platform-purchase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const reference = searchParams.get('reference') || searchParams.get('trxref')

  if (!reference) {
    return NextResponse.redirect(new URL('/dashboard?payment=failed', req.url))
  }

  try {
    const transaction = await verifyPaystackTransaction(reference)
    const metadata = parsePaystackMetadata(transaction.metadata)

    if (transaction.status !== 'success' || !isValidPaystackMetadata(metadata)) {
      return NextResponse.redirect(new URL('/dashboard?payment=failed', req.url))
    }

    if (Math.round(Number(metadata.amount) * 100) !== Number(transaction.amount)) {
      return NextResponse.redirect(new URL('/dashboard?payment=failed', req.url))
    }

    const supabase = createAdminClient()
    if (metadata.type === 'featured_listing' || metadata.type === 'subscription') {
      await activatePlatformPurchase({ reference, metadata, supabase })
    } else {
      await holdEscrowPayment({ reference, metadata, supabase })
    }

    const redirectPath =
      metadata.type === 'booking'
        ? '/bookings'
        : metadata.type === 'featured_listing'
          ? '/dashboard/listings'
          : metadata.type === 'subscription'
            ? '/dashboard/subscription'
            : '/orders'
    return NextResponse.redirect(new URL(`${redirectPath}?payment=success`, req.url))
  } catch {
    return NextResponse.redirect(new URL('/dashboard?payment=failed', req.url))
  }
}
