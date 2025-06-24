import type { Booking } from '../types';

export function generateLRHtml(booking: Booking): string {
  const copy = `
    <div class="lr-copy">
      <div class="lr-header">
        <h3>LR #${booking.lr_number}</h3>
        <p>Date: ${new Date(booking.created_at).toLocaleDateString()}</p>
      </div>
      <div class="lr-content">
        <div class="lr-section">
          <div class="lr-col">
            <h4>From</h4>
            <p>${booking.from_branch_details?.name || ''}</p>
            <p>${booking.from_branch_details?.city || ''}, ${booking.from_branch_details?.state || ''}</p>
          </div>
          <div class="lr-col">
            <h4>To</h4>
            <p>${booking.to_branch_details?.name || ''}</p>
            <p>${booking.to_branch_details?.city || ''}, ${booking.to_branch_details?.state || ''}</p>
          </div>
        </div>
        
        <div class="lr-section">
          <div class="lr-col">
            <h4>Sender</h4>
            <p>${booking.sender?.name || ''}</p>
            <p>${booking.sender?.mobile || ''}</p>
          </div>
          <div class="lr-col">
            <h4>Receiver</h4>
            <p>${booking.receiver?.name || ''}</p>
            <p>${booking.receiver?.mobile || ''}</p>
          </div>
        </div>
        
        <div class="lr-section">
          <h4>Article Details</h4>
          <table>
            <tr>
              <th>Article</th>
              <th>Description</th>
              <th style="text-align: right;">Quantity</th>
              <th style="text-align: right;">Weight</th>
            </tr>
            <tr>
              <td>${booking.article?.name || ''}</td>
              <td>${booking.description || '-'}</td>
              <td style="text-align: right;">${booking.quantity} ${booking.uom}</td>
              <td style="text-align: right;">${booking.actual_weight || '-'} kg</td>
            </tr>
          </table>
        </div>
        
        <div class="lr-section">
          <div class="lr-col">
            <h4>Payment Details</h4>
            <p>Payment Type: ${booking.payment_type}</p>
            <p>Status: ${booking.status.replace('_', ' ')}</p>
          </div>
          <div class="lr-col">
            <h4>Additional Information</h4>
            <p>Booking Date: ${new Date(booking.created_at).toLocaleDateString()}</p>
            <p>Expected Delivery: ${booking.expected_delivery_date ? new Date(booking.expected_delivery_date).toLocaleDateString() : 'Not specified'}</p>
          </div>
        </div>
        
        <div class="lr-signatures">
          <div class="signature-box">
            <p class="signature-line">Sender's Signature</p>
          </div>
          <div class="signature-box">
            <p class="signature-line">Receiver's Signature</p>
          </div>
          <div class="signature-box">
            <p class="signature-line">For DesiCargo Logistics</p>
          </div>
        </div>
      </div>
    </div>
  `;

  return `
    <div class="lr-pair">
      ${copy}
      ${copy}
    </div>
    <div class="lr-footer">
      <p>Powered by DesiCargo</p>
    </div>
  `;
}

export function printBookings(bookings: Booking[]) {
  const style = `
    <style>
      @media print {
        @page { size: A5 landscape; margin: 5mm; }
        body { font-family: 'Lato', Arial, sans-serif; }
      }
      .lr-pair { 
        display: flex; 
        gap: 4mm; 
        page-break-inside: avoid; 
        margin-bottom: 10mm;
      }
      .lr-copy { 
        width: 50%; 
        border: 1px solid #000; 
        padding: 4mm; 
        box-sizing: border-box; 
        font-family: 'Lato', Arial, sans-serif; 
      }
      .lr-header { 
        border-bottom: 1px solid #ddd; 
        padding-bottom: 3mm; 
        margin-bottom: 3mm; 
      }
      .lr-header h3 { 
        margin: 0 0 2mm 0; 
        font-size: 14pt; 
      }
      .lr-header p { 
        margin: 0; 
        font-size: 10pt; 
      }
      .lr-content { 
        font-size: 10pt; 
      }
      .lr-section { 
        margin-bottom: 4mm; 
        border-bottom: 1px solid #eee; 
        padding-bottom: 3mm; 
      }
      .lr-section:last-child { 
        border-bottom: none; 
      }
      .lr-section h4 { 
        margin: 0 0 2mm 0; 
        font-size: 11pt; 
      }
      .lr-section p { 
        margin: 0 0 1mm 0; 
      }
      .lr-section table { 
        width: 100%; 
        border-collapse: collapse; 
        margin-top: 2mm; 
      }
      .lr-section th, .lr-section td { 
        border: 1px solid #ddd; 
        padding: 2mm; 
        font-size: 9pt; 
      }
      .lr-section th { 
        background-color: #f5f5f5; 
        font-weight: bold; 
      }
      .lr-col { 
        display: inline-block; 
        width: 48%; 
        vertical-align: top; 
      }
      .lr-signatures { 
        display: flex; 
        justify-content: space-between; 
        margin-top: 5mm; 
      }
      .signature-box { 
        width: 30%; 
        text-align: center; 
      }
      .signature-line { 
        border-top: 1px solid #000; 
        padding-top: 2mm; 
        margin-top: 10mm; 
        font-size: 9pt;
      }
      .lr-footer {
        text-align: center;
        margin-top: 5mm;
        font-size: 9pt;
        color: #666;
        page-break-before: avoid;
      }
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
        body { font-family: 'Lato', Arial, sans-serif; }
      }
      .lr-pair { 
        display: flex; 
        gap: 4mm; 
        page-break-inside: avoid; 
        margin-bottom: 10mm;
      }
      .lr-copy { 
        width: 50%; 
        border: 1px solid #000; 
        padding: 4mm; 
        box-sizing: border-box; 
        font-family: 'Lato', Arial, sans-serif; 
      }
      .lr-header { 
        border-bottom: 1px solid #ddd; 
        padding-bottom: 3mm; 
        margin-bottom: 3mm; 
      }
      .lr-header h3 { 
        margin: 0 0 2mm 0; 
        font-size: 14pt; 
      }
      .lr-header p { 
        margin: 0; 
        font-size: 10pt; 
      }
      .lr-content { 
        font-size: 10pt; 
      }
      .lr-section { 
        margin-bottom: 4mm; 
        border-bottom: 1px solid #eee; 
        padding-bottom: 3mm; 
      }
      .lr-section:last-child { 
        border-bottom: none; 
      }
      .lr-section h4 { 
        margin: 0 0 2mm 0; 
        font-size: 11pt; 
      }
      .lr-section p { 
        margin: 0 0 1mm 0; 
      }
      .lr-section table { 
        width: 100%; 
        border-collapse: collapse; 
        margin-top: 2mm; 
      }
      .lr-section th, .lr-section td { 
        border: 1px solid #ddd; 
        padding: 2mm; 
        font-size: 9pt; 
      }
      .lr-section th { 
        background-color: #f5f5f5; 
        font-weight: bold; 
      }
      .lr-col { 
        display: inline-block; 
        width: 48%; 
        vertical-align: top; 
      }
      .lr-signatures { 
        display: flex; 
        justify-content: space-between; 
        margin-top: 5mm; 
      }
      .signature-box { 
        width: 30%; 
        text-align: center; 
      }
      .signature-line { 
        border-top: 1px solid #000; 
        padding-top: 2mm; 
        margin-top: 10mm; 
        font-size: 9pt;
      }
      .lr-footer {
        text-align: center;
        margin-top: 5mm;
        font-size: 9pt;
        color: #666;
        page-break-before: avoid;
      }
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