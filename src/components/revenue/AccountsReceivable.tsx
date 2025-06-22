import React, { useState } from 'react';
import { Wallet, Search, Filter, Download, Eye, Plus, Calendar, CheckCircle2, AlertCircle, Loader2, ArrowUpDown, CreditCard, FileText, Send, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import type { Booking } from '@/types';
import PaymentForm from './PaymentForm';

interface Props {
  bookings: Booking[];
}

interface Receivable {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customer: {
    id: string;
    name: string;
    email?: string;
  };
  amount: number;
  amountPaid: number;
  amountDue: number;
  status: 'current' | 'overdue' | 'partially_paid';
  daysOverdue: number;
}

export default function AccountsReceivable({ bookings }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [sortField, setSortField] = useState<'dueDate' | 'amount' | 'daysOverdue'>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReceivable, setSelectedReceivable] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null);
  const [showReminderDialog, setShowReminderDialog] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { showSuccess, showError } = useNotificationSystem();
  const itemsPerPage = 10;

  // Generate receivables from bookings
  const receivables: Receivable[] = React.useMemo(() => {
    // Create receivables for all "To Pay" bookings that are not cancelled
    return bookings
      .filter(b => b.payment_type === 'To Pay' && b.status !== 'cancelled')
      .map(booking => {
        const invoiceDate = new Date(booking.created_at);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms
        
        const now = new Date();
        const daysOverdue = dueDate < now ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        
        // Randomly assign some payments to simulate partially paid invoices
        const amountPaid = Math.random() > 0.7 ? booking.total_amount * (Math.random() * 0.7) : 0;
        const amountDue = booking.total_amount - amountPaid;
        
        // Determine status
        let status: Receivable['status'];
        if (amountPaid > 0 && amountDue > 0) {
          status = 'partially_paid';
        } else if (daysOverdue > 0) {
          status = 'overdue';
        } else {
          status = 'current';
        }
        
        return {
          id: `receivable-${booking.id}`,
          invoiceNumber: `INV-${booking.lr_number}`,
          date: invoiceDate.toISOString(),
          dueDate: dueDate.toISOString(),
          customer: {
            id: booking.receiver_id || '',
            name: booking.receiver?.name || 'Unknown',
            email: booking.receiver?.email
          },
          amount: booking.total_amount || 0,
          amountPaid,
          amountDue,
          status,
          daysOverdue
        };
      });
  }, [bookings]);

  // Filter and sort receivables
  const filteredReceivables = React.useMemo(() => {
    return receivables.filter(receivable => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        receivable.invoiceNumber.toLowerCase().includes(searchLower) ||
        receivable.customer.name.toLowerCase().includes(searchLower);
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || receivable.status === statusFilter;
      
      // Age filter
      let matchesAge = true;
      switch (ageFilter) {
        case 'current':
          matchesAge = receivable.daysOverdue === 0;
          break;
        case '1-30':
          matchesAge = receivable.daysOverdue > 0 && receivable.daysOverdue <= 30;
          break;
        case '31-60':
          matchesAge = receivable.daysOverdue > 30 && receivable.daysOverdue <= 60;
          break;
        case '61-90':
          matchesAge = receivable.daysOverdue > 60 && receivable.daysOverdue <= 90;
          break;
        case '90+':
          matchesAge = receivable.daysOverdue > 90;
          break;
        default:
          matchesAge = true;
      }
      
      return matchesSearch && matchesStatus && matchesAge;
    }).sort((a, b) => {
      // Sorting
      if (sortField === 'dueDate') {
        return sortDirection === 'asc' 
          ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      } else if (sortField === 'amount') {
        return sortDirection === 'asc'
          ? a.amountDue - b.amountDue
          : b.amountDue - a.amountDue;
      } else if (sortField === 'daysOverdue') {
        return sortDirection === 'asc'
          ? a.daysOverdue - b.daysOverdue
          : b.daysOverdue - a.daysOverdue;
      }
      return 0;
    });
  }, [receivables, searchQuery, statusFilter, ageFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredReceivables.length / itemsPerPage);
  const paginatedReceivables = filteredReceivables.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate totals
  const totals = React.useMemo(() => {
    const total = filteredReceivables.reduce((sum, r) => sum + r.amountDue, 0);
    const current = filteredReceivables.filter(r => r.status === 'current').reduce((sum, r) => sum + r.amountDue, 0);
    const overdue = filteredReceivables.filter(r => r.status === 'overdue').reduce((sum, r) => sum + r.amountDue, 0);
    const partiallyPaid = filteredReceivables.filter(r => r.status === 'partially_paid').reduce((sum, r) => sum + r.amountDue, 0);
    
    return { total, current, overdue, partiallyPaid };
  }, [filteredReceivables]);

  const handleSort = (field: 'dueDate' | 'amount' | 'daysOverdue') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRecordPayment = (data: any) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setShowPaymentForm(null);
      showSuccess('Payment Recorded', 'Payment has been recorded successfully');
    }, 1500);
  };

  const handleSendReminder = (id: string) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setShowReminderDialog(null);
      showSuccess('Reminder Sent', 'Payment reminder has been sent to the customer');
    }, 1500);
  };

  const getStatusBadge = (status: Receivable['status'], daysOverdue: number) => {
    switch (status) {
      case 'current':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3" />
            Current
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CreditCard className="h-3 w-3" />
            Partially Paid
          </span>
        );
      case 'overdue':
        let bgColor = 'bg-yellow-100 text-yellow-800';
        if (daysOverdue > 60) {
          bgColor = 'bg-red-100 text-red-800';
        } else if (daysOverdue > 30) {
          bgColor = 'bg-orange-100 text-orange-800';
        }
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
            <AlertCircle className="h-3 w-3" />
            Overdue {daysOverdue} days
          </span>
        );
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
          <h2 className="text-xl font-semibold text-gray-900">Accounts Receivable</h2>
          <p className="text-gray-600 mt-1">
            Track and manage outstanding customer payments
          </p>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => {}}
        >
          <Download className="h-4 w-4" />
          Export Aging Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Receivables</h3>
          <p className="text-2xl font-bold text-gray-900">₹{totals.total.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{filteredReceivables.length} open invoices</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Current</h3>
          <p className="text-2xl font-bold text-green-600">₹{totals.current.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {filteredReceivables.filter(r => r.status === 'current').length} invoices
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Overdue</h3>
          <p className="text-2xl font-bold text-red-600">₹{totals.overdue.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {filteredReceivables.filter(r => r.status === 'overdue').length} invoices
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Partially Paid</h3>
          <p className="text-2xl font-bold text-blue-600">₹{totals.partiallyPaid.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {filteredReceivables.filter(r => r.status === 'partially_paid').length} invoices
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search by invoice or customer..."
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
              <SelectItem value="current">Current</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
            </SelectContent>
          </Select>

          <Select value={ageFilter} onValueChange={setAgeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by age" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ages</SelectItem>
              <SelectItem value="current">Current</SelectItem>
              <SelectItem value="1-30">1-30 Days</SelectItem>
              <SelectItem value="31-60">31-60 Days</SelectItem>
              <SelectItem value="61-90">61-90 Days</SelectItem>
              <SelectItem value="90+">90+ Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Invoice #</th>
                <th 
                  className="text-left text-sm font-medium text-gray-600 px-6 py-4 cursor-pointer"
                  onClick={() => handleSort('dueDate')}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Due Date
                    {sortField === 'dueDate' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Customer</th>
                <th 
                  className="text-right text-sm font-medium text-gray-600 px-6 py-4 cursor-pointer"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Total
                    {sortField === 'amount' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="text-right text-sm font-medium text-gray-600 px-6 py-4">Paid</th>
                <th className="text-right text-sm font-medium text-gray-600 px-6 py-4">Due</th>
                <th 
                  className="text-left text-sm font-medium text-gray-600 px-6 py-4 cursor-pointer"
                  onClick={() => handleSort('daysOverdue')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {sortField === 'daysOverdue' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="text-right text-sm font-medium text-gray-600 px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedReceivables.map((receivable) => (
                <tr key={receivable.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span 
                      className="font-medium text-blue-600 cursor-pointer hover:underline"
                      onClick={() => setSelectedReceivable(receivable.id)}
                    >
                      {receivable.invoiceNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(receivable.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{receivable.customer.name}</div>
                    {receivable.customer.email && (
                      <div className="text-sm text-gray-500">{receivable.customer.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-medium">₹{receivable.amount.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-medium text-green-600">₹{receivable.amountPaid.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-medium text-red-600">₹{receivable.amountDue.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(receivable.status, receivable.daysOverdue)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowPaymentForm(receivable.id)}
                        className="flex items-center gap-1"
                      >
                        <Wallet className="h-4 w-4" />
                        <span className="hidden sm:inline">Record Payment</span>
                      </Button>
                      {(receivable.status === 'overdue' || receivable.daysOverdue > 25) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowReminderDialog(receivable.id)}
                          className="flex items-center gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        >
                          <Send className="h-4 w-4" />
                          <span className="hidden sm:inline">Send Reminder</span>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedReceivables.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No receivables found</h3>
                    <p className="text-gray-500 mt-1">
                      {searchQuery || statusFilter !== 'all' || ageFilter !== 'all'
                        ? 'Try adjusting your filters or search criteria'
                        : 'All your invoices have been paid'}
                    </p>
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredReceivables.length)} of {filteredReceivables.length} receivables
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

      {/* Record Payment Dialog */}
      <Dialog 
        open={!!showPaymentForm} 
        onOpenChange={(open) => {
          if (!open) setShowPaymentForm(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {showPaymentForm && (
            <PaymentForm 
              onSubmit={handleRecordPayment}
              onCancel={() => setShowPaymentForm(null)}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Send Reminder Dialog */}
      <Dialog 
        open={!!showReminderDialog} 
        onOpenChange={(open) => {
          if (!open) setShowReminderDialog(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
          </DialogHeader>
          {showReminderDialog && (
            <div className="py-4">
              <div className="flex items-center justify-center mb-4">
                <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <Send className="h-8 w-8 text-amber-600" />
                </div>
              </div>
              <p className="text-center text-gray-700 mb-4">
                Send a payment reminder to {receivables.find(r => r.id === showReminderDialog)?.customer.name}?
              </p>
              <div className="bg-amber-50 p-4 rounded-lg mb-4">
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Payment is overdue</p>
                    <p className="text-amber-700 text-sm">
                      Invoice {receivables.find(r => r.id === showReminderDialog)?.invoiceNumber} is overdue by {receivables.find(r => r.id === showReminderDialog)?.daysOverdue} days.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowReminderDialog(null)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-amber-600 hover:bg-amber-700"
                  onClick={() => showReminderDialog && handleSendReminder(showReminderDialog)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    'Send Reminder'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}