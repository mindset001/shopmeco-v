import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/utils/profile'
import { createClient } from '@/lib/supabase/server'
import VerificationForm from './VerificationForm'

export default async function VerificationPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()

  const { data: verification } = await supabase
    .from('id_verifications')
    .select('*')
    .eq('user_id', profile.id)
    .maybeSingle()

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Identity Verification</h1>
        <p className="page-subtitle">Submit your ID to get the Verified Mechanic badge</p>
      </div>

      <VerificationForm userId={profile.id} existingVerification={verification} />
    </div>
  )
}
