import React from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading,
  fullWidth,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn btn--${variant} btn--${size}${fullWidth ? ' btn--full' : ''}${className ? ` ${className}` : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="btn__spinner" />}
      {children}
    </button>
  )
}
