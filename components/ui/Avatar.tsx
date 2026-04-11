import { getInitials } from '@/lib/utils/helpers'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
  sm: 28,
  md: 36,
  lg: 48,
  xl: 72,
}

export default function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const px = sizeMap[size]
  const style = { width: px, height: px, fontSize: px * 0.38 }

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? 'avatar'}
        className={`avatar avatar--${size}`}
        style={style}
      />
    )
  }

  return (
    <span className={`avatar avatar--${size} avatar--fallback`} style={style}>
      {getInitials(name ?? null)}
    </span>
  )
}
