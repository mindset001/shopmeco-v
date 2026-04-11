'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface Props {
  placeholder?: string
}

export default function AdminSearchInput({ placeholder = 'Search…' }: Props) {
  const router = useRouter()
  const sp = useSearchParams()

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const params = new URLSearchParams(sp.toString())
      if (e.target.value) {
        params.set('q', e.target.value)
      } else {
        params.delete('q')
      }
      params.delete('page')
      router.replace(`?${params.toString()}`)
    },
    [router, sp],
  )

  return (
    <input
      type="search"
      className="input"
      style={{ maxWidth: 280, padding: '0.5rem var(--space-3)', fontSize: '0.875rem' }}
      placeholder={placeholder}
      defaultValue={sp.get('q') ?? ''}
      onChange={handleChange}
    />
  )
}
