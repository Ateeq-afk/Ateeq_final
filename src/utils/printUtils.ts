import type { Booking } from '../types';

export function generateLRHtml(booking: Booking): string {
  const copy = `
    <div class="lr-copy">
      <h3>LR #${booking.lr_number}</h3>
      <p>Date: ${new Date(booking.created_at).toLocaleDateString()}</p>
      <p>From: ${booking.from_branch_details?.name || ''}</p>
      <p>To: ${booking.to_branch_details?.name || ''}</p>
      <p>Sender: ${booking.sender?.name || ''}</p>
      <p>Receiver: ${booking.receiver?.name || ''}</p>
      <p>Article: ${booking.article?.name || ''}</p>
      <p>Quantity: ${booking.quantity} ${booking.uom}</p>
      ${booking.remarks ? `<p>Remarks: ${booking.remarks}</p>` : ''}
    </div>
  `;

  return `<div class="lr-pair">${copy}${copy}</div>`;
}

export function printBookings(bookings: Booking[]) {
  const style = `
    <style>
      @media print {
        @page { size: A5 landscape; margin: 5mm; }
      }
      .lr-pair { display: flex; gap: 4mm; page-break-inside: avoid; }
      .lr-copy { width: 50%; border: 1px solid #000; padding: 4mm; box-sizing: border-box; font-family: Arial, sans-serif; }
      .lr-copy h3 { margin: 0 0 3mm 0; font-size: 14pt; }
      .lr-copy p { margin: 0 0 2mm 0; font-size: 10pt; }
    </style>
  `;

  const html = style + bookings.map(generateLRHtml).join('');
  const printContainer = document.createElement('div');
  printContainer.innerHTML = html;
  document.body.appendChild(printContainer);
  window.print();
  document.body.removeChild(printContainer);
}

export function downloadBookingLR(booking: Booking) {
  const style = `
    <style>
      @media print {
        @page { size: A5 landscape; margin: 5mm; }
      }
      .lr-pair { display: flex; gap: 4mm; page-break-inside: avoid; }
      .lr-copy { width: 50%; border: 1px solid #000; padding: 4mm; box-sizing: border-box; font-family: Arial, sans-serif; }
      .lr-copy h3 { margin: 0 0 3mm 0; font-size: 14pt; }
      .lr-copy p { margin: 0 0 2mm 0; font-size: 10pt; }
    </style>
  `;

  const blob = new Blob([style + generateLRHtml(booking)], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `LR-${booking.lr_number}.html`;
  link.click();
  URL.revokeObjectURL(url);
}
