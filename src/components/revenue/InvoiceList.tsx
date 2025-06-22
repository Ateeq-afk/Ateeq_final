import React, { useState } from 'react';
import { FileText, Search, Filter, Download, Eye, Edit, Trash, Plus, Printer, Send, ArrowUpDown, Calendar, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import type { Booking } from '@/types';
import InvoiceDetails from './InvoiceDetails';
import InvoiceForm from './InvoiceForm';

interface Props {
  bookings: Booking[];
}

interface Invoice {
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
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  notes?: string;
  terms?: string;
}

export default function InvoiceList({ bookings }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'dueDate'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<string | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { showSuccess, showError } = useNotificationSystem();
  const itemsPerPage = 10;

  // Generate invoices from bookings
  const invoices: Invoice[] = React.useMemo(() => {
    // Create invoices for all "Paid" and "To Pay" bookings
    return bookings
      .filter(b => b.payment_type !== 'Quotation')
      .map(booking => {
        const invoiceDate = new Date(booking.created_at);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms
        
        // Determine status
        let status: Invoice['status'] = 'draft';
        if (booking.payment_type === 'Paid') {
          status = 'paid';
        } else if (booking.status === 'cancelled') {
          status = 'cancelled';
        } else {
          const now = new Date();
          if (dueDate < now) {
            status = 'overdue';
          } else if (booking.status === 'delivered') {
            status = 'sent';
          } else {
            status = 'draft';
          }
        }
        
        return {
          id: `invoice-${booking.id}`,
          invoiceNumber: `INV-${booking.lr_number}`,
          date: invoiceDate.toISOString(),
          dueDate: dueDate.toISOString(),
          customer: {
            id: booking.sender_id || '',
            name: booking.sender?.name || 'Unknown',
            email: booking.sender?.email
          },
          amount: booking.total_amount || 0,
          status,
          items: [
            {
              id: `item-${booking.id}-1`,
              description: `Freight charges for ${booking.article?.name || 'goods'} - LR #${booking.lr_number}`,
              quantity: booking.quantity || 1,
              rate: booking.freight_per_qty || 0,
              amount: (booking.quantity || 1) * (booking.freight_per_qty || 0)
            },
            ...(booking.loading_charges ? [{
              id: `item-${booking.id}-2`,
              description: 'Loading charges',
              quantity: 1,
              rate: booking.loading_charges,
              amount: booking.loading_charges
            }] : []),
            ...(booking.unloading_charges ? [{
              id: `item-${booking.id}-3`,
              description: 'Unloading charges',
              quantity: 1,
              rate: booking.unloading_charges,
              amount: booking.unloading_charges
            }] : [])
          ],
          notes: 'Thank you for your business!',
          terms: 'Payment is due within 30 days.'
        };
      });
  }, [bookings]);

  // Filter and sort invoices
  const filteredInvoices = React.useMemo(() => {
    return invoices.filter(invoice => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        invoice.customer.name.toLowerCase().includes(searchLower);
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      
      // Date filter
      let matchesDate = true;
      const invoiceDate = new Date(invoice.date);
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const last3Months = new Date(today);
      last3Months.setMonth(last3Months.getMonth() - 3);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = invoiceDate.toDateString() === today.toDateString();
          break;
        case 'last_week':
          matchesDate = invoiceDate >= lastWeek;
          break;
        case 'last_month':
          matchesDate = invoiceDate >= lastMonth;
          break;
        case 'last_3_months':
          matchesDate = invoiceDate >= last3Months;
          break;
        default:
          matchesDate = true;
      }
      
      return matchesSearch && matchesStatus && matchesDate;
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
      } else if (sortField === 'dueDate') {
        return sortDirection === 'asc'
          ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }
      return 0;
    });
  }, [invoices, searchQuery, statusFilter, dateFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: 'date' | 'amount' | 'dueDate') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleCreateInvoice = (data: any) => {
    showSuccess('Invoice Created', 'Invoice has been created successfully');
    setShowCreateForm(false);
  };

  const handleUpdateInvoice = (id: string, data: any) => {
    showSuccess('Invoice Updated', 'Invoice has been updated successfully');
    setShowEditForm(null);
  };

  const handleDeleteInvoice = (id: string) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setInvoiceToDelete(null);
      showSuccess('Invoice Deleted', 'Invoice has been deleted successfully');
    }, 1000);
  };

  const handleSendInvoice = (id: string) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      showSuccess('Invoice Sent', 'Invoice has been sent to the customer');
    }, 1500);
  };

  const handleMarkAsPaid = (id: string) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      showSuccess('Invoice Updated', 'Invoice has been marked as paid');
    }, 1000);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="h-3 w-3" />
            Draft
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Send className="h-3 w-3" />
            Sent
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3" />
            Paid
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3" />
            Overdue
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Trash className="h-3 w-3" />
            Cancelled
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
          <h2 className="text-xl font-semibold text-gray-900">Invoices</h2>
          <p className="text-gray-600 mt-1">
            Manage and track all your invoices
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)} 
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search invoices..."
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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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

          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Invoices
          </Button>
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
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Customer</th>
                <th 
                  className="text-left text-sm font-medium text-gray-600 px-6 py-4 cursor-pointer"
                  onClick={() => handleSort('dueDate')}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Due Date
                    {sortField === 'dueDate' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
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
              {paginatedInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span 
                      className="font-medium text-blue-600 cursor-pointer hover:underline"
                      onClick={() => setSelectedInvoice(invoice.id)}
                    >
                      {invoice.invoiceNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(invoice.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{invoice.customer.name}</div>
                    {invoice.customer.email && (
                      <div className="text-sm text-gray-500">{invoice.customer.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-medium">₹{invoice.amount.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedInvoice(invoice.id)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                      <Select
                        onValueChange={(value) => {
                          if (value === 'edit') {
                            setShowEditForm(invoice.id);
                          } else if (value === 'delete') {
                            setInvoiceToDelete(invoice.id);
                          } else if (value === 'send') {
                            handleSendInvoice(invoice.id);
                          } else if (value === 'paid') {
                            handleMarkAsPaid(invoice.id);
                          } else if (value === 'print') {
                            window.print();
                          }
                        }}
                      >
                        <SelectTrigger className="w-[110px] h-9">
                          <SelectValue placeholder="Actions" />
                        </SelectTrigger>
                        <SelectContent align="end">
                          {invoice.status === 'draft' && (
                            <SelectItem value="edit">
                              <div className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Edit
                              </div>
                            </SelectItem>
                          )}
                          {(invoice.status === 'draft' || invoice.status === 'sent') && (
                            <SelectItem value="send">
                              <div className="flex items-center gap-2">
                                <Send className="h-4 w-4" />
                                Send
                              </div>
                            </SelectItem>
                          )}
                          {invoice.status === 'sent' && (
                            <SelectItem value="paid">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Mark as Paid
                              </div>
                            </SelectItem>
                          )}
                          <SelectItem value="print">
                            <div className="flex items-center gap-2">
                              <Printer className="h-4 w-4" />
                              Print
                            </div>
                          </SelectItem>
                          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                            <SelectItem value="delete" className="text-red-600">
                              <div className="flex items-center gap-2">
                                <Trash className="h-4 w-4" />
                                Delete
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No invoices found</h3>
                    <p className="text-gray-500 mt-1">
                      {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                        ? 'Try adjusting your filters or search criteria'
                        : 'Create your first invoice to get started'}
                    </p>
                    {!searchQuery && statusFilter === 'all' && dateFilter === 'all' && (
                      <Button 
                        onClick={() => setShowCreateForm(true)} 
                        className="mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Invoice
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices
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

      {/* Invoice Details Dialog */}
      <Dialog 
        open={!!selectedInvoice} 
        onOpenChange={(open) => {
          if (!open) setSelectedInvoice(null);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <InvoiceDetails 
              invoice={invoices.find(i => i.id === selectedInvoice)!}
              onClose={() => setSelectedInvoice(null)}
              onSend={() => {
                handleSendInvoice(selectedInvoice);
                setSelectedInvoice(null);
              }}
              onMarkAsPaid={() => {
                handleMarkAsPaid(selectedInvoice);
                setSelectedInvoice(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog 
        open={showCreateForm} 
        onOpenChange={setShowCreateForm}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <InvoiceForm 
            onSubmit={handleCreateInvoice}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog 
        open={!!showEditForm} 
        onOpenChange={(open) => {
          if (!open) setShowEditForm(null);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>
          {showEditForm && (
            <InvoiceForm 
              invoice={invoices.find(i => i.id === showEditForm)!}
              onSubmit={(data) => handleUpdateInvoice(showEditForm, data)}
              onCancel={() => setShowEditForm(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={!!invoiceToDelete} 
        onOpenChange={(open) => {
          if (!open) setInvoiceToDelete(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <p className="text-center text-gray-700 mb-4">
              Are you sure you want to delete this invoice? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setInvoiceToDelete(null)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => invoiceToDelete && handleDeleteInvoice(invoiceToDelete)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Invoice'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}