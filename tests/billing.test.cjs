const assert = require('assert');
const {
  bookings,
  markDelivered,
  reset,
} = require('../server/ogplService.cjs');
const {
  generateInvoiceForBooking,
  generateRecurringInvoices,
} = require('../server/billingService.cjs');

reset();

bookings.push({ id: 1, status: 'booked', amount: 1000, customerId: 'C1' });
markDelivered(1);

const invoice = generateInvoiceForBooking(bookings[0]);
assert.strictEqual(invoice.totalAmount, 1180);

reset();

bookings.push(
  { id: 1, status: 'delivered', amount: 1000, customerId: 'C1', deliveredAt: '2024-01-10T00:00:00Z' },
  { id: 2, status: 'delivered', amount: 500, customerId: 'C1', deliveredAt: '2024-01-20T00:00:00Z' },
  { id: 3, status: 'delivered', amount: 800, customerId: 'C1', deliveredAt: '2024-02-05T00:00:00Z' }
);

const invoices = generateRecurringInvoices('C1');
assert.strictEqual(invoices.length, 2);
assert.strictEqual(invoices[0].period, '2024-01');
assert.strictEqual(invoices[0].totalAmount, 1770);
assert.strictEqual(invoices[1].period, '2024-02');
assert.strictEqual(invoices[1].totalAmount, 944);

console.log('Billing automation works');
