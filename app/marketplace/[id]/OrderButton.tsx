'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import Toaster from '@/components/ui/Toaster'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Props {
  product: {
    id: string
    seller_id: string
    name: string
    price: number
    stock_quantity: number
  }
  buyerId: string
}

export default function OrderButton({ product, buyerId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [qty, setQty] = useState(1)
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  async function placeOrder() {
    if (!address.trim()) { toast('Please enter a delivery address.', 'warning'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('orders').insert({
      buyer_id: buyerId,
      seller_id: product.seller_id,
      product_id: product.id,
      quantity: qty,
      total_price: product.price * qty,
      status: 'pending',
      delivery_address: address,
    })
    if (error) { toast(error.message, 'error'); setLoading(false); return }
    toast('Order placed successfully!', 'success')
    setOpen(false)
    router.push('/orders')
  }

  return (
    <>
      <Toaster />
      {!open ? (
        <Button
          fullWidth
          size="lg"
          onClick={() => setOpen(true)}
          disabled={product.stock_quantity === 0}
        >
          {product.stock_quantity > 0 ? 'Place Order' : 'Out of Stock'}
        </Button>
      ) : (
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>Complete your order</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input
              label="Quantity"
              type="number"
              min={1}
              max={product.stock_quantity}
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            />
            <Input
              label="Delivery address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your full delivery address"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-300)' }}>Total</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                  ₦{(product.price * qty).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button loading={loading} onClick={placeOrder}>Confirm</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
