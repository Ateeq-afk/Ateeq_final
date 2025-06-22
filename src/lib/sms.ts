import { supabase } from './supabaseClient';
import type { Booking } from '@/types';

export async function sendSMS(to: string, message: string) {
  try {
    console.log(`Sending SMS to ${to}: ${message}`);
    
    // In a real implementation, you would call your SMS gateway API
    // For now, we'll just log the message and store it in Supabase
    
    const { data, error } = await supabase
      .from('sms_logs')
      .insert({
        recipient: to,
        message,
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw error;
  }
}

export async function sendBookingSMS(booking: Booking) {
  try {
    if (!booking.sender?.mobile || !booking.receiver?.mobile) {
      throw new Error('Sender or receiver mobile number is missing');
    }
    
    // Send to sender
    await sendSMS(
      booking.sender.mobile,
      `Your shipment has been booked with LR number ${booking.lr_number}. Track at: ${window.location.origin}/track/${booking.lr_number}`
    );

    // Send to receiver
    await sendSMS(
      booking.receiver.mobile,
      `A shipment is on its way to you with LR number ${booking.lr_number}. Track at: ${window.location.origin}/track/${booking.lr_number}`
    );

    // Log the SMS sending in the database
    await supabase
      .from('notification_logs')
      .insert({
        booking_id: booking.id,
        notification_type: 'booking_created',
        recipients: [booking.sender.mobile, booking.receiver.mobile],
        sent_at: new Date().toISOString()
      });
    
    console.log('SMS notifications sent successfully for booking:', booking.lr_number);
    
    return true;
  } catch (err) {
    console.error('Failed to send booking SMS:', err);
    throw err;
  }
}

export async function sendStatusUpdateSMS(booking: Booking) {
  try {
    if (!booking.sender?.mobile || !booking.receiver?.mobile) {
      throw new Error('Sender or receiver mobile number is missing');
    }
    
    let statusMessage = '';
    switch (booking.status) {
      case 'in_transit':
        statusMessage = `Your shipment with LR ${booking.lr_number} is now in transit from ${booking.from_branch_details?.name} to ${booking.to_branch_details?.name}.`;
        break;
      case 'delivered':
        statusMessage = `Your shipment with LR ${booking.lr_number} has been delivered successfully.`;
        break;
      case 'cancelled':
        statusMessage = `Your shipment with LR ${booking.lr_number} has been cancelled.`;
        break;
      default:
        statusMessage = `Your shipment with LR ${booking.lr_number} status has been updated to ${booking.status}.`;
    }
    
    // Send to sender
    await sendSMS(booking.sender.mobile, statusMessage);

    // Send to receiver
    await sendSMS(booking.receiver.mobile, statusMessage);

    // Log the SMS sending in the database
    await supabase
      .from('notification_logs')
      .insert({
        booking_id: booking.id,
        notification_type: `status_${booking.status}`,
        recipients: [booking.sender.mobile, booking.receiver.mobile],
        sent_at: new Date().toISOString()
      });

    console.log('Status update SMS sent successfully for booking:', booking.lr_number);
    
    return true;
  } catch (err) {
    console.error('Failed to send status update SMS:', err);
    throw err;
  }
}

export async function sendDeliveryReminderSMS(booking: Booking) {
  try {
    if (!booking.receiver?.mobile) {
      throw new Error('Receiver mobile number is missing');
    }
    
    // Only send for in_transit bookings
    if (booking.status !== 'in_transit') {
      throw new Error('Booking is not in transit');
    }
    
    const message = `Your shipment with LR ${booking.lr_number} will be delivered soon. Please ensure someone is available to receive it.`;
    
    // Send to receiver
    await sendSMS(booking.receiver.mobile, message);

    // Log the SMS sending in the database
    await supabase
      .from('notification_logs')
      .insert({
        booking_id: booking.id,
        notification_type: 'delivery_reminder',
        recipients: [booking.receiver.mobile],
        sent_at: new Date().toISOString()
      });

    console.log('Delivery reminder SMS sent successfully for booking:', booking.lr_number);
    
    return true;
  } catch (err) {
    console.error('Failed to send delivery reminder SMS:', err);
    throw err;
  }
}