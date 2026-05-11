import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAppUrl, initializePaystackTransaction } from '@/lib/paystack'
import { getCurrentProfile } from '@/lib/utils/profile'

export async function POST(req: NextRequest) {
  try {
    const profile = await getCurrentProfile()
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { type, id } = body as { type: 'booking' | 'order'; id: string }

    if (!type || !id) {
      return NextResponse.json({ error: 'Missing type or id' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
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

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 })
    }

    const payment = await initializePaystackTransaction({
      email: user?.email ?? `payments+${profile.id}@shopmecko.com`,
      amount,
      callbackUrl: `${getAppUrl(req.url)}/api/payments/callback`,
      metadata: {
        type,
        related_id: id,
        payer_id: profile.id,
        payee_id: payeeId,
        amount,
        description,
      },
    })

    return NextResponse.json({
      authorization_url: payment.authorizationUrl,
      reference: payment.reference,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not initiate payment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
