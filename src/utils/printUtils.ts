import type { Booking } from '../types';

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
            <div class="invoice-row">
              <span>E-Way Bill:</span>
              <span class="invoice-value">${booking.eway_bill_number}</span>
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
            <div class="invoice-row">
              <span>E-Way Bill:</span>
              <span class="invoice-value">${booking.eway_bill_number}</span>
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
        background: #fff8dc;
        padding: 2mm;
        border-radius: 2mm;
        border-left: 2px solid #ffa500;
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
        background: #fff8dc;
        padding: 2mm;
        border-radius: 2mm;
        border-left: 2px solid #ffa500;
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