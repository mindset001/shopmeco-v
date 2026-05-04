import React from 'react'
import { Loader2 } from 'lucide-react'

interface PageLoaderProps {
  message?: string
}

export default function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      width: '100%',
      gap: 'var(--space-4)',
      color: 'var(--color-text-300)'
    }}>
      <Loader2 
        size={48} 
        style={{ 
          color: 'var(--color-accent)', 
          animation: 'spin 1s linear infinite' 
        }} 
      />
      {message && (
        <span style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.8 }}>
          {message}
        </span>
      )}
    </div>
  )
}
