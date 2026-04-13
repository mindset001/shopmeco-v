import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/utils/profile'

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type, id } = body as { type: 'booking' | 'order'; id: string }

  if (!type || !id) {
    return NextResponse.json({ error: 'Missing type or id' }, { status: 400 })
  }

  const supabase = await createClient()
  let amount = 0
  let payeeId = ''
  let description = ''

  if (type === 'booking') {
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, agreed_price, payment_status, repairer_id, customer_id')
      .eq('id', id)
      .single()

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.customer_id !== profile.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!booking.agreed_price)
      return NextResponse.json({ error: 'No agreed price set for this booking' }, { status: 400 })
    if (booking.payment_status !== 'unpaid')
      return NextResponse.json({ error: 'Already paid' }, { status: 400 })

    amount = Number(booking.agreed_price)
    payeeId = booking.repairer_id
    description = `Booking #${id.slice(0, 8)}`
  } else if (type === 'order') {
    const { data: order } = await supabase
      .from('orders')
      .select('id, total_price, payment_status, seller_id, buyer_id')
      .eq('id', id)
      .single()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.buyer_id !== profile.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (order.payment_status !== 'unpaid')
      return NextResponse.json({ error: 'Already paid' }, { status: 400 })

    amount = Number(order.total_price)
    payeeId = order.seller_id
    description = `Order #${id.slice(0, 8)}`
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  // Call Paystack Initialize Transaction
  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: profile.id + '@shopmecko.internal', // Paystack requires email; use profile email from supabase if available
      amount: Math.round(amount * 100), // kobo
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback`,
      metadata: {
        type,
        related_id: id,
        payer_id: profile.id,
        payee_id: payeeId,
        amount,
        description,
      },
    }),
  })

  const paystackData = await paystackRes.json()

  if (!paystackData.status) {
    return NextResponse.json({ error: paystackData.message ?? 'Paystack error' }, { status: 500 })
  }

  return NextResponse.json({ authorization_url: paystackData.data.authorization_url })
}
