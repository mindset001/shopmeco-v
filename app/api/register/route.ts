import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, fullName, role } = await request.json()

  if (!email || !password || !fullName || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Create user with email already confirmed
  const { data: { user }, error: createError } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  })

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 })
  }

  // Upsert profile (trigger may have already done it)
  await sb.from('profiles').upsert({ id: user!.id, full_name: fullName, role })

  return NextResponse.json({ success: true })
}
