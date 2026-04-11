import { createBrowserClient } from '@supabase/ssr'

const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  || ''

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    ANON_KEY
  )
}
