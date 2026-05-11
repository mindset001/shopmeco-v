import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PaystackMetadata } from '@/lib/paystack'

export async function holdEscrowPayment(params: {
  reference: string
  metadata: PaystackMetadata
  supabase?: SupabaseClient
}) {
  const { reference, metadata } = params
  const supabase = params.supabase ?? createAdminClient()
  const amount = Number(metadata.amount)

  if (!reference) throw new Error('Missing Paystack reference')
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invalid payment amount')

  const { data: existing, error: existingError } = await supabase
    .from('escrow_payments')
    .select('id')
    .eq('paystack_ref', reference)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) return { alreadyProcessed: true, escrowId: existing.id as string }

  const { data: escrow, error: escrowError } = await supabase
    .from('escrow_payments')
    .insert({
      payer_id: metadata.payer_id,
      payee_id: metadata.payee_id,
      amount,
      paystack_ref: reference,
      status: 'held',
      related_type: metadata.type,
      related_id: metadata.related_id,
    })
    .select('id')
    .single()

  if (escrowError) {
    if (escrowError.code === '23505') {
      return { alreadyProcessed: true, escrowId: null }
    }

    throw escrowError
  }

  const { error: transactionError } = await supabase.from('wallet_transactions').insert({
    user_id: metadata.payer_id,
    type: 'escrow_hold',
    amount,
    description: `Payment held in escrow for ${metadata.type} #${metadata.related_id.slice(0, 8)}`,
    related_type: metadata.type,
    related_id: metadata.related_id,
  })

  if (transactionError) throw transactionError

  const table = metadata.type === 'booking' ? 'bookings' : 'orders'
  const { error: updateError } = await supabase
    .from(table)
    .update({ payment_status: 'in_escrow' })
    .eq('id', metadata.related_id)

  if (updateError) throw updateError

  return { alreadyProcessed: false, escrowId: escrow.id as string }
}
