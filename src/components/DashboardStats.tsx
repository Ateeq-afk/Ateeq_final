import React, { useState } from 'react';
import { Download, Filter, Calendar, ArrowUpDown, Search, RefreshCw, Plus, FileText, CreditCard, Wallet, BarChart3, ArrowRight, Loader2, Package, Truck, Users, Upload, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBookings } from '@/hooks/useBookings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { IndianRupee } from '@/components/ui/icons';
import { motion } from 'framer-motion';
import QuickActionCards from './dashboard/QuickActionCards';

function DashboardStats() {
  const { bookings, loading: bookingsLoading } = useBookings();
  const { currentBranch } = useCurrentBranch();
  const { showSuccess } = useNotificationSystem();
  const navigate = useNavigate();

  // Date filter state
  const [dateRange, setDateRange] = useState('last_month');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter bookings based on date range
  const filteredBookings = React.useMemo(() => {
    return bookings.filter(booking => {
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

      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        booking.lr_number.toLowerCase().includes(searchLower) ||
        (booking.sender?.name?.toLowerCase().includes(searchLower)) ||
        (booking.receiver?.name?.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      switch (dateRange) {
        case 'today':
          return bookingDate.toDateString() === today.toDateString();
        case 'yesterday':
          return bookingDate.toDateString() === yesterday.toDateString();
        case 'last_week':
          return bookingDate >= lastWeek;
        case 'last_month':
          return bookingDate >= lastMonth;
        case 'last_3_months':
          return bookingDate >= last3Months;
        case 'custom':
          const start = startDate ? new Date(startDate) : new Date(0);
          const end = endDate ? new Date(endDate) : new Date();
          // Set end date to end of day
          end.setHours(23, 59, 59, 999);
          return bookingDate >= start && bookingDate <= end;
        default:
          return true;
      }
    });
  }, [bookings, dateRange, startDate, endDate, searchQuery]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!filteredBookings.length) return {
      totalDeliveries: 0,
      revenue: 0,
      deliveredCount: 0,
      inTransitCount: 0,
      bookedCount: 0,
      cancelledCount: 0,
      avgDeliveryTime: 0,
      activeVehicles: 0,
      totalVehicles: 0,
      totalCustomers: 0,
      newCustomers: 0
    };

    const deliveredCount = filteredBookings.filter(b => b.status === 'delivered').length;
    const inTransitCount = filteredBookings.filter(b => b.status === 'in_transit').length;
    const bookedCount = filteredBookings.filter(b => b.status === 'booked').length;
    const cancelledCount = filteredBookings.filter(b => b.status === 'cancelled').length;

    const totalDeliveries = filteredBookings.length;
    const revenue = filteredBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

    // Calculate average delivery time (based on actual data)
    const deliveredBookings = filteredBookings.filter(b => b.status === 'delivered');
    let avgDeliveryTime = 0;
    if (deliveredBookings.length > 0) {
      const totalDeliveryTime = deliveredBookings.reduce((sum, b) => {
        const bookingDate = new Date(b.created_at).getTime();
        const deliveryDate = new Date(b.updated_at).getTime();
        return sum + (deliveryDate - bookingDate) / (1000 * 60 * 60); // hours
      }, 0);
      avgDeliveryTime = totalDeliveryTime / deliveredBookings.length;
    }

    return {
      totalDeliveries,
      revenue,
      deliveredCount,
      inTransitCount,
      bookedCount,
      cancelledCount,
      avgDeliveryTime,
      activeVehicles: 0, // Will be populated from vehicles data
      totalVehicles: 0,  // Will be populated from vehicles data
      totalCustomers: 0, // Will be populated from customers data
      newCustomers: 0    // Will be populated from customers data
    };
  }, [filteredBookings]);

  // Generate booking trend data
  const bookingTrends = React.useMemo(() => {
    const dailyData: Record<string, {date: string, bookings: number, delivered: number, revenue: number}> = {};
    
    // Get last 30 days
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = {
        date: dateStr,
        bookings: 0,
        delivered: 0,
        revenue: 0
      };
    }
    
    // Fill in booking data
    filteredBookings.forEach(booking => {
      const date = new Date(booking.created_at).toISOString().split('T')[0];
      if (dailyData[date]) {
        dailyData[date].bookings++;
        dailyData[date].revenue += booking.total_amount || 0;
        if (booking.status === 'delivered') {
          dailyData[date].delivered++;
        }
      }
    });
    
    return Object.values(dailyData);
  }, [filteredBookings]);

  // Generate status distribution data
  const statusDistribution = React.useMemo(() => {
    const statuses: Record<string, number> = {
      'booked': 0,
      'in_transit': 0,
      'delivered': 0,
      'cancelled': 0
    };
    
    filteredBookings.forEach(booking => {
      statuses[booking.status] = (statuses[booking.status] || 0) + 1;
    });
    
    return Object.entries(statuses).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
      value
    }));
  }, [filteredBookings]);

  // Generate payment type distribution data
  const paymentTypeData = React.useMemo(() => {
    const paymentTypes: Record<string, number> = {
      'Paid': 0,
      'To Pay': 0,
      'Quotation': 0
    };
    
    filteredBookings.forEach(booking => {
      const type = booking.payment_type;
      paymentTypes[type] = (paymentTypes[type] || 0) + (booking.total_amount || 0);
    });

    return Object.entries(paymentTypes)
      .map(([name, value]) => ({
        name,
        value: Number(value)
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredBookings]);

  // Generate branch-wise sales data
  const branchSalesData = React.useMemo(() => {
    const branchSales: Record<string, number> = {};
    filteredBookings.forEach(booking => {
      const branchName = booking.from_branch_details?.name || 'Unknown';
      if (!branchSales[branchName]) {
        branchSales[branchName] = 0;
      }
      branchSales[branchName] += booking.total_amount || 0;
    });

    return Object.entries(branchSales)
      .map(([branch, amount]) => ({
        branch,
        amount: Number(amount)
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredBookings]);

  // Generate monthly revenue trend
  const monthlyRevenueTrend = React.useMemo(() => {
    const monthlyData: Record<string, {month: string, revenue: number}> = {};
    
    // Get last 12 months
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      monthlyData[monthYear] = {
        month: monthYear,
        revenue: 0
      };
    }
    
    // Fill in actual data
    bookings.forEach(booking => {
      const date = new Date(booking.created_at);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      if (monthlyData[monthYear]) {
        monthlyData[monthYear].revenue += booking.total_amount || 0;
      }
    });
    
    // Convert to array
    return Object.values(monthlyData);
  }, [bookings]);

  // Colors for charts
  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const handleExport = () => {
    // TODO: Implement export functionality
    showSuccess('Export Started', 'Your dashboard data is being exported');
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
      showSuccess('Dashboard Refreshed', 'Dashboard data has been updated');
    }, 1000);
  };

  const isLoading = bookingsLoading || refreshing;

  return (
    <div className="space-y-6">
      {/* Quick Actions - 4 Square Boxes */}
      <QuickActionCards />

      {/* Date Filter */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
      >
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">K2K Logistics Overview</h2>
              <p className="text-gray-600 mt-1">Analytics and performance metrics</p>
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
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
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
                    className="pl-10 bg-white border-gray-200 text-gray-900"
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
                    className="pl-10 bg-white border-gray-200 text-gray-900"
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
                className="pl-10 bg-white border-gray-200 text-gray-900"
                placeholder="Search by LR, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {refreshing || bookingsLoading ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center mt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              <p className="text-gray-600 font-medium">Loading dashboard data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <StatCard
                  icon={Package}
                  title="Shipment Status"
                  value={stats.totalDeliveries.toString()}
                  details={[
                    { label: 'Delivered', value: stats.deliveredCount },
                    { label: 'In Transit', value: stats.inTransitCount },
                    { label: 'Booked', value: stats.bookedCount },
                    { label: 'Cancelled', value: stats.cancelledCount }
                  ]}
                  color="blue"
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <StatCard
                  icon={IndianRupee}
                  title="Total Revenue"
                  value={`₹${(stats.revenue / 1000).toFixed(1)}K`}
                  color="purple"
                  details={[
                    { label: 'Paid', value: filteredBookings.filter(b => b.payment_type === 'Paid').length },
                    { label: 'To Pay', value: filteredBookings.filter(b => b.payment_type === 'To Pay').length },
                    { label: 'Quotation', value: filteredBookings.filter(b => b.payment_type === 'Quotation').length },
                    { label: 'Avg. Value', value: stats.totalDeliveries ? Math.round(stats.revenue / stats.totalDeliveries) : 0, prefix: '₹' }
                  ]}
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <StatCard
                  icon={Truck}
                  title="Fleet Status"
                  value={`${stats.activeVehicles}/${stats.totalVehicles}`}
                  color="green"
                  details={[
                    { label: 'Active', value: stats.activeVehicles },
                    { label: 'Maintenance', value: 0 },
                    { label: 'Inactive', value: 0 },
                    { label: 'Utilization', value: stats.totalVehicles ? Math.round((stats.activeVehicles / stats.totalVehicles) * 100) : 0, suffix: '%' }
                  ]}
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <StatCard
                  icon={Users}
                  title="Customers"
                  value={stats.totalCustomers.toString()}
                  color="amber"
                  details={[
                    { label: 'New', value: stats.newCustomers },
                    { label: 'Companies', value: 0 },
                    { label: 'Individuals', value: 0 },
                    { label: 'Active', value: 0 }
                  ]}
                />
              </motion.div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Daily Booking Trends */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Daily Activity</h3>
                    <p className="text-sm text-gray-500 mt-1">Bookings and deliveries over time</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-xs text-gray-600">Bookings</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-xs text-gray-600">Delivered</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-xs text-gray-600">Revenue</span>
                    </div>
                  </div>
                </div>
                <div className="h-[300px]">
                  {bookingTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bookingTrends}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            });
                          }}
                        />
                        <YAxis 
                          yAxisId="left"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `₹${value/1000}K`}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'revenue') return [`₹${value}`, 'Revenue'];
                            return [value, name.charAt(0).toUpperCase() + name.slice(1)];
                          }}
                          labelFormatter={(label) => {
                            const date = new Date(label);
                            return date.toLocaleDateString('en-US', { 
                              weekday: 'long',
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            });
                          }}
                        />
                        <Bar 
                          yAxisId="left"
                          name="bookings" 
                          dataKey="bookings" 
                          fill="#3b82f6" 
                          radius={[4, 4, 0, 0]} 
                          barSize={8}
                        />
                        <Bar 
                          yAxisId="left"
                          name="delivered" 
                          dataKey="delivered" 
                          fill="#22c55e" 
                          radius={[4, 4, 0, 0]} 
                          barSize={8}
                        />
                        <Line
                          yAxisId="right"
                          name="revenue"
                          type="monotone"
                          dataKey="revenue"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No booking data available for the selected period</p>
                    </div>
                  )}
                </div>
              </motion.div>
              
              {/* Status Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.7 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Booking Status</h3>
                    <p className="text-sm text-gray-500 mt-1">Distribution by status</p>
                  </div>
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <div className="h-[300px]">
                  {statusDistribution.some(item => item.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          <Cell fill="#22c55e" /> {/* Delivered - Green */}
                          <Cell fill="#3b82f6" /> {/* In Transit - Blue */}
                          <Cell fill="#f59e0b" /> {/* Booked - Yellow */}
                          <Cell fill="#ef4444" /> {/* Cancelled - Red */}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} bookings`, 'Count']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No status data available for the selected period</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Recent Bookings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.8 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
                  <p className="text-sm text-gray-500 mt-1">Latest booking activity</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => navigate('/dashboard/bookings')}
                >
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 rounded-lg">
                      <th className="text-left text-sm font-medium text-gray-600 px-4 py-3 rounded-l-lg">LR Number</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Date</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">From/To</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Customer</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Status</th>
                      <th className="text-right text-sm font-medium text-gray-600 px-4 py-3 rounded-r-lg">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBookings.slice(0, 5).map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-medium text-blue-600">{booking.lr_number}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {booking.from_branch === currentBranch?.id 
                            ? <span className="flex items-center gap-1"><ArrowUpRight className="h-3 w-3 text-green-600" /> {booking.to_branch_details?.name}</span>
                            : <span className="flex items-center gap-1"><ArrowDownRight className="h-3 w-3 text-blue-600" /> {booking.from_branch_details?.name}</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {booking.from_branch === currentBranch?.id 
                            ? booking.sender?.name
                            : booking.receiver?.name
                          }
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            booking.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'in_transit'
                              ? 'bg-blue-100 text-blue-800'
                              : booking.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status.replace('_', ' ').charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium">₹{booking.total_amount}</span>
                        </td>
                      </tr>
                    ))}
                    
                    {filteredBookings.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-gray-900">No bookings found</h3>
                          <p className="text-gray-500 mt-1">No bookings available for the selected period</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}

interface TrendProps {
  value: string;
  isUp?: boolean;
}

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  color: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'indigo';
  details?: Array<{ label: string; value: number; prefix?: string; suffix?: string }>;
  trend?: TrendProps;
}

function StatCard({ icon: Icon, title, value, color, details, trend }: StatCardProps) {
  const colors = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      detailBg: 'bg-blue-100/50'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-100',
      detailBg: 'bg-green-100/50'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      detailBg: 'bg-purple-100/50'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      detailBg: 'bg-amber-100/50'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-100',
      detailBg: 'bg-red-100/50'
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
      detailBg: 'bg-indigo-100/50'
    }
  };

  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow h-full`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-3 rounded-xl ${colors[color].bg}`}>
          <Icon className={`h-6 w-6 ${colors[color].text}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span className="text-sm font-medium">{trend.value}</span>
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <p className="text-gray-600 text-sm">{title}</p>

      {details && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {details.map(({ label, value, prefix, suffix }) => (
            <div key={label} className={`${colors[color].detailBg} rounded-lg p-2`}>
              <p className="text-xs text-gray-600">{label}</p>
              <p className="text-sm font-medium text-gray-900">{prefix}{value}{suffix}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper component for ArrowDownRight icon
function ArrowDownRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7 7 10 10" />
      <path d="M17 7v10H7" />
    </svg>
  );
}

// Helper component for ArrowUpRight icon
function ArrowUpRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7 17 10-10" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

export default DashboardStats;