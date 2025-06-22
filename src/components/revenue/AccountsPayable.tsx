import React, { useState } from 'react';
import { Wallet, Search, Filter, Download, Eye, Plus, Calendar, CheckCircle2, AlertCircle, Loader2, ArrowUpDown, CreditCard, FileText, Clock } from 'lucide-react';
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

interface Payable {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  vendor: {
    id: string;
    name: string;
    email?: string;
  };
  amount: number;
  amountPaid: number;
  amountDue: number;
  status: 'current' | 'overdue' | 'partially_paid';
  daysOverdue: number;
  category: 'Vehicle Maintenance' | 'Fuel' | 'Office Supplies' | 'Rent' | 'Salaries' | 'Other';
}

export default function AccountsPayable({ bookings }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setcategoryFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [sortField, setSortField] = useState<'dueDate' | 'amount' | 'daysOverdue'>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayable, setSelectedPayable] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { showSuccess, showError } = useNotificationSystem();
  const itemsPerPage = 10;

  // Generate payables (mock data since we don't have real expense data)
  const payables: Payable[] = React.useMemo(() => {
    const categories: Payable['category'][] = ['Vehicle Maintenance', 'Fuel', 'Office Supplies', 'Rent', 'Salaries', 'Other'];
    const vendors = [
      { id: 'vendor-1', name: 'Fuel Suppliers Ltd.', email: 'accounts@fuelsuppliers.com' },
      { id: 'vendor-2', name: 'Vehicle Parts Co.', email: 'billing@vehicleparts.com' },
      { id: 'vendor-3', name: 'Office Depot', email: 'invoices@officedepot.com' },
      { id: 'vendor-4', name: 'City Properties', email: 'rent@cityproperties.com' },
      { id: 'vendor-5', name: 'HR Services Inc.', email: 'payroll@hrservices.com' },
    ];
    
    return Array.from({ length: 20 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 60)); // Random date in the last 60 days
      
      const dueDate = new Date(date);
      dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms
      
      const now = new Date();
      const daysOverdue = dueDate < now ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      const amount = Math.floor(Math.random() * 50000) + 1000;
      const amountPaid = Math.random() > 0.7 ? amount * (Math.random() * 0.7) : 0;
      const amountDue = amount - amountPaid;
      
      // Determine status
      let status: Payable['status'];
      if (amountPaid > 0 && amountDue > 0) {
        status = 'partially_paid';
      } else if (daysOverdue > 0) {
        status = 'overdue';
      } else {
        status = 'current';
      }
      
      const vendor = vendors[Math.floor(Math.random() * vendors.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      return {
        id: `payable-${i}`,
        invoiceNumber: `BILL-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${i.toString().padStart(3, '0')}`,
        date: date.toISOString(),
        dueDate: dueDate.toISOString(),
        vendor,
        amount,
        amountPaid,
        amountDue,
        status,
        daysOverdue,
        category
      };
    });
  }, []);

  // Filter and sort payables
  const filteredPayables = React.useMemo(() => {
    return payables.filter(payable => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        payable.invoiceNumber.toLowerCase().includes(searchLower) ||
        payable.vendor.name.toLowerCase().includes(searchLower);
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || payable.status === statusFilter;
      
      // Category filter
      const matchesCategory = categoryFilter === 'all' || payable.category === categoryFilter;
      
      // Age filter
      let matchesAge = true;
      switch (ageFilter) {
        case 'current':
          matchesAge = payable.daysOverdue === 0;
          break;
        case '1-30':
          matchesAge = payable.daysOverdue > 0 && payable.daysOverdue <= 30;
          break;
        case '31-60':
          matchesAge = payable.daysOverdue > 30 && payable.daysOverdue <= 60;
          break;
        case '61-90':
          matchesAge = payable.daysOverdue > 60 && payable.daysOverdue <= 90;
          break;
        case '90+':
          matchesAge = payable.daysOverdue > 90;
          break;
        default:
          matchesAge = true;
      }
      
      return matchesSearch && matchesStatus && matchesCategory && matchesAge;
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
  }, [payables, searchQuery, statusFilter, categoryFilter, ageFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredPayables.length / itemsPerPage);
  const paginatedPayables = filteredPayables.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate totals
  const totals = React.useMemo(() => {
    const total = filteredPayables.reduce((sum, r) => sum + r.amountDue, 0);
    const current = filteredPayables.filter(r => r.status === 'current').reduce((sum, r) => sum + r.amountDue, 0);
    const overdue = filteredPayables.filter(r => r.status === 'overdue').reduce((sum, r) => sum + r.amountDue, 0);
    const partiallyPaid = filteredPayables.filter(r => r.status === 'partially_paid').reduce((sum, r) => sum + r.amountDue, 0);
    
    return { total, current, overdue, partiallyPaid };
  }, [filteredPayables]);

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

  const getStatusBadge = (status: Payable['status'], daysOverdue: number) => {
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

  const getCategoryBadge = (category: Payable['category']) => {
    switch (category) {
      case 'Vehicle Maintenance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {category}
          </span>
        );
      case 'Fuel':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {category}
          </span>
        );
      case 'Office Supplies':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {category}
          </span>
        );
      case 'Rent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            {category}
          </span>
        );
      case 'Salaries':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {category}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {category}
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
          <h2 className="text-xl font-semibold text-gray-900">Accounts Payable</h2>
          <p className="text-gray-600 mt-1">
            Track and manage payments to vendors and suppliers
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => {}}
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setShowPaymentForm('new')}
          >
            <Plus className="h-4 w-4" />
            Record Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Payables</h3>
          <p className="text-2xl font-bold text-gray-900">₹{totals.total.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{filteredPayables.length} open bills</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Current</h3>
          <p className="text-2xl font-bold text-green-600">₹{totals.current.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {filteredPayables.filter(r => r.status === 'current').length} bills
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Overdue</h3>
          <p className="text-2xl font-bold text-red-600">₹{totals.overdue.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {filteredPayables.filter(r => r.status === 'overdue').length} bills
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Partially Paid</h3>
          <p className="text-2xl font-bold text-blue-600">₹{totals.partiallyPaid.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {filteredPayables.filter(r => r.status === 'partially_paid').length} bills
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search by invoice or vendor..."
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

          <Select value={categoryFilter} onValueChange={setcategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Vehicle Maintenance">Vehicle Maintenance</SelectItem>
              <SelectItem value="Fuel">Fuel</SelectItem>
              <SelectItem value="Office Supplies">Office Supplies</SelectItem>
              <SelectItem value="Rent">Rent</SelectItem>
              <SelectItem value="Salaries">Salaries</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
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
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Bill #</th>
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
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Vendor</th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Category</th>
                <th 
                  className="text-right text-sm font-medium text-gray-600 px-6 py-4 cursor-pointer"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Amount Due
                    {sortField === 'amount' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
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
              {paginatedPayables.map((payable) => (
                <tr key={payable.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span 
                      className="font-medium text-blue-600 cursor-pointer hover:underline"
                      onClick={() => setSelectedPayable(payable.id)}
                    >
                      {payable.invoiceNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(payable.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{payable.vendor.name}</div>
                    {payable.vendor.email && (
                      <div className="text-sm text-gray-500">{payable.vendor.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {getCategoryBadge(payable.category)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-medium">₹{payable.amountDue.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(payable.status, payable.daysOverdue)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowPaymentForm(payable.id)}
                        className="flex items-center gap-1"
                      >
                        <Wallet className="h-4 w-4" />
                        <span className="hidden sm:inline">Pay</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedPayable(payable.id)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedPayables.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No payables found</h3>
                    <p className="text-gray-500 mt-1">
                      {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || ageFilter !== 'all'
                        ? 'Try adjusting your filters or search criteria'
                        : 'All your bills have been paid'}
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPayables.length)} of {filteredPayables.length} payables
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
            <DialogTitle>
              {showPaymentForm === 'new' ? 'Record Expense' : 'Make Payment'}
            </DialogTitle>
          </DialogHeader>
          <PaymentForm 
            onSubmit={handleRecordPayment}
            onCancel={() => setShowPaymentForm(null)}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}