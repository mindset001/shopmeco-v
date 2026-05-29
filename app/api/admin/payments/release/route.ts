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

  const { error } = await supabase.rpc('release_escrow_payment', {
    p_escrow_id: escrow_id,
    p_admin_id: profile.id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
