import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/utils/profile'

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { request_id, user_id, amount } = await req.json() as { request_id: string, user_id: string, amount: number }
  if (!request_id || !user_id || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 1. Get the wallet
  const { data: wallet } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('user_id', user_id)
    .single()

  if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })

  if (wallet.balance < amount) {
    return NextResponse.json({ error: 'Insufficient wallet balance for this withdrawal' }, { status: 400 })
  }

  // 2. Deduct balance
  const { error: walletError } = await supabase
    .from('wallets')
    .update({ balance: wallet.balance - amount, updated_at: new Date().toISOString() })
    .eq('id', wallet.id)

  if (walletError) {
    return NextResponse.json({ error: 'Failed to update wallet balance' }, { status: 500 })
  }

  // 3. Record withdrawal transaction
  await supabase.from('wallet_transactions').insert({
    user_id,
    wallet_id: wallet.id,
    type: 'withdrawal',
    amount,
    description: `Withdrawal to bank account (Request #${request_id.slice(0, 8)})`,
  })

  // 4. Update request status to 'approved'
  const { error: requestError } = await supabase
    .from('withdrawal_requests')
    .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: profile.id })
    .eq('id', request_id)

  if (requestError) {
    return NextResponse.json({ error: 'Failed to update request status' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
