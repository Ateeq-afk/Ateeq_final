import type { Booking } from '@/types';

// SMS functionality has been disabled
// All functions now return success without actually sending SMS

export async function sendSMS(to: string, message: string) {
  console.log(`SMS functionality disabled. Would have sent to ${to}: ${message}`);
  return Promise.resolve({ id: 'disabled', status: 'disabled' });
}

export async function sendBookingSMS(booking: Booking) {
  console.log('SMS functionality disabled. Would have sent booking SMS for:', booking.lr_number);
  return Promise.resolve(true);
}

export async function sendStatusUpdateSMS(booking: Booking) {
  console.log('SMS functionality disabled. Would have sent status update SMS for:', booking.lr_number);
  return Promise.resolve(true);
}

export async function sendDeliveryReminderSMS(booking: Booking) {
  console.log('SMS functionality disabled. Would have sent delivery reminder SMS for:', booking.lr_number);
  return Promise.resolve(true);
}