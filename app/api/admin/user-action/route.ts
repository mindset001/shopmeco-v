import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  // Verify caller is admin
  const caller = await createClient()
  const { data: { user } } = await caller.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await caller.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, action } = await request.json()
  if (!userId || !action) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const admin = createAdminClient()

  if (action === 'delete') {
    // Delete from auth (cascade removes profile)
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  if (action === 'verify') {
    const { error } = await admin.from('profiles').update({ is_verified: true }).eq('id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  if (action === 'unverify') {
    const { error } = await admin.from('profiles').update({ is_verified: false }).eq('id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  if (action === 'suspend') {
    const { error } = await admin.from('profiles').update({ is_suspended: true }).eq('id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  if (action === 'unsuspend') {
    const { error } = await admin.from('profiles').update({ is_suspended: false }).eq('id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
