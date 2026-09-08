'use client'

import { useState } from 'react'
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
  isSellerSubscribed?: boolean
  deliveryFee?: number
}

export default function OrderButton({ product, buyerId, isSellerSubscribed = true, deliveryFee = 0 }: Props) {
  const [open, setOpen] = useState(false)
  const [qty, setQty] = useState(1)
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  const subtotal = product.price * qty
  const total = subtotal + deliveryFee

  async function handlePayNow() {
    if (!address.trim()) { toast('Please enter a delivery address.', 'warning'); return }
    setLoading(true)
    const supabase = createClient()

    // Create the order first (unpaid)
    const { data: order, error } = await supabase.from('orders').insert({
      buyer_id: buyerId,
      seller_id: product.seller_id,
      product_id: product.id,
      quantity: qty,
      total_price: total,
      delivery_fee: deliveryFee,
      status: 'pending',
      payment_status: 'unpaid',
      delivery_address: address,
    }).select('id').single()

    if (error || !order) {
      toast(error?.message ?? 'Failed to create order.', 'error')
      setLoading(false)
      return
    }

    // Initiate Paystack payment
    const res = await fetch('/api/payments/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'order', id: order.id }),
    })
    const data = await res.json()

    if (!res.ok || !data.authorization_url) {
      toast(data.error ?? 'Could not initiate payment.', 'error')
      setLoading(false)
      return
    }

    window.location.href = data.authorization_url
  }

  if (!isSellerSubscribed) {
    return (
      <div className="card" style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--color-text-300)', fontSize: '0.9rem' }}>
        This seller isn&apos;t currently accepting orders.
      </div>
    )
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
          {product.stock_quantity > 0 ? 'Buy Now' : 'Out of Stock'}
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
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-text-300)' }}>
                <span>Subtotal</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              {deliveryFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-text-300)' }}>
                  <span>Delivery fee</span>
                  <span>₦{deliveryFee.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-300)' }}>Total</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                    ₦{total.toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button loading={loading} onClick={handlePayNow}>Pay via Paystack</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
