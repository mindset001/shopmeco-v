import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const reference = searchParams.get('reference') || searchParams.get('trxref')

  if (!reference) {
    return NextResponse.redirect(new URL('/dashboard?payment=failed', req.url))
  }

  // Verify with Paystack
  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })
  const verifyData = await verifyRes.json()

  if (!verifyData.status || verifyData.data?.status !== 'success') {
    return NextResponse.redirect(new URL('/dashboard?payment=failed', req.url))
  }

  const { type, related_id, payer_id, payee_id, amount } = verifyData.data.metadata as {
    type: 'booking' | 'order'
    related_id: string
    payer_id: string
    payee_id: string
    amount: number
  }

  const supabase = createAdminClient()

  // Idempotency: check if this reference already processed
  const { data: existing } = await supabase
    .from('escrow_payments')
    .select('id')
    .eq('paystack_ref', reference)
    .maybeSingle()

  if (existing) {
    // Already processed — redirect appropriately
    return NextResponse.redirect(new URL(`/${type === 'booking' ? 'bookings' : 'orders'}?payment=success`, req.url))
  }

  // Create escrow record
  await supabase.from('escrow_payments').insert({
    payer_id,
    payee_id,
    amount,
    paystack_ref: reference,
    status: 'held',
    related_type: type,
    related_id,
  })

  // Record payer's outflow transaction
  await supabase.from('wallet_transactions').insert({
    user_id: payer_id,
    type: 'escrow_hold',
    amount,
    description: `Payment held in escrow for ${type} #${related_id.slice(0, 8)}`,
    related_type: type,
    related_id,
  })

  // Update booking or order payment_status
  if (type === 'booking') {
    await supabase
      .from('bookings')
      .update({ payment_status: 'in_escrow' })
      .eq('id', related_id)
  } else {
    await supabase
      .from('orders')
      .update({ payment_status: 'in_escrow' })
      .eq('id', related_id)
  }

  const redirectPath = type === 'booking' ? '/bookings' : '/orders'
  return NextResponse.redirect(new URL(`${redirectPath}?payment=success`, req.url))
}
