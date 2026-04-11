import { Star } from 'lucide-react'

interface RatingStarsProps {
  rating: number
  size?: number
  showValue?: boolean
}

export default function RatingStars({
  rating,
  size = 14,
  showValue = false,
}: RatingStarsProps) {
  return (
    <span className="rating-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(rating) ? 'star--filled' : 'star--empty'}
        />
      ))}
      {showValue && <span className="rating-value">{rating.toFixed(1)}</span>}
    </span>
  )
}
