type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'accent'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  variant?: BadgeVariant
}

export default function Badge({ children, variant = 'default', className = '', ...props }: BadgeProps) {
  return (
    <span className={`badge badge--${variant} ${className}`.trim()} {...props}>
      {children}
    </span>
  )
}
