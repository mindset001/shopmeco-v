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

  const { data, error } = await supabase.rpc('hold_escrow_payment', {
    p_reference: reference,
    p_related_type: metadata.type,
    p_related_id: metadata.related_id,
    p_payer_id: metadata.payer_id,
    p_payee_id: metadata.payee_id,
    p_amount: amount,
  })

  if (error) throw error

  const result = data as { already_processed?: boolean; escrow_id?: string | null } | null
  return {
    alreadyProcessed: Boolean(result?.already_processed),
    escrowId: result?.escrow_id ?? null,
  }
}
