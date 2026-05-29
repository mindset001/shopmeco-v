import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type RegistrableRole = 'repairer' | 'parts_seller'

const ALLOWED_REGISTRABLE_ROLES = new Set<RegistrableRole>(['repairer', 'parts_seller'])

export async function POST(request: Request) {
  const caller = await createClient()
  const {
    data: { user },
  } = await caller.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await caller
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json() as {
    email?: string
    password?: string
    fullName?: string
    phone?: string
    allowedRoles?: RegistrableRole[]
  }

  const fullName = body.fullName?.trim()
  const email = body.email?.trim().toLowerCase()
  const password = body.password
  const allowedRoles = Array.from(new Set(body.allowedRoles ?? []))
    .filter((role): role is RegistrableRole => ALLOWED_REGISTRABLE_ROLES.has(role))

  if (!fullName || !email || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  if (allowedRoles.length === 0) {
    return NextResponse.json({ error: 'Assign at least one user type' }, { status: 400 })
  }

  const admin = createAdminClient()
  const {
    data: { user: createdUser },
    error: createError,
  } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      field_agent_allowed_roles: allowedRoles,
    },
  })

  if (createError || !createdUser) {
    return NextResponse.json({ error: createError?.message ?? 'Could not create field agent' }, { status: 400 })
  }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: createdUser.id,
    full_name: fullName,
    phone: body.phone?.trim() || null,
    role: 'field_agent',
    created_by: profile.id,
    field_agent_allowed_roles: allowedRoles,
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(createdUser.id)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, user_id: createdUser.id })
}
