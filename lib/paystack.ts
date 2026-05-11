import { createHmac, timingSafeEqual } from 'crypto'

const PAYSTACK_BASE_URL = 'https://api.paystack.co'
const PLACEHOLDER_SECRET = 'sk_test_8fadad00702e3ecd8bc6318e5e2a34dea5bf40c6'

export type PaystackPaymentType = 'booking' | 'order'

export interface PaystackMetadata {
  type: PaystackPaymentType
  related_id: string
  payer_id: string
  payee_id: string
  amount: number
  description?: string
}

interface PaystackInitializeResponse {
  status: boolean
  message: string
  data?: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export interface PaystackTransaction {
  status: string
  reference: string
  amount: number
  requested_amount?: number
  currency: string
  metadata: PaystackMetadata | string | null
}

interface PaystackVerifyResponse {
  status: boolean
  message: string
  data?: PaystackTransaction
}

function getPaystackSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY

  if (!key || key.includes(PLACEHOLDER_SECRET)) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured')
  }

  return key
}

export function getAppUrl(reqUrl: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL

  if (configuredUrl) {
    try {
      return new URL(configuredUrl).origin
    } catch {
      throw new Error('NEXT_PUBLIC_APP_URL must be a valid absolute URL')
    }
  }

  return new URL(reqUrl).origin
}

export async function initializePaystackTransaction(params: {
  email: string
  amount: number
  callbackUrl: string
  metadata: PaystackMetadata
}) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getPaystackSecretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amount * 100),
      currency: 'NGN',
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  })

  const data = (await response.json()) as PaystackInitializeResponse

  if (!response.ok || !data.status || !data.data?.authorization_url) {
    throw new Error(data.message || 'Paystack could not initialize this payment')
  }

  return {
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  }
}

export async function verifyPaystackTransaction(reference: string) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${getPaystackSecretKey()}` },
    cache: 'no-store',
  })

  const data = (await response.json()) as PaystackVerifyResponse

  if (!response.ok || !data.status || !data.data) {
    throw new Error(data.message || 'Paystack could not verify this payment')
  }

  return data.data
}

export function verifyPaystackSignature(body: string, signature: string | null) {
  if (!signature) return false

  const expectedSignature = createHmac('sha512', getPaystackSecretKey())
    .update(body)
    .digest('hex')

  const expected = Buffer.from(expectedSignature)
  const received = Buffer.from(signature)

  return expected.length === received.length && timingSafeEqual(expected, received)
}

export function parsePaystackMetadata(metadata: PaystackTransaction['metadata'] | unknown) {
  if (!metadata) return null
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata) as PaystackMetadata
    } catch {
      return null
    }
  }

  if (typeof metadata !== 'object') return null

  return metadata as PaystackMetadata
}

export function isValidPaystackMetadata(metadata: PaystackMetadata | null): metadata is PaystackMetadata {
  return Boolean(
    metadata &&
      (metadata.type === 'booking' || metadata.type === 'order') &&
      metadata.related_id &&
      metadata.payer_id &&
      metadata.payee_id &&
      Number.isFinite(Number(metadata.amount)) &&
      Number(metadata.amount) > 0
  )
}
