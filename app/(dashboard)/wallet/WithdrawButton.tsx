'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface Props {
  userId: string
  availableBalance: number
}

export default function WithdrawButton({ userId, availableBalance }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [amount, setAmount] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const withdrawAmount = Number(amount)
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast('Please enter a valid amount', 'error')
      return
    }
    
    if (withdrawAmount > availableBalance) {
      toast(`You can only withdraw up to ₦${availableBalance.toLocaleString()}`, 'error')
      return
    }

    if (!bankName || !accountNumber || !accountHolder) {
      toast('Please fill in all bank details', 'error')
      return
    }

    setLoading(true)
    const supabase = createClient()
    
    // 1. Check if there is an existing pending request
    const { data: pendingReq } = await supabase
      .from('withdrawal_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle()
      
    if (pendingReq) {
      toast('You already have a pending withdrawal request.', 'error')
      setLoading(false)
      return
    }

    // 2. Create withdrawal request
    const { error } = await supabase.from('withdrawal_requests').insert({
      user_id: userId,
      amount: withdrawAmount,
      bank_name: bankName,
      bank_account: accountNumber,
      account_holder: accountHolder,
      status: 'pending'
    })

    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Withdrawal request submitted! It is now pending admin approval.', 'success')
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <Button 
        size="lg" 
        onClick={() => setOpen(true)}
        disabled={availableBalance <= 0}
      >
        Withdraw Funds
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Withdraw Funds">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ padding: 'var(--space-4)', background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-200)' }}>Available Balance</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-accent)' }}>
              ₦{availableBalance.toLocaleString()}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Amount to Withdraw (₦) *</label>
            <input
              type="number"
              className="input"
              placeholder="e.g. 50000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="1000"
              max={availableBalance}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bank Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. GTBank, Access Bank"
              value={bankName}
              onChange={e => setBankName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Account Number *</label>
            <input
              type="text"
              className="input"
              placeholder="10-digit account number"
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Account Holder Name *</label>
            <input
              type="text"
              className="input"
              placeholder="Exact name on the account"
              value={accountHolder}
              onChange={e => setAccountHolder(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <Button variant="ghost" onClick={() => setOpen(false)} type="button">Cancel</Button>
            <Button loading={loading} type="submit">Submit Request</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
