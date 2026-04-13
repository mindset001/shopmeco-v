import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/utils/profile'

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { escrow_id } = await req.json() as { escrow_id: string }
  if (!escrow_id) return NextResponse.json({ error: 'Missing escrow_id' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: escrow } = await supabase
    .from('escrow_payments')
    .select('*')
    .eq('id', escrow_id)
    .single()

  if (!escrow) return NextResponse.json({ error: 'Escrow payment not found' }, { status: 404 })
  if (escrow.status !== 'held') {
    return NextResponse.json({ error: 'Payment is not in held status' }, { status: 400 })
  }

  const payeeId = escrow.payee_id
  const amount = Number(escrow.amount)

  // Upsert wallet for payee
  const { data: existingWallet } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('user_id', payeeId)
    .maybeSingle()

  let walletId: string

  if (existingWallet) {
    walletId = existingWallet.id
    await supabase
      .from('wallets')
      .update({ balance: existingWallet.balance + amount, updated_at: new Date().toISOString() })
      .eq('id', walletId)
  } else {
    const { data: newWallet } = await supabase
      .from('wallets')
      .insert({ user_id: payeeId, balance: amount })
      .select('id')
      .single()
    walletId = newWallet!.id
  }

  // Record release transaction
  await supabase.from('wallet_transactions').insert({
    user_id: payeeId,
    wallet_id: walletId,
    type: 'escrow_release',
    amount,
    description: `Released from escrow for ${escrow.related_type} #${escrow.related_id.slice(0, 8)}`,
    related_type: escrow.related_type,
    related_id: escrow.related_id,
  })

  // Mark escrow as released
  await supabase
    .from('escrow_payments')
    .update({ status: 'released', released_at: new Date().toISOString() })
    .eq('id', escrow_id)

  // Update related booking/order payment_status to 'released'
  if (escrow.related_type === 'booking') {
    await supabase
      .from('bookings')
      .update({ payment_status: 'released' })
      .eq('id', escrow.related_id)
  } else {
    await supabase
      .from('orders')
      .update({ payment_status: 'released' })
      .eq('id', escrow.related_id)
  }

  return NextResponse.json({ success: true })
}
