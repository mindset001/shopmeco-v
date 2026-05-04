'use client'

import { useRouter } from 'next/navigation'
import Modal from './Modal'

export default function RouteModal({
  children,
  title,
}: {
  children: React.ReactNode
  title?: string
}) {
  const router = useRouter()
  return (
    <Modal
      open={true}
      onClose={() => router.back()}
      title={title}
      size="lg"
    >
      {children}
    </Modal>
  )
}
