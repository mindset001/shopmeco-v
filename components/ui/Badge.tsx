type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'accent'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
}

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  return <span className={`badge badge--${variant}`}>{children}</span>
}
