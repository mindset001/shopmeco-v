export type UserRole = 'car_owner' | 'repairer' | 'parts_seller' | 'admin'

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export type PaymentStatus = 'unpaid' | 'pending' | 'in_escrow' | 'released' | 'refunded'

export type EscrowStatus = 'pending' | 'held' | 'released' | 'refunded'

export type TransactionType = 'escrow_hold' | 'escrow_release' | 'withdrawal'

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  bio: string | null
  address: string | null
  city: string | null
  state: string | null
  latitude: number | null
  longitude: number | null
  is_verified: boolean
  is_suspended: boolean
  shop_images: string[]
  created_at: string
}

export interface RepairerDetails {
  id: string
  specializations: string[]
  years_experience: number | null
  rating: number
  total_reviews: number
  is_available: boolean
  workshop_name: string | null
  workshop_images: string[]
  hourly_rate: number | null
}

export interface RepairerWithProfile extends Profile {
  repairer_details: RepairerDetails | null
}

export interface Product {
  id: string
  seller_id: string
  name: string
  description: string | null
  price: number
  stock_quantity: number
  category: string | null
  brand: string | null
  compatible_cars: string[]
  images: string[]
  is_active: boolean
  created_at: string
  profiles?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'city'>
}

export interface Order {
  id: string
  buyer_id: string
  seller_id: string
  product_id: string
  quantity: number
  total_price: number
  status: OrderStatus
  delivery_address: string | null
  created_at: string
  products?: Pick<Product, 'id' | 'name' | 'images' | 'price'>
  buyer?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
  seller?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

export interface Conversation {
  id: string
  participant_1: string
  participant_2: string
  created_at: string
  other_user?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'role'>
  last_message?: Message | null
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

export interface Review {
  id: string
  repairer_id: string
  reviewer_id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

export interface Car {
  id: string
  owner_id: string
  make: string
  model: string
  year: number
  color: string | null
  plate_number: string | null
  mileage: number | null
  description: string | null
  images: string[]
  is_public: boolean
  created_at: string
  profiles?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'city'>
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface Booking {
  id: string
  repairer_id: string
  customer_id: string
  scheduled_date: string
  description: string
  status: BookingStatus
  agreed_price: number | null
  payment_status: PaymentStatus
  created_at: string
  repairer?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'city'>
  customer?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

export interface Wallet {
  id: string
  user_id: string
  balance: number
  updated_at: string
}

export interface EscrowPayment {
  id: string
  payer_id: string
  payee_id: string
  amount: number
  paystack_ref: string | null
  status: EscrowStatus
  related_type: 'booking' | 'order'
  related_id: string
  created_at: string
  released_at: string | null
  payer?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
  payee?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

export interface WalletTransaction {
  id: string
  user_id: string
  wallet_id: string | null
  type: TransactionType
  amount: number
  description: string | null
  related_type: string | null
  related_id: string | null
  created_at: string
}
