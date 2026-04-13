import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-paystack-signature')

  // Verify HMAC-SHA512 signature
  const expectedSignature = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest('hex')

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)

  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true })
  }

  const { reference, metadata } = event.data as {
    reference: string
    metadata: {
      type: 'booking' | 'order'
      related_id: string
      payer_id: string
      payee_id: string
      amount: number
    }
  }

  if (!metadata?.related_id) {
    return NextResponse.json({ received: true })
  }

  const supabase = createAdminClient()

  // Idempotency: skip if already processed
  const { data: existing } = await supabase
    .from('escrow_payments')
    .select('id')
    .eq('paystack_ref', reference)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ received: true })
  }

  const { type, related_id, payer_id, payee_id, amount } = metadata

  await supabase.from('escrow_payments').insert({
    payer_id,
    payee_id,
    amount,
    paystack_ref: reference,
    status: 'held',
    related_type: type,
    related_id,
  })

  await supabase.from('wallet_transactions').insert({
    user_id: payer_id,
    type: 'escrow_hold',
    amount,
    description: `Payment held in escrow for ${type} #${related_id.slice(0, 8)}`,
    related_type: type,
    related_id,
  })

  if (type === 'booking') {
    await supabase.from('bookings').update({ payment_status: 'in_escrow' }).eq('id', related_id)
  } else {
    await supabase.from('orders').update({ payment_status: 'in_escrow' }).eq('id', related_id)
  }

  return NextResponse.json({ received: true })
}
