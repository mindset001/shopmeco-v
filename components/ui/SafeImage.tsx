'use client'

import { useState } from 'react'
import { ShoppingBag } from 'lucide-react'

interface Props {
  src?: string | null
  alt: string
  style?: React.CSSProperties
  onLoad?: () => void
  onError?: () => void
}

export default function SafeImage({ src, alt, style, onLoad, onError }: Props) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-surface-800)',
        color: 'var(--color-surface-600)',
        ...style,
      }}>
        <ShoppingBag size={72} />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      style={style}
      onLoad={onLoad}
      onError={() => {
        setHasError(true)
        onError?.()
      }}
    />
  )
}
