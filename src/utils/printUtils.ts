import type { Booking } from '../types';

export function generateLRHtml(booking: Booking): string {
  return `
    <div class="lr-page">
      <h2>LR #${booking.lr_number}</h2>
      <p>From: ${booking.from_branch_details?.name}</p>
      <p>To: ${booking.to_branch_details?.name}</p>
      <p>Amount: ₹${booking.total_amount}</p>
    </div>
  `;
}

export function printBookings(bookings: Booking[]) {
  const html = bookings.map(generateLRHtml).join('');
  const printContainer = document.createElement('div');
  printContainer.innerHTML = html;
  document.body.appendChild(printContainer);
  window.print();
  document.body.removeChild(printContainer);
}

export function downloadBookingLR(booking: Booking) {
  const blob = new Blob([generateLRHtml(booking)], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `LR-${booking.lr_number}.html`;
  link.click();
  URL.revokeObjectURL(url);
}
