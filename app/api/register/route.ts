import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { UserRole } from '@/types'

const PUBLIC_ROLES = new Set<UserRole>(['car_owner', 'repairer', 'parts_seller'])

export async function POST(request: NextRequest) {
  const { email, password, fullName, role } = await request.json() as {
    email?: string
    password?: string
    fullName?: string
    role?: UserRole
  }

  if (!email || !password || !fullName || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!PUBLIC_ROLES.has(role)) {
    return NextResponse.json({ error: 'Invalid account role' }, { status: 400 })
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

  // Use anon client so Supabase sends the confirmation email via SMTP
  const anonSb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: { user }, error: signUpError } = await anonSb.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
      data: { full_name: fullName, role },
    },
  })

  if (signUpError) {
    return NextResponse.json({ error: signUpError.message }, { status: 400 })
  }

  if (!user) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 400 })
  }

  // Upsert profile via admin (trigger may have already done it)
  const adminSb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  await adminSb.from('profiles').upsert({ id: user.id, full_name: fullName, role })

  return NextResponse.json({ success: true })
}
