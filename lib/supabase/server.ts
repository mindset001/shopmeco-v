import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  || ''

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — can be ignored
          }
        },
      },
    }
  )
}
