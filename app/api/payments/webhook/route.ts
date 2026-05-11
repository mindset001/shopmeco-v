import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidPaystackMetadata, parsePaystackMetadata, verifyPaystackSignature } from '@/lib/paystack'
import { holdEscrowPayment } from '@/lib/payments/escrow'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-paystack-signature')

  if (!verifyPaystackSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: {
    event?: string
    data?: {
      status?: string
      reference?: string
      amount?: number
      metadata?: unknown
    }
  }

  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  if (event.event !== 'charge.success' || event.data?.status !== 'success') {
    return NextResponse.json({ received: true })
  }

  const reference = event.data?.reference as string | undefined
  const metadata = parsePaystackMetadata(event.data?.metadata ?? null)

  if (!reference || !isValidPaystackMetadata(metadata)) {
    return NextResponse.json({ received: true })
  }

  if (Math.round(Number(metadata.amount) * 100) !== Number(event.data?.amount)) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  try {
    await holdEscrowPayment({
      reference,
      metadata,
      supabase: createAdminClient(),
    })
  } catch {
    return NextResponse.json({ error: 'Could not process payment' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
