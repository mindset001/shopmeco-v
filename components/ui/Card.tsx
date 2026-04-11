import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  glass?: boolean
  hover?: boolean
  onClick?: () => void
}

export default function Card({
  children,
  className = '',
  glass,
  hover,
  onClick,
}: CardProps) {
  return (
    <div
      className={`card${glass ? ' card--glass' : ''}${hover ? ' card--hover' : ''}${className ? ` ${className}` : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}
