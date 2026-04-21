import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/utils/notifications'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { bookingId, action, otherUserId } = await request.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get the booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const notificationUserId = otherUserId || (user.id === booking.repairer_id ? booking.customer_id : booking.repairer_id)

    // Create notification based on action
    if (action === 'created') {
      await createNotification(
        booking.repairer_id,
        'booking_request',
        '📅 New Booking Request',
        'A customer has requested a booking appointment.',
        bookingId
      )
    } else if (action === 'confirmed') {
      await createNotification(
        booking.customer_id,
        'booking_confirmed',
        '✅ Booking Confirmed',
        `Your booking has been confirmed for ₦${booking.agreed_price}`,
        bookingId
      )
    } else if (action === 'completed') {
      await createNotification(
        booking.customer_id,
        'booking_completed',
        '🎉 Service Completed',
        'The repair service has been marked as completed.',
        bookingId
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notification error:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}
