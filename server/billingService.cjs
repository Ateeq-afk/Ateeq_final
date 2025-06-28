const { bookings } = require('./ogplService.cjs');

function generateInvoiceForBooking(booking, gstRate = 0.18) {
  if (booking.status !== 'delivered') {
    throw new Error('Booking not completed');
  }
  if (typeof booking.amount !== 'number') {
    throw new Error('Booking amount missing');
  }
  const gst = Math.round(booking.amount * gstRate * 100) / 100;
  const total = Math.round((booking.amount + gst) * 100) / 100;
  return {
    invoiceNumber: `INV-${booking.id}`,
    bookingId: booking.id,
    baseAmount: booking.amount,
    gstAmount: gst,
    totalAmount: total,
  };
}

function generateRecurringInvoices(customerId, gstRate = 0.18) {
  const customerBookings = bookings.filter(
    b => b.customerId === customerId && b.status === 'delivered'
  );
  const grouped = {};
  for (const b of customerBookings) {
    if (!b.deliveredAt) continue;
    const key = b.deliveredAt.slice(0, 7); // YYYY-MM
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(b);
  }
  const invoices = [];
  let counter = 1;
  for (const [period, items] of Object.entries(grouped)) {
    const base = items.reduce((sum, b) => sum + (b.amount || 0), 0);
    const gst = Math.round(base * gstRate * 100) / 100;
    const total = Math.round((base + gst) * 100) / 100;
    invoices.push({
      invoiceNumber: `REC-${customerId}-${period}-${counter}`,
      customerId,
      period,
      baseAmount: base,
      gstAmount: gst,
      totalAmount: total,
      bookings: items.map(b => b.id),
    });
    counter += 1;
  }
  return invoices;
}

module.exports = {
  generateInvoiceForBooking,
  generateRecurringInvoices,
};
