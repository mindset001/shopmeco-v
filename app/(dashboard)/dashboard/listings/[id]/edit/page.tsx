import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/utils/profile'
import EditListingForm from './EditListingForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditListingPage({ params }: Props) {
  const { id } = await params
  const profile = await getCurrentProfile()

  if (!profile || profile.role !== 'parts_seller') {
    redirect('/dashboard')
  }

  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!product || product.seller_id !== profile.id) {
    redirect('/dashboard/listings')
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800 }}>
      <div className="page-header">
        <h1 className="page-title">Edit Listing</h1>
        <p className="page-subtitle">Update your product details, price, and inventory.</p>
      </div>

      <EditListingForm product={product} />
    </div>
  )
}
