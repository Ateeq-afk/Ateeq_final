import type { Booking } from '../types';
import type { Payment } from '../services/payments';

export function generateLRHtml(booking: Booking): string {
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const officeCopy = `
    <div class="lr-copy office-copy">
      <div class="copy-header">
        <h3>OFFICE COPY</h3>
      </div>
      <div class="lr-header">
        <div class="company-info">
          <h2>TRANSPORT SERVICES</h2>
          <p>Goods Transport & Logistics</p>
        </div>
        <div class="lr-number">
          <h3>LR #${booking.lr_number}</h3>
          <p>Date: ${formatDate(booking.created_at)}</p>
          <p>Time: ${formatTime(booking.created_at)}</p>
        </div>
      </div>
      
      <div class="lr-content">
        <div class="lr-section route-section">
          <div class="route-info">
            <div class="route-point">
              <h4>FROM</h4>
              <p class="location-name">${booking.from_branch_details?.name || 'N/A'}</p>
              <p class="location-address">${booking.from_branch_details?.city || 'N/A'}, ${booking.from_branch_details?.state || 'N/A'}</p>
              <p class="location-code">Branch Code: ${booking.from_branch_details?.code || 'N/A'}</p>
            </div>
            <div class="route-arrow">→</div>
            <div class="route-point">
              <h4>TO</h4>
              <p class="location-name">${booking.to_branch_details?.name || 'N/A'}</p>
              <p class="location-address">${booking.to_branch_details?.city || 'N/A'}, ${booking.to_branch_details?.state || 'N/A'}</p>
              <p class="location-code">Branch Code: ${booking.to_branch_details?.code || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <div class="lr-section parties-section">
          <div class="party-info">
            <h4>SENDER DETAILS</h4>
            <p class="party-name">${booking.sender?.name || 'N/A'}</p>
            <p class="party-contact">Mobile: ${booking.sender?.mobile || 'N/A'}</p>
            <p class="party-address">${booking.sender?.address || 'N/A'}</p>
            ${booking.sender?.gst ? `<p class="party-gst">GST: ${booking.sender.gst}</p>` : ''}
          </div>
          <div class="party-info">
            <h4>RECEIVER DETAILS</h4>
            <p class="party-name">${booking.receiver?.name || 'N/A'}</p>
            <p class="party-contact">Mobile: ${booking.receiver?.mobile || 'N/A'}</p>
            <p class="party-address">${booking.receiver?.address || 'N/A'}</p>
            ${booking.receiver?.gst ? `<p class="party-gst">GST: ${booking.receiver.gst}</p>` : ''}
          </div>
        </div>
        
        <div class="lr-section articles-section">
          <h4>ARTICLE DETAILS</h4>
          <table class="articles-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Weight</th>
                <th>Rate</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${booking.article?.name || 'General Cargo'}</td>
                <td>${booking.description || '-'}</td>
                <td>${booking.quantity} ${booking.uom}</td>
                <td>${booking.actual_weight || booking.charged_weight || 'N/A'} kg</td>
                <td>₹${booking.freight_per_qty || 'N/A'}</td>
                <td>₹${booking.declared_value || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${booking.has_invoice ? `
        <div class="lr-section invoice-section">
          <h4>INVOICE DETAILS</h4>
          <div class="invoice-info">
            <div class="invoice-row">
              <span>Invoice Number:</span>
              <span class="invoice-value">${booking.invoice_number || 'N/A'}</span>
            </div>
            <div class="invoice-row">
              <span>Invoice Date:</span>
              <span class="invoice-value">${booking.invoice_date ? formatDate(booking.invoice_date) : 'N/A'}</span>
            </div>
            <div class="invoice-row">
              <span>Invoice Amount:</span>
              <span class="invoice-value">₹${booking.invoice_amount || 'N/A'}</span>
            </div>
            ${booking.eway_bill_number ? `
            <div class="invoice-row eway-bill">
              <span>E-Way Bill Number:</span>
              <span class="invoice-value eway-number">${booking.eway_bill_number}</span>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}
        
        <div class="lr-section billing-section">
          <div class="billing-info">
            <h4>BILLING DETAILS</h4>
            <div class="billing-row">
              <span>Payment Type:</span>
              <span class="billing-value">${booking.payment_type?.toUpperCase() || 'N/A'}</span>
            </div>
            <div class="billing-row">
              <span>Freight Charges:</span>
              <span class="billing-value">₹${(booking.freight_per_qty * booking.quantity) || 'N/A'}</span>
            </div>
            <div class="billing-row">
              <span>Loading Charges:</span>
              <span class="billing-value">₹${booking.loading_charges || '0'}</span>
            </div>
            <div class="billing-row">
              <span>Unloading Charges:</span>
              <span class="billing-value">₹${booking.unloading_charges || '0'}</span>
            </div>
            ${booking.insurance_charge ? `
            <div class="billing-row">
              <span>Insurance Charges:</span>
              <span class="billing-value">₹${booking.insurance_charge}</span>
            </div>
            ` : ''}
            ${booking.packaging_charge ? `
            <div class="billing-row">
              <span>Packaging Charges:</span>
              <span class="billing-value">₹${booking.packaging_charge}</span>
            </div>
            ` : ''}
            <div class="billing-row total">
              <span>Total Amount:</span>
              <span class="billing-value">₹${booking.total_amount || 'N/A'}</span>
            </div>
          </div>
          <div class="status-info">
            <h4>STATUS</h4>
            <p class="status-badge ${booking.status}">${booking.status?.replace('_', ' ').toUpperCase() || 'N/A'}</p>
            <p class="delivery-date">Expected Delivery: ${booking.expected_delivery_date ? formatDate(booking.expected_delivery_date) : 'TBD'}</p>
          </div>
        </div>
        
        <div class="lr-section notes-section">
          <h4>SPECIAL INSTRUCTIONS</h4>
          <p>${booking.special_instructions || 'None'}</p>
          ${booking.reference_number ? `<p><strong>Reference Number:</strong> ${booking.reference_number}</p>` : ''}
        </div>
        
        <div class="lr-signatures">
          <div class="signature-box">
            <div class="signature-line"></div>
            <p class="signature-label">Sender's Signature</p>
            <p class="signature-date">Date: ___________</p>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <p class="signature-label">Receiver's Signature</p>
            <p class="signature-date">Date: ___________</p>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <p class="signature-label">Authorized Signature</p>
            <p class="signature-date">Transport Company</p>
          </div>
        </div>
      </div>
    </div>
  `;

  const customerCopy = `
    <div class="lr-copy customer-copy">
      <div class="copy-header">
        <h3>CUSTOMER COPY</h3>
      </div>
      <div class="lr-header">
        <div class="company-info">
          <h2>TRANSPORT SERVICES</h2>
          <p>Goods Transport & Logistics</p>
        </div>
        <div class="lr-number">
          <h3>LR #${booking.lr_number}</h3>
          <p>Date: ${formatDate(booking.created_at)}</p>
          <p>Time: ${formatTime(booking.created_at)}</p>
        </div>
      </div>
      
      <div class="lr-content">
        <div class="lr-section route-section">
          <div class="route-info">
            <div class="route-point">
              <h4>FROM</h4>
              <p class="location-name">${booking.from_branch_details?.name || 'N/A'}</p>
              <p class="location-address">${booking.from_branch_details?.city || 'N/A'}, ${booking.from_branch_details?.state || 'N/A'}</p>
              <p class="location-code">Branch Code: ${booking.from_branch_details?.code || 'N/A'}</p>
            </div>
            <div class="route-arrow">→</div>
            <div class="route-point">
              <h4>TO</h4>
              <p class="location-name">${booking.to_branch_details?.name || 'N/A'}</p>
              <p class="location-address">${booking.to_branch_details?.city || 'N/A'}, ${booking.to_branch_details?.state || 'N/A'}</p>
              <p class="location-code">Branch Code: ${booking.to_branch_details?.code || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <div class="lr-section parties-section">
          <div class="party-info">
            <h4>SENDER DETAILS</h4>
            <p class="party-name">${booking.sender?.name || 'N/A'}</p>
            <p class="party-contact">Mobile: ${booking.sender?.mobile || 'N/A'}</p>
            <p class="party-address">${booking.sender?.address || 'N/A'}</p>
            ${booking.sender?.gst ? `<p class="party-gst">GST: ${booking.sender.gst}</p>` : ''}
          </div>
          <div class="party-info">
            <h4>RECEIVER DETAILS</h4>
            <p class="party-name">${booking.receiver?.name || 'N/A'}</p>
            <p class="party-contact">Mobile: ${booking.receiver?.mobile || 'N/A'}</p>
            <p class="party-address">${booking.receiver?.address || 'N/A'}</p>
            ${booking.receiver?.gst ? `<p class="party-gst">GST: ${booking.receiver.gst}</p>` : ''}
          </div>
        </div>
        
        <div class="lr-section articles-section">
          <h4>ARTICLE DETAILS</h4>
          <table class="articles-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Weight</th>
                <th>Rate</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${booking.article?.name || 'General Cargo'}</td>
                <td>${booking.description || '-'}</td>
                <td>${booking.quantity} ${booking.uom}</td>
                <td>${booking.actual_weight || booking.charged_weight || 'N/A'} kg</td>
                <td>₹${booking.freight_per_qty || 'N/A'}</td>
                <td>₹${booking.declared_value || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${booking.has_invoice ? `
        <div class="lr-section invoice-section">
          <h4>INVOICE DETAILS</h4>
          <div class="invoice-info">
            <div class="invoice-row">
              <span>Invoice Number:</span>
              <span class="invoice-value">${booking.invoice_number || 'N/A'}</span>
            </div>
            <div class="invoice-row">
              <span>Invoice Date:</span>
              <span class="invoice-value">${booking.invoice_date ? formatDate(booking.invoice_date) : 'N/A'}</span>
            </div>
            <div class="invoice-row">
              <span>Invoice Amount:</span>
              <span class="invoice-value">₹${booking.invoice_amount || 'N/A'}</span>
            </div>
            ${booking.eway_bill_number ? `
            <div class="invoice-row eway-bill">
              <span>E-Way Bill Number:</span>
              <span class="invoice-value eway-number">${booking.eway_bill_number}</span>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}
        
        <div class="lr-section billing-section">
          <div class="billing-info">
            <h4>BILLING DETAILS</h4>
            <div class="billing-row">
              <span>Payment Type:</span>
              <span class="billing-value">${booking.payment_type?.toUpperCase() || 'N/A'}</span>
            </div>
            <div class="billing-row">
              <span>Freight Charges:</span>
              <span class="billing-value">₹${(booking.freight_per_qty * booking.quantity) || 'N/A'}</span>
            </div>
            <div class="billing-row">
              <span>Loading Charges:</span>
              <span class="billing-value">₹${booking.loading_charges || '0'}</span>
            </div>
            <div class="billing-row">
              <span>Unloading Charges:</span>
              <span class="billing-value">₹${booking.unloading_charges || '0'}</span>
            </div>
            ${booking.insurance_charge ? `
            <div class="billing-row">
              <span>Insurance Charges:</span>
              <span class="billing-value">₹${booking.insurance_charge}</span>
            </div>
            ` : ''}
            ${booking.packaging_charge ? `
            <div class="billing-row">
              <span>Packaging Charges:</span>
              <span class="billing-value">₹${booking.packaging_charge}</span>
            </div>
            ` : ''}
            <div class="billing-row total">
              <span>Total Amount:</span>
              <span class="billing-value">₹${booking.total_amount || 'N/A'}</span>
            </div>
          </div>
          <div class="status-info">
            <h4>STATUS</h4>
            <p class="status-badge ${booking.status}">${booking.status?.replace('_', ' ').toUpperCase() || 'N/A'}</p>
            <p class="delivery-date">Expected Delivery: ${booking.expected_delivery_date ? formatDate(booking.expected_delivery_date) : 'TBD'}</p>
          </div>
        </div>
        
        <div class="lr-section notes-section">
          <h4>SPECIAL INSTRUCTIONS</h4>
          <p>${booking.special_instructions || 'None'}</p>
          ${booking.reference_number ? `<p><strong>Reference Number:</strong> ${booking.reference_number}</p>` : ''}
        </div>
        
        <div class="lr-signatures">
          <div class="signature-box">
            <div class="signature-line"></div>
            <p class="signature-label">Sender's Signature</p>
            <p class="signature-date">Date: ___________</p>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <p class="signature-label">Receiver's Signature</p>
            <p class="signature-date">Date: ___________</p>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <p class="signature-label">Authorized Signature</p>
            <p class="signature-date">Transport Company</p>
          </div>
        </div>
      </div>
    </div>
  `;

  return `
    <div class="lr-container">
      ${officeCopy}
      <div class="page-break"></div>
      ${customerCopy}
    </div>
  `;
}

export function printBookings(bookings: Booking[]) {
  const style = `
    <style>
      @media print {
        @page { 
          size: A5 portrait; 
          margin: 5mm; 
        }
        body { font-family: Arial, sans-serif; }
        .page-break { page-break-before: always; }
      }
      
      .lr-container {
        width: 100%;
        max-width: 148mm;
        margin: 0 auto;
      }
      
      .lr-copy { 
        width: 100%; 
        border: 1px solid #000; 
        padding: 4mm; 
        box-sizing: border-box; 
        font-family: Arial, sans-serif; 
        background: white;
        margin-bottom: 5mm;
      }
      
      .copy-header {
        text-align: center;
        margin-bottom: 3mm;
        padding: 2mm;
        background: #f0f0f0;
        border: 1px solid #ccc;
      }
      
      .copy-header h3 {
        margin: 0;
        font-size: 12pt;
        font-weight: bold;
        color: #333;
      }
      
      .office-copy .copy-header {
        background: #e3f2fd;
        color: #1565c0;
      }
      
      .customer-copy .copy-header {
        background: #f3e5f5;
        color: #7b1fa2;
      }
      
      .lr-header { 
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #000; 
        padding-bottom: 3mm; 
        margin-bottom: 4mm;
        background: #f8f9fa;
        padding: 3mm;
        margin: 0 -4mm 4mm -4mm;
      }
      
      .company-info h2 {
        margin: 0;
        font-size: 14pt;
        color: #1a365d;
        font-weight: bold;
      }
      
      .company-info p {
        margin: 1mm 0 0 0;
        font-size: 9pt;
        color: #666;
      }
      
      .lr-number h3 { 
        margin: 0;
        font-size: 12pt;
        color: #e53e3e;
        font-weight: bold;
        text-align: right;
      }
      
      .lr-number p { 
        margin: 1mm 0 0 0;
        font-size: 8pt;
        color: #666;
        text-align: right;
      }
      
      .lr-content { 
        font-size: 9pt; 
      }
      
      .lr-section { 
        margin-bottom: 3mm; 
        border-bottom: 1px solid #e2e8f0; 
        padding-bottom: 2mm; 
      }
      
      .lr-section:last-child { 
        border-bottom: none; 
      }
      
      .lr-section h4 { 
        margin: 0 0 2mm 0; 
        font-size: 10pt;
        color: #2d3748;
        font-weight: bold;
      }
      
      .route-section {
        background: #f7fafc;
        padding: 2mm;
        margin: 0 -4mm 3mm -4mm;
        border-radius: 2mm;
      }
      
      .route-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .route-point {
        flex: 1;
        text-align: center;
      }
      
      .route-arrow {
        font-size: 14pt;
        color: #4299e1;
        font-weight: bold;
        margin: 0 2mm;
      }
      
      .location-name {
        font-weight: bold;
        color: #1a365d;
        margin: 1mm 0;
        font-size: 10pt;
      }
      
      .location-address {
        color: #666;
        margin: 0.5mm 0;
        font-size: 8pt;
      }
      
      .location-code {
        font-size: 7pt;
        color: #999;
        margin: 0.5mm 0;
      }
      
      .parties-section {
        display: flex;
        gap: 3mm;
      }
      
      .party-info {
        flex: 1;
        background: #f7fafc;
        padding: 2mm;
        border-radius: 2mm;
      }
      
      .party-name {
        font-weight: bold;
        color: #1a365d;
        margin: 1mm 0;
        font-size: 10pt;
      }
      
      .party-contact, .party-address, .party-gst {
        color: #666;
        margin: 0.5mm 0;
        font-size: 8pt;
      }
      
      .articles-table { 
        width: 100%; 
        border-collapse: collapse; 
        margin-top: 3mm; 
      }
      
      .articles-table th, .articles-table td { 
        border: 1px solid #e2e8f0; 
        padding: 2mm; 
        font-size: 8pt; 
        text-align: left;
      }
      
      .articles-table th { 
        background-color: #edf2f7; 
        font-weight: bold;
        color: #2d3748;
      }
      
      .invoice-section {
        background: #fff5e6;
        padding: 3mm;
        border-radius: 2mm;
        border-left: 3px solid #ff8c00;
        margin: 0 -4mm 3mm -4mm;
      }
      
      .invoice-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1mm;
      }
      
      .invoice-row {
        display: flex;
        justify-content: space-between;
        margin: 0.5mm 0;
        padding: 1mm;
        border-bottom: 1px dotted #e2e8f0;
        font-size: 8pt;
      }
      
      .invoice-value {
        font-weight: bold;
        color: #1a365d;
      }
      
      .invoice-row.eway-bill {
        background: #ffeb3b;
        padding: 2mm;
        border-radius: 1mm;
        border-bottom: none;
        font-size: 9pt;
      }
      
      .eway-number {
        color: #d84315;
        font-size: 10pt;
      }
      
      .billing-section {
        display: flex;
        gap: 3mm;
      }
      
      .billing-info {
        flex: 2;
      }
      
      .billing-row {
        display: flex;
        justify-content: space-between;
        margin: 0.5mm 0;
        padding: 1mm;
        border-bottom: 1px dotted #e2e8f0;
        font-size: 8pt;
      }
      
      .billing-row.total {
        font-weight: bold;
        background: #f7fafc;
        padding: 2mm;
        border-radius: 2mm;
        border: 1px solid #e2e8f0;
        font-size: 10pt;
      }
      
      .billing-value {
        font-weight: bold;
        color: #1a365d;
      }
      
      .status-info {
        flex: 1;
        text-align: center;
      }
      
      .status-badge {
        display: inline-block;
        padding: 2mm 3mm;
        border-radius: 2mm;
        font-weight: bold;
        font-size: 8pt;
        color: white;
        background: #4299e1;
      }
      
      .status-badge.delivered {
        background: #38a169;
      }
      
      .status-badge.in_transit {
        background: #ed8936;
      }
      
      .status-badge.pending {
        background: #e53e3e;
      }
      
      .delivery-date {
        font-size: 8pt;
        color: #666;
        margin-top: 2mm;
      }
      
      .notes-section {
        background: #fffbf0;
        padding: 2mm;
        border-radius: 2mm;
        border-left: 2px solid #ed8936;
      }
      
      .lr-signatures { 
        display: flex; 
        justify-content: space-between; 
        margin-top: 4mm; 
        gap: 2mm;
      }
      
      .signature-box { 
        flex: 1;
        text-align: center;
        border: 1px solid #e2e8f0;
        padding: 2mm;
        border-radius: 2mm;
        background: #f7fafc;
      }
      
      .signature-line { 
        border-top: 1px solid #000; 
        height: 8mm;
        margin-bottom: 2mm;
      }
      
      .signature-label {
        font-size: 8pt;
        font-weight: bold;
        color: #2d3748;
        margin: 0;
      }
      
      .signature-date {
        font-size: 7pt;
        color: #666;
        margin: 1mm 0 0 0;
      }
    </style>
  `;

  const html = style + bookings.map(generateLRHtml).join('');
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
}

export function downloadBookingLR(booking: Booking) {
  const style = `
    <style>
      @media print {
        @page { 
          size: A5 portrait; 
          margin: 5mm; 
        }
        body { font-family: Arial, sans-serif; }
        .page-break { page-break-before: always; }
      }
      
      .lr-container {
        width: 100%;
        max-width: 148mm;
        margin: 0 auto;
      }
      
      .lr-copy { 
        width: 100%; 
        border: 1px solid #000; 
        padding: 4mm; 
        box-sizing: border-box; 
        font-family: Arial, sans-serif; 
        background: white;
        margin-bottom: 5mm;
      }
      
      .copy-header {
        text-align: center;
        margin-bottom: 3mm;
        padding: 2mm;
        background: #f0f0f0;
        border: 1px solid #ccc;
      }
      
      .copy-header h3 {
        margin: 0;
        font-size: 12pt;
        font-weight: bold;
        color: #333;
      }
      
      .office-copy .copy-header {
        background: #e3f2fd;
        color: #1565c0;
      }
      
      .customer-copy .copy-header {
        background: #f3e5f5;
        color: #7b1fa2;
      }
      
      .lr-header { 
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #000; 
        padding-bottom: 3mm; 
        margin-bottom: 4mm;
        background: #f8f9fa;
        padding: 3mm;
        margin: 0 -4mm 4mm -4mm;
      }
      
      .company-info h2 {
        margin: 0;
        font-size: 14pt;
        color: #1a365d;
        font-weight: bold;
      }
      
      .company-info p {
        margin: 1mm 0 0 0;
        font-size: 9pt;
        color: #666;
      }
      
      .lr-number h3 { 
        margin: 0;
        font-size: 12pt;
        color: #e53e3e;
        font-weight: bold;
        text-align: right;
      }
      
      .lr-number p { 
        margin: 1mm 0 0 0;
        font-size: 8pt;
        color: #666;
        text-align: right;
      }
      
      .lr-content { 
        font-size: 9pt; 
      }
      
      .lr-section { 
        margin-bottom: 3mm; 
        border-bottom: 1px solid #e2e8f0; 
        padding-bottom: 2mm; 
      }
      
      .lr-section:last-child { 
        border-bottom: none; 
      }
      
      .lr-section h4 { 
        margin: 0 0 2mm 0; 
        font-size: 10pt;
        color: #2d3748;
        font-weight: bold;
      }
      
      .route-section {
        background: #f7fafc;
        padding: 2mm;
        margin: 0 -4mm 3mm -4mm;
        border-radius: 2mm;
      }
      
      .route-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .route-point {
        flex: 1;
        text-align: center;
      }
      
      .route-arrow {
        font-size: 14pt;
        color: #4299e1;
        font-weight: bold;
        margin: 0 2mm;
      }
      
      .location-name {
        font-weight: bold;
        color: #1a365d;
        margin: 1mm 0;
        font-size: 10pt;
      }
      
      .location-address {
        color: #666;
        margin: 0.5mm 0;
        font-size: 8pt;
      }
      
      .location-code {
        font-size: 7pt;
        color: #999;
        margin: 0.5mm 0;
      }
      
      .parties-section {
        display: flex;
        gap: 3mm;
      }
      
      .party-info {
        flex: 1;
        background: #f7fafc;
        padding: 2mm;
        border-radius: 2mm;
      }
      
      .party-name {
        font-weight: bold;
        color: #1a365d;
        margin: 1mm 0;
        font-size: 10pt;
      }
      
      .party-contact, .party-address, .party-gst {
        color: #666;
        margin: 0.5mm 0;
        font-size: 8pt;
      }
      
      .articles-table { 
        width: 100%; 
        border-collapse: collapse; 
        margin-top: 3mm; 
      }
      
      .articles-table th, .articles-table td { 
        border: 1px solid #e2e8f0; 
        padding: 2mm; 
        font-size: 8pt; 
        text-align: left;
      }
      
      .articles-table th { 
        background-color: #edf2f7; 
        font-weight: bold;
        color: #2d3748;
      }
      
      .invoice-section {
        background: #fff5e6;
        padding: 3mm;
        border-radius: 2mm;
        border-left: 3px solid #ff8c00;
        margin: 0 -4mm 3mm -4mm;
      }
      
      .invoice-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1mm;
      }
      
      .invoice-row {
        display: flex;
        justify-content: space-between;
        margin: 0.5mm 0;
        padding: 1mm;
        border-bottom: 1px dotted #e2e8f0;
        font-size: 8pt;
      }
      
      .invoice-value {
        font-weight: bold;
        color: #1a365d;
      }
      
      .invoice-row.eway-bill {
        background: #ffeb3b;
        padding: 2mm;
        border-radius: 1mm;
        border-bottom: none;
        font-size: 9pt;
      }
      
      .eway-number {
        color: #d84315;
        font-size: 10pt;
      }
      
      .billing-section {
        display: flex;
        gap: 3mm;
      }
      
      .billing-info {
        flex: 2;
      }
      
      .billing-row {
        display: flex;
        justify-content: space-between;
        margin: 0.5mm 0;
        padding: 1mm;
        border-bottom: 1px dotted #e2e8f0;
        font-size: 8pt;
      }
      
      .billing-row.total {
        font-weight: bold;
        background: #f7fafc;
        padding: 2mm;
        border-radius: 2mm;
        border: 1px solid #e2e8f0;
        font-size: 10pt;
      }
      
      .billing-value {
        font-weight: bold;
        color: #1a365d;
      }
      
      .status-info {
        flex: 1;
        text-align: center;
      }
      
      .status-badge {
        display: inline-block;
        padding: 2mm 3mm;
        border-radius: 2mm;
        font-weight: bold;
        font-size: 8pt;
        color: white;
        background: #4299e1;
      }
      
      .status-badge.delivered {
        background: #38a169;
      }
      
      .status-badge.in_transit {
        background: #ed8936;
      }
      
      .status-badge.pending {
        background: #e53e3e;
      }
      
      .delivery-date {
        font-size: 8pt;
        color: #666;
        margin-top: 2mm;
      }
      
      .notes-section {
        background: #fffbf0;
        padding: 2mm;
        border-radius: 2mm;
        border-left: 2px solid #ed8936;
      }
      
      .lr-signatures { 
        display: flex; 
        justify-content: space-between; 
        margin-top: 4mm; 
        gap: 2mm;
      }
      
      .signature-box { 
        flex: 1;
        text-align: center;
        border: 1px solid #e2e8f0;
        padding: 2mm;
        border-radius: 2mm;
        background: #f7fafc;
      }
      
      .signature-line { 
        border-top: 1px solid #000; 
        height: 8mm;
        margin-bottom: 2mm;
      }
      
      .signature-label {
        font-size: 8pt;
        font-weight: bold;
        color: #2d3748;
        margin: 0;
      }
      
      .signature-date {
        font-size: 7pt;
        color: #666;
        margin: 1mm 0 0 0;
      }
    </style>
  `;

  const html = `<!DOCTYPE html><html><head><title>LR-${booking.lr_number}</title></head><body>${style}${generateLRHtml(booking)}</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `LR-${booking.lr_number}.html`;
  link.click();
  URL.revokeObjectURL(url);
}

export function generatePaymentReceiptHtml(payment: Payment, branchInfo?: any): string {
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const convertAmountToWords = (amount: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertLessThanThousand = (num: number): string => {
      if (num === 0) return '';
      
      let result = '';
      
      if (num >= 100) {
        result += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
      }
      
      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      }
      
      if (num >= 10) {
        result += teens[num - 10] + ' ';
        return result;
      }
      
      if (num > 0) {
        result += ones[num] + ' ';
      }
      
      return result;
    };

    if (amount === 0) return 'Zero Rupees Only';

    let rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);

    let result = '';

    if (rupees >= 10000000) {
      result += convertLessThanThousand(Math.floor(rupees / 10000000)) + 'Crore ';
      rupees %= 10000000;
    }

    if (rupees >= 100000) {
      result += convertLessThanThousand(Math.floor(rupees / 100000)) + 'Lakh ';
      rupees %= 100000;
    }

    if (rupees >= 1000) {
      result += convertLessThanThousand(Math.floor(rupees / 1000)) + 'Thousand ';
      rupees %= 1000;
    }

    if (rupees > 0) {
      result += convertLessThanThousand(rupees);
    }

    result += 'Rupees';

    if (paise > 0) {
      result += ' and ' + convertLessThanThousand(paise) + 'Paise';
    }

    return result + ' Only';
  };

  return `
    <div class="receipt-container">
      <div class="receipt-header">
        <div class="company-info">
          <h1>${branchInfo?.organization_name || 'DesiCargo Logistics'}</h1>
          <p>${branchInfo?.address || 'Logistics Management System'}</p>
          ${branchInfo?.contact_phone ? `<p>Phone: ${branchInfo.contact_phone}</p>` : ''}
          ${branchInfo?.email ? `<p>Email: ${branchInfo.email}</p>` : ''}
        </div>
        <div class="receipt-title">
          <h2>PAYMENT RECEIPT</h2>
        </div>
      </div>
      
      <div class="receipt-info">
        <div class="info-section">
          <h3>Receipt Information</h3>
          <p><strong>Receipt No:</strong> ${payment.receipt_number || payment.payment_number}</p>
          <p><strong>Payment No:</strong> ${payment.payment_number}</p>
          <p><strong>Date:</strong> ${formatDate(payment.payment_date)}</p>
          <p><strong>Status:</strong> <span class="status ${payment.status}">${payment.status.toUpperCase()}</span></p>
        </div>
        
        <div class="info-section">
          <h3>Received From</h3>
          <p><strong>Name:</strong> ${payment.payer_name}</p>
          <p><strong>Type:</strong> ${payment.payer_type.charAt(0).toUpperCase() + payment.payer_type.slice(1)}</p>
          ${payment.purpose ? `<p><strong>Purpose:</strong> ${payment.purpose.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>` : ''}
        </div>
      </div>
      
      <div class="payment-details">
        <h3>Payment Details</h3>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Payment Mode</th>
              <th>Reference</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${payment.description || 'Payment received'}</td>
              <td>${payment.payment_mode || 'N/A'}</td>
              <td>${payment.payment_reference || '-'}</td>
              <td class="amount">₹${formatAmount(payment.amount)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      ${payment.bank_name ? `
      <div class="bank-details">
        <h3>Bank Details</h3>
        <div class="bank-info">
          ${payment.bank_name ? `<p><strong>Bank:</strong> ${payment.bank_name}</p>` : ''}
          ${payment.bank_branch ? `<p><strong>Branch:</strong> ${payment.bank_branch}</p>` : ''}
          ${payment.account_number ? `<p><strong>Account:</strong> ${payment.account_number}</p>` : ''}
          ${payment.ifsc_code ? `<p><strong>IFSC:</strong> ${payment.ifsc_code}</p>` : ''}
        </div>
      </div>
      ` : ''}
      
      <div class="amount-summary">
        <div class="total-amount">
          <span>Total Amount Received:</span>
          <span class="amount-value">₹${formatAmount(payment.amount)}</span>
        </div>
        <div class="amount-words">
          <strong>Amount in Words:</strong> ${convertAmountToWords(payment.amount)}
        </div>
      </div>
      
      <div class="terms">
        <h3>Terms & Conditions</h3>
        <ul>
          <li>This is a computer generated receipt and does not require signature.</li>
          <li>All disputes are subject to local jurisdiction.</li>
          <li>Payment once made will not be refunded unless specifically agreed upon.</li>
          <li>This receipt is valid for all legal purposes.</li>
        </ul>
      </div>
      
      <div class="receipt-footer">
        <p>Thank you for your payment!</p>
        <p>Generated on ${formatDate(new Date())} | System: DesiCargo Logistics Management</p>
      </div>
    </div>
  `;
}

export function printPaymentReceipt(payment: Payment, branchInfo?: any) {
  const style = `
    <style>
      @media print {
        @page { 
          size: A4 portrait; 
          margin: 10mm; 
        }
        body { 
          font-family: 'Arial', sans-serif; 
          margin: 0;
          padding: 0;
        }
      }
      
      body {
        font-family: 'Arial', sans-serif;
        line-height: 1.6;
        color: #333;
      }
      
      .receipt-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background: white;
      }
      
      .receipt-header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #e0e0e0;
      }
      
      .company-info h1 {
        margin: 0;
        font-size: 28px;
        color: #1a365d;
        font-weight: bold;
      }
      
      .company-info p {
        margin: 5px 0;
        color: #666;
        font-size: 14px;
      }
      
      .receipt-title h2 {
        margin: 20px 0 0 0;
        font-size: 24px;
        color: #2563eb;
        font-weight: bold;
      }
      
      .receipt-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
        gap: 30px;
      }
      
      .info-section {
        flex: 1;
        background: #f7fafc;
        padding: 15px;
        border-radius: 8px;
      }
      
      .info-section h3 {
        margin: 0 0 10px 0;
        font-size: 16px;
        color: #2d3748;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 5px;
      }
      
      .info-section p {
        margin: 5px 0;
        font-size: 14px;
      }
      
      .status {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
      }
      
      .status.cleared,
      .status.verified {
        background: #38a169;
        color: white;
      }
      
      .status.pending {
        background: #f59e0b;
        color: white;
      }
      
      .status.bounced,
      .status.cancelled {
        background: #ef4444;
        color: white;
      }
      
      .payment-details {
        margin-bottom: 30px;
      }
      
      .payment-details h3 {
        margin: 0 0 15px 0;
        font-size: 18px;
        color: #2d3748;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
      }
      
      th, td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
      }
      
      th {
        background: #f7fafc;
        font-weight: bold;
        color: #2d3748;
      }
      
      td.amount,
      th:last-child {
        text-align: right;
      }
      
      .bank-details {
        margin-bottom: 30px;
        background: #f7fafc;
        padding: 15px;
        border-radius: 8px;
      }
      
      .bank-details h3 {
        margin: 0 0 10px 0;
        font-size: 16px;
        color: #2d3748;
      }
      
      .bank-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      
      .bank-info p {
        margin: 5px 0;
        font-size: 14px;
      }
      
      .amount-summary {
        background: #eef2ff;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 30px;
        border: 2px solid #2563eb;
      }
      
      .total-amount {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        font-size: 20px;
        font-weight: bold;
      }
      
      .amount-value {
        color: #16a34a;
        font-size: 24px;
      }
      
      .amount-words {
        font-size: 14px;
        font-style: italic;
        color: #4b5563;
      }
      
      .terms {
        margin-bottom: 30px;
      }
      
      .terms h3 {
        margin: 0 0 10px 0;
        font-size: 16px;
        color: #2d3748;
      }
      
      .terms ul {
        margin: 0;
        padding-left: 20px;
      }
      
      .terms li {
        margin: 5px 0;
        font-size: 12px;
        color: #6b7280;
      }
      
      .receipt-footer {
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid #e0e0e0;
        margin-top: 30px;
        color: #6b7280;
        font-size: 12px;
      }
      
      .receipt-footer p {
        margin: 5px 0;
      }
    </style>
  `;

  const html = `<!DOCTYPE html>
    <html>
      <head>
        <title>Payment Receipt - ${payment.payment_number}</title>
        ${style}
      </head>
      <body>
        ${generatePaymentReceiptHtml(payment, branchInfo)}
      </body>
    </html>`;
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
}

export function generateDeliveryDocsHtml(booking: Booking): string {
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const deliveryChallan = `
    <div class="delivery-doc">
      <div class="doc-header">
        <h2>DELIVERY CHALLAN</h2>
        <p>LR #${booking.lr_number}</p>
      </div>
      
      <div class="delivery-info">
        <div class="delivery-section">
          <h3>DELIVERY DETAILS</h3>
          <div class="delivery-grid">
            <div class="delivery-item">
              <span class="label">LR Number:</span>
              <span class="value">${booking.lr_number}</span>
            </div>
            <div class="delivery-item">
              <span class="label">Delivery Date:</span>
              <span class="value">${formatDate(new Date())}</span>
            </div>
            <div class="delivery-item">
              <span class="label">Expected Delivery:</span>
              <span class="value">${booking.expected_delivery_date ? formatDate(booking.expected_delivery_date) : 'TBD'}</span>
            </div>
            <div class="delivery-item">
              <span class="label">Priority:</span>
              <span class="value">${booking.priority || 'Normal'}</span>
            </div>
          </div>
        </div>

        <div class="delivery-section">
          <h3>RECEIVER INFORMATION</h3>
          <div class="receiver-details">
            <p><strong>Name:</strong> ${booking.receiver?.name || 'N/A'}</p>
            <p><strong>Mobile:</strong> ${booking.receiver?.mobile || 'N/A'}</p>
            <p><strong>Address:</strong> ${booking.receiver?.address || 'N/A'}</p>
            ${booking.receiver?.gst ? `<p><strong>GST:</strong> ${booking.receiver.gst}</p>` : ''}
          </div>
        </div>

        <div class="delivery-section">
          <h3>ARTICLE SUMMARY</h3>
          <div class="article-summary">
            <p><strong>Total Articles:</strong> ${booking.booking_articles?.length || 1}</p>
            <p><strong>Total Weight:</strong> ${booking.booking_articles?.reduce((sum, article) => sum + article.actual_weight, 0) || booking.actual_weight || 'N/A'} kg</p>
            <p><strong>Payment Type:</strong> ${booking.payment_type}</p>
            <p><strong>Total Amount:</strong> ₹${booking.total_amount.toFixed(2)}</p>
          </div>
        </div>

        <div class="delivery-section">
          <h3>DELIVERY INSTRUCTIONS</h3>
          <div class="instructions">
            <p>${booking.special_instructions || 'Standard delivery instructions apply'}</p>
            <div class="checkboxes">
              <label><input type="checkbox"> Check all articles before acceptance</label>
              <label><input type="checkbox"> Verify payment amount (if To Pay)</label>
              <label><input type="checkbox"> Obtain receiver signature</label>
              <label><input type="checkbox"> Take photo proof of delivery</label>
            </div>
          </div>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <p>Delivery Person Signature</p>
            <p>Name: ________________</p>
            <p>Date: ${formatDate(new Date())}</p>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <p>Receiver Signature</p>
            <p>Name: ________________</p>
            <p>Date: ________________</p>
          </div>
        </div>
      </div>
    </div>
  `;

  const podForm = `
    <div class="delivery-doc pod-form">
      <div class="doc-header">
        <h2>PROOF OF DELIVERY FORM</h2>
        <p>LR #${booking.lr_number}</p>
      </div>
      
      <div class="pod-content">
        <div class="pod-section">
          <h3>DELIVERY CONFIRMATION</h3>
          <div class="form-grid">
            <div class="form-item">
              <label>Delivered To:</label>
              <input type="text" placeholder="Receiver Name" style="width: 200px; padding: 5px; border: 1px solid #ccc;">
            </div>
            <div class="form-item">
              <label>Delivery Date:</label>
              <input type="date" value="${new Date().toISOString().split('T')[0]}" style="padding: 5px; border: 1px solid #ccc;">
            </div>
            <div class="form-item">
              <label>Delivery Time:</label>
              <input type="time" value="${new Date().toTimeString().slice(0,5)}" style="padding: 5px; border: 1px solid #ccc;">
            </div>
            <div class="form-item">
              <label>Receiver Mobile:</label>
              <input type="text" placeholder="Mobile Number" style="width: 150px; padding: 5px; border: 1px solid #ccc;">
            </div>
          </div>
        </div>

        <div class="pod-section">
          <h3>ARTICLE CONDITION</h3>
          <div class="condition-grid">
            <div class="condition-item">
              <label><input type="radio" name="condition" value="good"> All articles in good condition</label>
            </div>
            <div class="condition-item">
              <label><input type="radio" name="condition" value="damaged"> Some articles damaged</label>
            </div>
            <div class="condition-item">
              <label><input type="radio" name="condition" value="missing"> Some articles missing</label>
            </div>
          </div>
          
          <div class="remarks-section">
            <label>Remarks/Damage Details:</label>
            <textarea placeholder="Describe any damage or missing items..." style="width: 100%; height: 60px; padding: 5px; border: 1px solid #ccc; margin-top: 5px;"></textarea>
          </div>
        </div>

        ${booking.payment_type === 'To Pay' ? `
        <div class="pod-section">
          <h3>PAYMENT CONFIRMATION</h3>
          <div class="payment-grid">
            <div class="payment-item">
              <label>Amount Due:</label>
              <span class="amount-due">₹${booking.total_amount.toFixed(2)}</span>
            </div>
            <div class="payment-item">
              <label>Amount Received:</label>
              <input type="number" placeholder="0.00" style="width: 120px; padding: 5px; border: 1px solid #ccc;">
            </div>
            <div class="payment-item">
              <label>Payment Mode:</label>
              <select style="padding: 5px; border: 1px solid #ccc;">
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Cheque</option>
              </select>
            </div>
            <div class="payment-item">
              <label>Reference:</label>
              <input type="text" placeholder="Transaction ID / Cheque No." style="width: 200px; padding: 5px; border: 1px solid #ccc;">
            </div>
          </div>
        </div>
        ` : ''}

        <div class="signature-section large">
          <div class="signature-box">
            <div class="signature-line large"></div>
            <p><strong>Receiver Signature</strong></p>
            <p>Name: ________________________</p>
            <p>Date: ________________________</p>
            <p>Relationship: _________________</p>
          </div>
          <div class="signature-box">
            <div class="signature-line large"></div>
            <p><strong>Delivery Person Signature</strong></p>
            <p>Name: ________________________</p>
            <p>Date: ________________________</p>
            <p>Employee ID: __________________</p>
          </div>
        </div>

        <div class="pod-footer">
          <p><strong>Important:</strong> This document serves as proof of delivery. Please ensure all details are accurate and complete.</p>
          <p>For any queries, contact: Customer Service - 1800-XXX-XXXX</p>
        </div>
      </div>
    </div>
  `;

  return `
    <div class="delivery-docs-container">
      ${deliveryChallan}
      <div class="page-break"></div>
      ${podForm}
    </div>
  `;
}

export function printDeliveryDocs(booking: Booking) {
  const style = `
    <style>
      @media print {
        @page { 
          size: A4 portrait; 
          margin: 10mm; 
        }
        body { font-family: Arial, sans-serif; }
        .page-break { page-break-before: always; }
      }
      
      .delivery-docs-container {
        font-family: Arial, sans-serif;
        max-width: 210mm;
        margin: 0 auto;
      }
      
      .delivery-doc {
        background: white;
        padding: 20px;
        margin-bottom: 20px;
      }
      
      .doc-header {
        text-align: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #000;
        padding-bottom: 10px;
      }
      
      .doc-header h2 {
        margin: 0;
        font-size: 24px;
        color: #1a365d;
      }
      
      .doc-header p {
        margin: 5px 0 0 0;
        font-size: 14px;
        color: #666;
      }
      
      .delivery-section {
        margin-bottom: 20px;
        border: 1px solid #e0e0e0;
        padding: 15px;
        border-radius: 5px;
      }
      
      .delivery-section h3 {
        margin: 0 0 10px 0;
        font-size: 16px;
        color: #2d3748;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 5px;
      }
      
      .delivery-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      
      .delivery-item {
        display: flex;
        justify-content: space-between;
        padding: 5px 0;
        border-bottom: 1px dotted #ccc;
      }
      
      .label {
        font-weight: bold;
        color: #4a5568;
      }
      
      .value {
        color: #2d3748;
      }
      
      .receiver-details p,
      .article-summary p {
        margin: 8px 0;
        font-size: 14px;
      }
      
      .instructions p {
        margin: 10px 0;
        font-size: 14px;
      }
      
      .checkboxes {
        margin-top: 15px;
      }
      
      .checkboxes label {
        display: block;
        margin: 8px 0;
        font-size: 13px;
      }
      
      .checkboxes input[type="checkbox"] {
        margin-right: 8px;
      }
      
      .signature-section {
        display: flex;
        justify-content: space-between;
        margin-top: 30px;
        gap: 20px;
      }
      
      .signature-section.large {
        margin-top: 40px;
      }
      
      .signature-box {
        flex: 1;
        text-align: center;
        border: 1px solid #e0e0e0;
        padding: 15px;
        border-radius: 5px;
      }
      
      .signature-line {
        border-top: 1px solid #000;
        height: 30px;
        margin-bottom: 10px;
      }
      
      .signature-line.large {
        height: 50px;
      }
      
      .signature-box p {
        margin: 5px 0;
        font-size: 12px;
      }
      
      .pod-section {
        margin-bottom: 25px;
        border: 1px solid #e0e0e0;
        padding: 15px;
        border-radius: 5px;
      }
      
      .pod-section h3 {
        margin: 0 0 15px 0;
        font-size: 16px;
        color: #2d3748;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 5px;
      }
      
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }
      
      .form-item {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      
      .form-item label {
        font-weight: bold;
        font-size: 13px;
        color: #4a5568;
      }
      
      .condition-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 15px;
      }
      
      .condition-item label {
        display: flex;
        align-items: center;
        font-size: 14px;
        cursor: pointer;
      }
      
      .condition-item input[type="radio"] {
        margin-right: 8px;
      }
      
      .remarks-section {
        margin-top: 15px;
      }
      
      .remarks-section label {
        font-weight: bold;
        font-size: 13px;
        color: #4a5568;
      }
      
      .payment-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }
      
      .payment-item {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .payment-item label {
        font-weight: bold;
        font-size: 13px;
        color: #4a5568;
        min-width: 120px;
      }
      
      .amount-due {
        font-weight: bold;
        font-size: 16px;
        color: #16a34a;
      }
      
      .pod-footer {
        margin-top: 30px;
        padding: 15px;
        background: #f7fafc;
        border-radius: 5px;
        text-align: center;
      }
      
      .pod-footer p {
        margin: 5px 0;
        font-size: 12px;
        color: #4a5568;
      }
    </style>
  `;

  const html = style + generateDeliveryDocsHtml(booking);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Delivery Documents - ${booking.lr_number}</title>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    
    // Print after content is loaded
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}

export function downloadPaymentReceipt(payment: Payment, branchInfo?: any) {
  const style = `
    <style>
      body {
        font-family: 'Arial', sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 20px;
      }
      
      .receipt-container {
        max-width: 800px;
        margin: 0 auto;
        background: white;
      }
      
      .receipt-header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #e0e0e0;
      }
      
      .company-info h1 {
        margin: 0;
        font-size: 28px;
        color: #1a365d;
        font-weight: bold;
      }
      
      .company-info p {
        margin: 5px 0;
        color: #666;
        font-size: 14px;
      }
      
      .receipt-title h2 {
        margin: 20px 0 0 0;
        font-size: 24px;
        color: #2563eb;
        font-weight: bold;
      }
      
      .receipt-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
        gap: 30px;
      }
      
      .info-section {
        flex: 1;
        background: #f7fafc;
        padding: 15px;
        border-radius: 8px;
      }
      
      .info-section h3 {
        margin: 0 0 10px 0;
        font-size: 16px;
        color: #2d3748;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 5px;
      }
      
      .info-section p {
        margin: 5px 0;
        font-size: 14px;
      }
      
      .status {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
      }
      
      .status.cleared,
      .status.verified {
        background: #38a169;
        color: white;
      }
      
      .status.pending {
        background: #f59e0b;
        color: white;
      }
      
      .status.bounced,
      .status.cancelled {
        background: #ef4444;
        color: white;
      }
      
      .payment-details {
        margin-bottom: 30px;
      }
      
      .payment-details h3 {
        margin: 0 0 15px 0;
        font-size: 18px;
        color: #2d3748;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
      }
      
      th, td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
      }
      
      th {
        background: #f7fafc;
        font-weight: bold;
        color: #2d3748;
      }
      
      td.amount,
      th:last-child {
        text-align: right;
      }
      
      .bank-details {
        margin-bottom: 30px;
        background: #f7fafc;
        padding: 15px;
        border-radius: 8px;
      }
      
      .bank-details h3 {
        margin: 0 0 10px 0;
        font-size: 16px;
        color: #2d3748;
      }
      
      .bank-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      
      .bank-info p {
        margin: 5px 0;
        font-size: 14px;
      }
      
      .amount-summary {
        background: #eef2ff;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 30px;
        border: 2px solid #2563eb;
      }
      
      .total-amount {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        font-size: 20px;
        font-weight: bold;
      }
      
      .amount-value {
        color: #16a34a;
        font-size: 24px;
      }
      
      .amount-words {
        font-size: 14px;
        font-style: italic;
        color: #4b5563;
      }
      
      .terms {
        margin-bottom: 30px;
      }
      
      .terms h3 {
        margin: 0 0 10px 0;
        font-size: 16px;
        color: #2d3748;
      }
      
      .terms ul {
        margin: 0;
        padding-left: 20px;
      }
      
      .terms li {
        margin: 5px 0;
        font-size: 12px;
        color: #6b7280;
      }
      
      .receipt-footer {
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid #e0e0e0;
        margin-top: 30px;
        color: #6b7280;
        font-size: 12px;
      }
      
      .receipt-footer p {
        margin: 5px 0;
      }
    </style>
  `;

  const html = `<!DOCTYPE html><html><head><title>Payment Receipt - ${payment.payment_number}</title>${style}</head><body>${generatePaymentReceiptHtml(payment, branchInfo)}</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Payment_Receipt_${payment.payment_number}.html`;
  link.click();
  URL.revokeObjectURL(url);
}