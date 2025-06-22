import React, { useState } from 'react';
import { IndianRupee, Download, Filter, Calendar, ArrowUpDown, Search, RefreshCw, Plus, FileText, CreditCard, Wallet, BarChart3, PieChart, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBookings } from '@/hooks/useBookings';
import { useOrganizations } from '@/hooks/useOrganizations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import RevenueStats from './RevenueStats';
import RevenueTrends from './RevenueTrends';
import TransactionLedger from './TransactionLedger';
import InvoiceList from './InvoiceList';
import PaymentsList from './PaymentsList';
import AccountsReceivable from './AccountsReceivable';
import AccountsPayable from './AccountsPayable';
import FinancialReports from './FinancialReports';
import { motion } from 'framer-motion';

export default function RevenuePage() {
  const { organizations } = useOrganizations();
  const organizationId = organizations[0]?.id;
  const { bookings, loading: bookingsLoading } = useBookings(organizationId);
  const { showSuccess } = useNotificationSystem();

  // Date filter state
  const [dateRange, setDateRange] = useState('last_month');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentType, setPaymentType] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Filter bookings based on filters
  const filteredBookings = React.useMemo(() => {
    return bookings.filter(booking => {
      // Date filter
      const bookingDate = new Date(booking.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const last3Months = new Date(today);
      last3Months.setMonth(last3Months.getMonth() - 3);
      
      let passesDateFilter = true;
      switch (dateRange) {
        case 'today':
          passesDateFilter = bookingDate.toDateString() === today.toDateString();
          break;
        case 'yesterday':
          passesDateFilter = bookingDate.toDateString() === yesterday.toDateString();
          break;
        case 'last_week':
          passesDateFilter = bookingDate >= lastWeek;
          break;
        case 'last_month':
          passesDateFilter = bookingDate >= lastMonth;
          break;
        case 'last_3_months':
          passesDateFilter = bookingDate >= last3Months;
          break;
        case 'custom':
          const start = startDate ? new Date(startDate) : new Date(0);
          const end = endDate ? new Date(endDate) : new Date();
          end.setHours(23, 59, 59, 999);
          passesDateFilter = bookingDate >= start && bookingDate <= end;
          break;
        default:
          passesDateFilter = true;
      }
      
      // Payment type filter
      const passesPaymentFilter = paymentType === 'all' || booking.payment_type === paymentType;
      
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const passesSearchFilter = !searchQuery || 
        booking.lr_number.toLowerCase().includes(searchLower) ||
        booking.sender?.name?.toLowerCase().includes(searchLower) ||
        booking.receiver?.name?.toLowerCase().includes(searchLower);
      
      return passesDateFilter && passesPaymentFilter && passesSearchFilter;
    });
  }, [bookings, dateRange, startDate, endDate, paymentType, searchQuery]);

  const handleExport = () => {
    showSuccess('Export Started', 'Your financial data is being exported');
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
      showSuccess('Data Refreshed', 'Financial data has been updated');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
      >
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <IndianRupee className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Financial Management</h2>
              <p className="text-gray-600 mt-1">Track revenue, invoices, and payments</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 md:grid-cols-8 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="receivable">Receivable</TabsTrigger>
            <TabsTrigger value="payable">Payable</TabsTrigger>
            <TabsTrigger value="ledger">Ledger</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last_week">Last 7 Days</SelectItem>
                  <SelectItem value="last_month">Last 30 Days</SelectItem>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === 'custom' && (
              <>
                <div>
                  <Label>Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="date"
                      className="pl-10"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>End Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="date"
                      className="pl-10"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div className={dateRange === 'custom' ? 'md:col-span-1' : 'md:col-span-3'}>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Search by LR, customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {refreshing || bookingsLoading ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin h-10 w-10 border-4 border-green-600 border-t-transparent rounded-full"></div>
                <p className="text-gray-600 font-medium">Loading financial data...</p>
              </div>
            </div>
          ) : (
            <>
              <TabsContent value="overview" className="mt-0 space-y-6">
                <RevenueStats bookings={filteredBookings} />
                <RevenueTrends bookings={filteredBookings} />
                <TransactionLedger bookings={filteredBookings} />
              </TabsContent>

              <TabsContent value="invoices" className="mt-0">
                <InvoiceList bookings={filteredBookings} />
              </TabsContent>

              <TabsContent value="payments" className="mt-0">
                <PaymentsList bookings={filteredBookings} />
              </TabsContent>

              <TabsContent value="receivable" className="mt-0">
                <AccountsReceivable bookings={filteredBookings} />
              </TabsContent>

              <TabsContent value="payable" className="mt-0">
                <AccountsPayable bookings={filteredBookings} />
              </TabsContent>

              <TabsContent value="ledger" className="mt-0">
                <TransactionLedger bookings={filteredBookings} fullView={true} />
              </TabsContent>

              <TabsContent value="reports" className="mt-0">
                <FinancialReports bookings={filteredBookings} />
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Settings</h3>
                  <p className="text-gray-600 mb-6">Configure your financial preferences and accounting settings</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-4">General Settings</h4>
                      <div className="space-y-4">
                        <div>
                          <Label>Financial Year Start</Label>
                          <Select defaultValue="april">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="january">January (Calendar Year)</SelectItem>
                              <SelectItem value="april">April (Financial Year)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Currency Format</Label>
                          <Select defaultValue="inr">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="inr">Indian Rupee (₹)</SelectItem>
                              <SelectItem value="usd">US Dollar ($)</SelectItem>
                              <SelectItem value="eur">Euro (€)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Default Payment Terms</Label>
                          <Select defaultValue="net30">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="immediate">Immediate</SelectItem>
                              <SelectItem value="net15">Net 15 Days</SelectItem>
                              <SelectItem value="net30">Net 30 Days</SelectItem>
                              <SelectItem value="net45">Net 45 Days</SelectItem>
                              <SelectItem value="net60">Net 60 Days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-4">Invoice Settings</h4>
                      <div className="space-y-4">
                        <div>
                          <Label>Invoice Prefix</Label>
                          <Input defaultValue="INV-" placeholder="Enter invoice prefix" />
                        </div>
                        
                        <div>
                          <Label>Invoice Numbering</Label>
                          <Select defaultValue="auto">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto-increment</SelectItem>
                              <SelectItem value="date">Date-based (YYYYMMDD-XXX)</SelectItem>
                              <SelectItem value="manual">Manual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Default Due Days</Label>
                          <Input type="number" defaultValue="30" min="0" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-4">Tax Settings</h4>
                      <div className="space-y-4">
                        <div>
                          <Label>GST Number</Label>
                          <Input placeholder="Enter your GST number" />
                        </div>
                        
                        <div>
                          <Label>Default Tax Rate (%)</Label>
                          <Input type="number" defaultValue="18" min="0" max="100" />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="tax_inclusive"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor="tax_inclusive" className="font-normal">
                            Prices are tax inclusive
                          </Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-4">Payment Settings</h4>
                      <div className="space-y-4">
                        <div>
                          <Label>Payment Methods</Label>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="payment_cash"
                                defaultChecked
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <Label htmlFor="payment_cash" className="font-normal">
                                Cash
                              </Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="payment_bank"
                                defaultChecked
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <Label htmlFor="payment_bank" className="font-normal">
                                Bank Transfer
                              </Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="payment_upi"
                                defaultChecked
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <Label htmlFor="payment_upi" className="font-normal">
                                UPI
                              </Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="payment_cheque"
                                defaultChecked
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <Label htmlFor="payment_cheque" className="font-normal">
                                Cheque
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <Button className="bg-green-600 hover:bg-green-700">
                      Save Settings
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </motion.div>
    </div>
  );
}