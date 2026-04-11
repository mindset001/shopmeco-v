// One-time script to create an admin user
// Usage: node scripts/create-admin.mjs <email> <password> <full_name>
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_KEY  = env['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const [,, email, password, fullName = 'Admin'] = process.argv

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password> [full_name]')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// 1. Create the auth user
const { data: { user }, error: signUpError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName, role: 'admin' }
})

if (signUpError) {
  console.error('Failed to create user:', signUpError.message)
  process.exit(1)
}

// 2. Upsert profile with admin role (trigger may have already inserted it)
const { error: profileError } = await supabase.from('profiles').upsert({
  id: user.id,
  full_name: fullName,
  role: 'admin'
})

if (profileError) {
  console.error('Failed to set admin role:', profileError.message)
  process.exit(1)
}

console.log(`✅ Admin created successfully!`)
console.log(`   Email:    ${email}`)
console.log(`   Password: ${password}`)
console.log(`   Name:     ${fullName}`)
console.log(`   User ID:  ${user.id}`)
console.log(`\nLogin at /login`)
