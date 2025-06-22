import React, { useState } from 'react';
import { CreditCard, Search, Filter, Download, Eye, Plus, Calendar, CheckCircle2, AlertCircle, Loader2, ArrowUpDown, Wallet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import type { Booking } from '@/types';
import PaymentDetails from './PaymentDetails';
import PaymentForm from './PaymentForm';

interface Props {
  bookings: Booking[];
}

interface Payment {
  id: string;
  date: string;
  amount: number;
  method: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque';
  reference: string;
  status: 'completed' | 'pending' | 'failed';
  invoice?: {
    id: string;
    invoiceNumber: string;
  };
  customer: {
    id: string;
    name: string;
  };
  notes?: string;
}

export default function PaymentsList({ bookings }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { showSuccess, showError } = useNotificationSystem();
  const itemsPerPage = 10;

  // Generate payments from bookings
  const payments: Payment[] = React.useMemo(() => {
    // Create payments for all "Paid" bookings and some "To Pay" bookings that are delivered
    const bookingPayments = bookings
      .filter(b => b.payment_type === 'Paid' || (b.payment_type === 'To Pay' && b.status === 'delivered' && Math.random() > 0.3))
      .map(booking => {
        const paymentDate = new Date(booking.created_at);
        if (booking.payment_type === 'To Pay' && booking.status === 'delivered') {
          // For "To Pay" bookings, payment date is after delivery
          paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 15) + 1);
        }
        
        const methods = ['Cash', 'Bank Transfer', 'UPI', 'Cheque'];
        const method = methods[Math.floor(Math.random() * methods.length)] as Payment['method'];
        
        let reference = '';
        if (method === 'Bank Transfer') {
          reference = `TXN${Math.floor(Math.random() * 1000000)}`;
        } else if (method === 'UPI') {
          reference = `UPI${Math.floor(Math.random() * 1000000)}`;
        } else if (method === 'Cheque') {
          reference = `CHQ${Math.floor(Math.random() * 10000)}`;
        }
        
        return {
          id: `payment-${booking.id}`,
          date: paymentDate.toISOString(),
          amount: booking.total_amount || 0,
          method,
          reference,
          status: 'completed',
          invoice: {
            id: `invoice-${booking.id}`,
            invoiceNumber: `INV-${booking.lr_number}`
          },
          customer: {
            id: booking.payment_type === 'Paid' ? booking.sender_id || '' : booking.receiver_id || '',
            name: booking.payment_type === 'Paid' ? booking.sender?.name || 'Unknown' : booking.receiver?.name || 'Unknown'
          },
          notes: `Payment for booking ${booking.lr_number}`
        };
      });
    
    // Add some random payments not tied to bookings
    const randomPayments: Payment[] = Array.from({ length: 5 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      const methods = ['Cash', 'Bank Transfer', 'UPI', 'Cheque'];
      const method = methods[Math.floor(Math.random() * methods.length)] as Payment['method'];
      
      let reference = '';
      if (method === 'Bank Transfer') {
        reference = `TXN${Math.floor(Math.random() * 1000000)}`;
      } else if (method === 'UPI') {
        reference = `UPI${Math.floor(Math.random() * 1000000)}`;
      } else if (method === 'Cheque') {
        reference = `CHQ${Math.floor(Math.random() * 10000)}`;
      }
      
      const statuses: Payment['status'][] = ['completed', 'pending', 'failed'];
      const status = statuses[Math.floor(Math.random() * (i === 0 ? 3 : 1))]; // Make most payments completed
      
      return {
        id: `random-payment-${i}`,
        date: date.toISOString(),
        amount: Math.floor(Math.random() * 10000) + 500,
        method,
        reference,
        status,
        customer: {
          id: `customer-${i}`,
          name: ['ABC Enterprises', 'XYZ Corporation', 'Global Logistics', 'City Transport', 'Metro Carriers'][Math.floor(Math.random() * 5)]
        },
        notes: 'Miscellaneous payment'
      };
    });
    
    return [...bookingPayments, ...randomPayments];
  }, [bookings]);

  // Filter and sort payments
  const filteredPayments = React.useMemo(() => {
    return payments.filter(payment => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        payment.customer.name.toLowerCase().includes(searchLower) ||
        (payment.invoice?.invoiceNumber.toLowerCase().includes(searchLower) || false) ||
        payment.reference.toLowerCase().includes(searchLower);
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      
      // Method filter
      const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
      
      // Date filter
      let matchesDate = true;
      const paymentDate = new Date(payment.date);
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const last3Months = new Date(today);
      last3Months.setMonth(last3Months.getMonth() - 3);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = paymentDate.toDateString() === today.toDateString();
          break;
        case 'last_week':
          matchesDate = paymentDate >= lastWeek;
          break;
        case 'last_month':
          matchesDate = paymentDate >= lastMonth;
          break;
        case 'last_3_months':
          matchesDate = paymentDate >= last3Months;
          break;
        default:
          matchesDate = true;
      }
      
      return matchesSearch && matchesStatus && matchesMethod && matchesDate;
    }).sort((a, b) => {
      // Sorting
      if (sortField === 'date') {
        return sortDirection === 'asc' 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortField === 'amount') {
        return sortDirection === 'asc'
          ? a.amount - b.amount
          : b.amount - a.amount;
      }
      return 0;
    });
  }, [payments, searchQuery, statusFilter, methodFilter, dateFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleCreatePayment = (data: any) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setShowCreateForm(false);
      showSuccess('Payment Recorded', 'Payment has been recorded successfully');
    }, 1500);
  };

  const getStatusBadge = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Calendar className="h-3 w-3" />
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3" />
            Failed
          </span>
        );
    }
  };

  const getMethodIcon = (method: Payment['method']) => {
    switch (method) {
      case 'Cash':
        return <Wallet className="h-4 w-4 text-green-500" />;
      case 'Bank Transfer':
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      case 'UPI':
        return <CreditCard className="h-4 w-4 text-purple-500" />;
      case 'Cheque':
        return <FileText className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Payments</h2>
          <p className="text-gray-600 mt-1">
            Track and manage all payment transactions
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)} 
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Record Payment
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="Cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last_week">Last 7 Days</SelectItem>
              <SelectItem value="last_month">Last 30 Days</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th 
                  className="text-left text-sm font-medium text-gray-600 px-6 py-4 cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date
                    {sortField === 'date' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Reference</th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Customer</th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Invoice</th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Method</th>
                <th 
                  className="text-right text-sm font-medium text-gray-600 px-6 py-4 cursor-pointer"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Amount
                    {sortField === 'amount' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Status</th>
                <th className="text-right text-sm font-medium text-gray-600 px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">
                      {payment.reference || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{payment.customer.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    {payment.invoice ? (
                      <span className="text-blue-600 hover:underline cursor-pointer">
                        {payment.invoice.invoiceNumber}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getMethodIcon(payment.method)}
                      <span>{payment.method}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-medium">₹{payment.amount.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedPayment(payment.id)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No payments found</h3>
                    <p className="text-gray-500 mt-1">
                      {searchQuery || statusFilter !== 'all' || methodFilter !== 'all' || dateFilter !== 'all'
                        ? 'Try adjusting your filters or search criteria'
                        : 'Record your first payment to get started'}
                    </p>
                    {!searchQuery && statusFilter === 'all' && methodFilter === 'all' && dateFilter === 'all' && (
                      <Button 
                        onClick={() => setShowCreateForm(true)} 
                        className="mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Record Payment
                      </Button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} payments
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="hidden md:inline-flex"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Details Dialog */}
      <Dialog 
        open={!!selectedPayment} 
        onOpenChange={(open) => {
          if (!open) setSelectedPayment(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <PaymentDetails 
              payment={payments.find(p => p.id === selectedPayment)!}
              onClose={() => setSelectedPayment(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Payment Dialog */}
      <Dialog 
        open={showCreateForm} 
        onOpenChange={setShowCreateForm}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <PaymentForm 
            onSubmit={handleCreatePayment}
            onCancel={() => setShowCreateForm(false)}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}