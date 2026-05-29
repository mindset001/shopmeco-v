import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type RegistrableRole = 'repairer' | 'parts_seller'

const REGISTRABLE_ROLES = new Set<RegistrableRole>(['repairer', 'parts_seller'])

export async function POST(request: Request) {
  const caller = await createClient()
  const {
    data: { user },
  } = await caller.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: creator } = await caller
    .from('profiles')
    .select('id, role, field_agent_allowed_roles')
    .eq('id', user.id)
    .single()

  if (!creator || (creator.role !== 'field_agent' && creator.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json() as {
    email?: string
    password?: string
    fullName?: string
    phone?: string
    role?: RegistrableRole
  }

  const fullName = body.fullName?.trim()
  const email = body.email?.trim().toLowerCase()
  const password = body.password
  const role = body.role

  if (!fullName || !email || !password || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!REGISTRABLE_ROLES.has(role)) {
    return NextResponse.json({ error: 'Invalid user type' }, { status: 400 })
  }

  if (creator.role === 'field_agent') {
    const allowedRoles = (creator.field_agent_allowed_roles ?? []) as string[]
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'You are not assigned to register this user type' }, { status: 403 })
    }
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
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
      role,
      created_by: creator.id,
    },
  })

  if (createError || !createdUser) {
    return NextResponse.json({ error: createError?.message ?? 'Could not create account' }, { status: 400 })
  }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: createdUser.id,
    full_name: fullName,
    phone: body.phone?.trim() || null,
    role,
    created_by: creator.id,
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(createdUser.id)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  if (role === 'repairer') {
    await admin.from('repairer_details').upsert({ id: createdUser.id })
  }

  return NextResponse.json({ success: true, user_id: createdUser.id })
}
