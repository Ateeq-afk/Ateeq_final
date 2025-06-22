import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Search, Filter, Download, Eye, Calendar, ArrowUpDown, FileText, CreditCard, Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import type { Booking } from '@/types';

interface Props {
  bookings: Booking[];
  fullView?: boolean;
}

export default function TransactionLedger({ bookings, fullView = false }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionType, setTransactionType] = useState('all');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [exporting, setExporting] = useState(false);
  const itemsPerPage = fullView ? 15 : 5;

  // Generate additional transactions for a more complete ledger
  const allTransactions = React.useMemo(() => {
    // Start with booking transactions
    const bookingTransactions = bookings.map(booking => ({
      id: booking.id,
      date: booking.created_at,
      type: 'booking',
      description: `Booking LR #${booking.lr_number}`,
      customer: booking.sender?.name || 'Unknown',
      paymentType: booking.payment_type,
      amount: booking.total_amount || 0,
      status: booking.status
    }));
    
    // Add payment transactions for some of the "To Pay" bookings
    const paymentTransactions = bookings
      .filter(b => b.payment_type === 'To Pay' && b.status === 'delivered' && Math.random() > 0.3) // 70% of delivered "To Pay" bookings have payments
      .map(booking => {
        // Payment date is after delivery (random days between 1-15)
        const bookingDate = new Date(booking.created_at);
        const paymentDate = new Date(bookingDate);
        paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 15) + 1);
        
        return {
          id: `payment-${booking.id}`,
          date: paymentDate.toISOString(),
          type: 'payment',
          description: `Payment for LR #${booking.lr_number}`,
          customer: booking.receiver?.name || 'Unknown',
          paymentType: ['Cash', 'Bank Transfer', 'UPI', 'Cheque'][Math.floor(Math.random() * 4)],
          amount: booking.total_amount || 0,
          status: 'completed'
        };
      });
    
    // Add expense transactions
    const expenseTypes = ['Fuel', 'Vehicle Maintenance', 'Office Supplies', 'Salaries', 'Rent'];
    const expenseTransactions = Array.from({ length: 10 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      return {
        id: `expense-${i}`,
        date: date.toISOString(),
        type: 'expense',
        description: `${expenseTypes[Math.floor(Math.random() * expenseTypes.length)]} Expense`,
        customer: 'N/A',
        paymentType: ['Cash', 'Bank Transfer'][Math.floor(Math.random() * 2)],
        amount: Math.floor(Math.random() * 5000) + 500,
        status: 'completed'
      };
    });
    
    // Combine all transactions
    return [...bookingTransactions, ...paymentTransactions, ...expenseTransactions];
  }, [bookings]);

  // Filter and sort transactions
  const filteredTransactions = React.useMemo(() => {
    return allTransactions.filter(transaction => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        transaction.description.toLowerCase().includes(searchLower) ||
        transaction.customer.toLowerCase().includes(searchLower);
      
      // Transaction type filter
      const matchesType = transactionType === 'all' || transaction.type === transactionType;
      
      return matchesSearch && matchesType;
    }).sort((a, b) => {
      // Sorting
      if (sortField === 'date') {
        return sortDirection === 'asc' 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return sortDirection === 'asc'
          ? a.amount - b.amount
          : b.amount - a.amount;
      }
    });
  }, [allTransactions, searchQuery, transactionType, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
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

  const handleExport = () => {
    setExporting(true);
    
    // Simulate export delay
    setTimeout(() => {
      setExporting(false);
      
      // Create CSV content
      const headers = ['Date', 'Description', 'Customer', 'Type', 'Payment Method', 'Amount', 'Status'];
      const rows = filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.description,
        t.customer,
        t.type,
        t.paymentType,
        t.amount.toString(),
        t.status
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transaction_ledger_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-200"
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Transaction Ledger</h3>
            <p className="text-sm text-gray-500 mt-1">Detailed view of all financial transactions</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                className="pl-10 w-64"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="booking">Bookings</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

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
                  Date & Time
                  {sortField === 'date' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Description</th>
              <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Customer</th>
              <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Type</th>
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
              {fullView && (
                <th className="text-right text-sm font-medium text-gray-600 px-6 py-4">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <div>{new Date(transaction.date).toLocaleDateString()}</div>
                    <div className="text-gray-500">
                      {new Date(transaction.date).toLocaleTimeString()}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">{transaction.description}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-900">{transaction.customer}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {transaction.type === 'booking' ? (
                      <FileText className="h-4 w-4 text-blue-500" />
                    ) : transaction.type === 'payment' ? (
                      <CreditCard className="h-4 w-4 text-green-500" />
                    ) : (
                      <Wallet className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.type === 'booking' 
                        ? 'bg-blue-100 text-blue-800'
                        : transaction.type === 'payment'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {transaction.paymentType}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-medium">₹{transaction.amount.toFixed(2)}</span>
                    {transaction.type === 'booking' || transaction.type === 'payment' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    transaction.status === 'delivered' || transaction.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : transaction.status === 'in_transit'
                      ? 'bg-blue-100 text-blue-800'
                      : transaction.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1).replace('_', ' ')}
                  </span>
                </td>
                {fullView && (
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                  </td>
                )}
              </tr>
            ))}

            {paginatedTransactions.length === 0 && (
              <tr>
                <td colSpan={fullView ? 7 : 6} className="px-6 py-8 text-center text-gray-500">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No transactions found</h3>
                  <p className="text-gray-500 mt-1">Try adjusting your filters or search criteria</p>
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
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
    </motion.div>
  );
}