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
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee } from '@/components/ui/icons';
import { motion } from 'framer-motion';
import QuickActionCards from './dashboard/QuickActionCards';
import { useVehicles } from '@/hooks/useVehicles';
import { useCustomers } from '@/hooks/useCustomers';

function DashboardStats() {
  const { bookings, loading: bookingsLoading, refresh: refreshBookings } = useBookings();
  const { currentBranch } = useCurrentBranch();
  const { showSuccess } = useNotificationSystem();
  const navigate = useNavigate();
  const { vehicles, loading: vehiclesLoading, refresh: refreshVehicles } = useVehicles();
  const { customers, loading: customersLoading, refresh: refreshCustomers } = useCustomers();

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

    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.status === 'active').length;
    const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
    const inactiveVehicles = vehicles.filter(v => v.status === 'inactive').length;
    const utilization = totalVehicles ? Math.round((activeVehicles / totalVehicles) * 100) : 0;

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const individuals = customers.filter(c => c.type === 'individual').length;
    const companies = customers.filter(c => c.type === 'company').length;
    const newCustomers = customers.filter(c => {
      const created = new Date(c.created_at);
      const diff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    }).length;

    return {
      totalDeliveries,
      revenue,
      deliveredCount,
      inTransitCount,
      bookedCount,
      cancelledCount,
      avgDeliveryTime,
      activeVehicles,
      maintenanceVehicles,
      inactiveVehicles,
      utilization,
      totalVehicles,
      totalCustomers,
      activeCustomers,
      individuals,
      companies,
      newCustomers
    };
  }, [filteredBookings, vehicles, customers]);

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

  const dailyOptions = React.useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['Bookings', 'Delivered', 'Revenue'] },
    xAxis: {
      type: 'category',
      data: bookingTrends.map((item) => item.date)
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'Bookings',
        type: 'bar',
        stack: 'activity',
        data: bookingTrends.map((item) => item.bookings),
        itemStyle: { color: '#22c55e' }
      },
      {
        name: 'Delivered',
        type: 'bar',
        stack: 'activity',
        data: bookingTrends.map((item) => item.delivered),
        itemStyle: { color: '#3b82f6' }
      },
      {
        name: 'Revenue',
        type: 'line',
        data: bookingTrends.map((item) => item.revenue),
        itemStyle: { color: '#a855f7' }
      }
    ]
  }), [bookingTrends]);

  const statusOptions = React.useMemo(() => ({
    tooltip: { trigger: 'item' },
    legend: { orient: 'horizontal', bottom: 0 },
    series: [
      {
        name: 'Booking Status',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: { show: true, formatter: '{b}: {d}%'},
        labelLine: { show: true },
        data: statusDistribution.map((item) => ({ value: item.value, name: item.name }))
      }
    ]
  }), [statusDistribution]);

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
    // Notify user that export has started
    showSuccess('Export Started', 'Your dashboard data is being exported');

    // Prepare CSV content for the currently filtered bookings
    const headers = [
      'LR Number',
      'Date',
      'From Branch',
      'To Branch',
      'Customer',
      'Status',
      'Amount'
    ];

    let csv = headers.join(',') + '\n';

    filteredBookings.forEach(b => {
      const customerName =
        b.from_branch === currentBranch?.id
          ? b.receiver?.name || ''
          : b.sender?.name || '';

      const row = [
        b.lr_number,
        new Date(b.created_at).toLocaleDateString(),
        b.from_branch_details?.name || '',
        b.to_branch_details?.name || '',
        customerName,
        b.status.replace('_', ' '),
        b.total_amount?.toString() || ''
      ];

      csv +=
        row
          .map(value => `"${String(value).replace(/"/g, '""')}"`)
          .join(',') +
        '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_export_${new Date()
      .toISOString()
      .split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess('Export Complete', 'Dashboard data exported successfully');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshBookings(),
        refreshVehicles(),
        refreshCustomers()
      ]);
      showSuccess('Dashboard Refreshed', 'Dashboard data has been updated');
    } finally {
      setRefreshing(false);
    }
  };

  const isLoading =
    bookingsLoading || vehiclesLoading || customersLoading || refreshing;

  return (
    <div className="space-y-6">
      {/* Quick Actions - 4 Square Boxes */}
      <QuickActionCards />

      {/* Date Filter */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="card-premium"
      >
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="h-14 w-14 gradient-brand rounded-2xl flex items-center justify-center shadow-lg"
            >
              <BarChart3 className="h-7 w-7 text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-foreground">K2K Logistics Overview</h2>
              <p className="text-muted-foreground mt-1">Analytics and performance metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleRefresh} variant="secondary" className="btn-secondary group">
              <RefreshCw className={`h-4 w-4 mr-2 transition-transform group-hover:rotate-180 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleExport} className="btn-gradient group">
              <Download className="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
              Export
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-muted-foreground mb-2 block">Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="input-premium">
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
                <Label className="text-muted-foreground mb-2 block">Start Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="date"
                    className="input-premium pl-10"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground mb-2 block">End Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="date"
                    className="input-premium pl-10"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className={dateRange === 'custom' ? 'md:col-span-1' : 'md:col-span-3'}>
            <Label className="text-muted-foreground mb-2 block">Search</Label>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-brand-600 transition-colors" />
              <Input
                className="input-premium pl-10"
                placeholder="Search by LR, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {refreshing || bookingsLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card-premium p-12 flex items-center justify-center mt-6"
            role="status"
            aria-live="polite"
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-16 w-16 rounded-full gradient-brand p-0.5"
                aria-hidden="true"
              >
                <div className="h-full w-full rounded-full bg-background flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                </div>
              </motion.div>
              <p className="text-muted-foreground font-medium animate-pulse">Loading dashboard data...</p>
            </div>
          </motion.div>
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
                  value={stats.totalVehicles.toString()}
                  color="green"
                  details={[
                    { label: 'Active', value: stats.activeVehicles },
                    { label: 'Maintenance', value: stats.maintenanceVehicles },
                    { label: 'Inactive', value: stats.inactiveVehicles },
                    { label: 'Utilization', value: stats.utilization, suffix: '%' }
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
                    { label: 'Companies', value: stats.companies },
                    { label: 'Individuals', value: stats.individuals },
                    { label: 'Active', value: stats.activeCustomers }
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
                className="card-premium group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: -10 }}
                      className="h-10 w-10 gradient-brand rounded-xl flex items-center justify-center shadow-md"
                    >
                      <BarChart3 className="h-5 w-5 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-heading font-semibold text-foreground">Daily Activity</h3>
                      <p className="text-sm text-muted-foreground">Bookings and deliveries over time</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                      <span className="text-muted-foreground">Bookings</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                      <span className="text-muted-foreground">Delivered</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm"></div>
                      <span className="text-muted-foreground">Revenue</span>
                    </div>
                  </div>
                </div>
                <div className="h-[300px]">
                  {bookingTrends.length > 0 ? (
                    <ReactECharts option={dailyOptions} style={{ height: 300 }} />
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
                className="card-premium group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      className="h-10 w-10 gradient-brand rounded-xl flex items-center justify-center shadow-md"
                    >
                      <Filter className="h-5 w-5 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-heading font-semibold text-foreground">Booking Status</h3>
                      <p className="text-sm text-muted-foreground">Distribution by status</p>
                    </div>
                  </div>
                </div>
                <div className="h-[300px]">
                  {statusDistribution.some(item => item.value > 0) ? (
                    <ReactECharts option={statusOptions} style={{ height: 250 }} />
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
              className="card-premium mt-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: -10 }}
                    className="h-10 w-10 gradient-brand rounded-xl flex items-center justify-center shadow-md"
                  >
                    <FileText className="h-5 w-5 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-heading font-semibold text-foreground">Recent Bookings</h3>
                    <p className="text-sm text-muted-foreground">Latest booking activity</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="btn-ghost group"
                  onClick={() => navigate('/dashboard/bookings')}
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 rounded-lg">
                      <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3 rounded-l-lg">LR Number</th>
                      <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Date</th>
                      <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">From/To</th>
                      <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Customer</th>
                      <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Status</th>
                      <th className="text-right text-sm font-medium text-muted-foreground px-4 py-3 rounded-r-lg">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredBookings.slice(0, 5).map((booking, index) => (
                      <motion.tr 
                        key={booking.id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-accent/50 transition-all duration-200 group cursor-pointer"
                        onClick={() => navigate(`/dashboard/bookings/${booking.id}`)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-brand-600 dark:text-brand-400 group-hover:text-brand-700 dark:group-hover:text-brand-300">{booking.lr_number}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {booking.from_branch === currentBranch?.id 
                            ? <span className="flex items-center gap-1.5"><ArrowUpRight className="h-3.5 w-3.5 text-green-600 dark:text-green-400" /> <span className="text-muted-foreground">{booking.to_branch_details?.name}</span></span>
                            : <span className="flex items-center gap-1.5"><ArrowDownRight className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> <span className="text-muted-foreground">{booking.from_branch_details?.name}</span></span>
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {booking.from_branch === currentBranch?.id 
                            ? booking.sender?.name
                            : booking.receiver?.name
                          }
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            booking.status === 'delivered'
                              ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20'
                              : booking.status === 'in_transit'
                              ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                              : booking.status === 'cancelled'
                              ? 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20'
                              : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20'
                          }`}>
                            {booking.status.replace('_', ' ').charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-foreground">₹{booking.total_amount.toLocaleString()}</span>
                        </td>
                      </motion.tr>
                    ))}
                    
                    {filteredBookings.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center"
                          >
                            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-heading font-medium text-foreground">No bookings found</h3>
                            <p className="text-muted-foreground mt-1">No bookings available for the selected period</p>
                          </motion.div>
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
      gradient: 'from-blue-500 via-blue-600 to-blue-700',
      bg: 'bg-blue-500/10',
      text: 'text-blue-700',
      border: 'border-blue-500/20',
      detailBg: 'bg-blue-500/5',
      darkText: 'dark:text-blue-400',
      darkBg: 'dark:bg-blue-500/20',
      shadow: 'hover:shadow-blue-500/20'
    },
    green: {
      gradient: 'from-green-500 via-green-600 to-green-700',
      bg: 'bg-green-500/10',
      text: 'text-green-700',
      border: 'border-green-500/20',
      detailBg: 'bg-green-500/5',
      darkText: 'dark:text-green-400',
      darkBg: 'dark:bg-green-500/20',
      shadow: 'hover:shadow-green-500/20'
    },
    purple: {
      gradient: 'from-purple-500 via-purple-600 to-purple-700',
      bg: 'bg-purple-500/10',
      text: 'text-purple-700',
      border: 'border-purple-500/20',
      detailBg: 'bg-purple-500/5',
      darkText: 'dark:text-purple-400',
      darkBg: 'dark:bg-purple-500/20',
      shadow: 'hover:shadow-purple-500/20'
    },
    amber: {
      gradient: 'from-amber-500 via-amber-600 to-amber-700',
      bg: 'bg-amber-500/10',
      text: 'text-amber-700',
      border: 'border-amber-500/20',
      detailBg: 'bg-amber-500/5',
      darkText: 'dark:text-amber-400',
      darkBg: 'dark:bg-amber-500/20',
      shadow: 'hover:shadow-amber-500/20'
    },
    red: {
      gradient: 'from-red-500 via-red-600 to-red-700',
      bg: 'bg-red-500/10',
      text: 'text-red-700',
      border: 'border-red-500/20',
      detailBg: 'bg-red-500/5',
      darkText: 'dark:text-red-400',
      darkBg: 'dark:bg-red-500/20',
      shadow: 'hover:shadow-red-500/20'
    },
    indigo: {
      gradient: 'from-indigo-500 via-indigo-600 to-indigo-700',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-700',
      border: 'border-indigo-500/20',
      detailBg: 'bg-indigo-500/5',
      darkText: 'dark:text-indigo-400',
      darkBg: 'dark:bg-indigo-500/20',
      shadow: 'hover:shadow-indigo-500/20'
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={`card-premium group ${colors[color].shadow} relative overflow-hidden h-full`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors[color].gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 10 }}
            className={`p-3 rounded-2xl bg-gradient-to-br ${colors[color].gradient} shadow-lg`}
          >
            <Icon className="h-6 w-6 text-white" />
          </motion.div>
          {trend && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-1 ${trend.isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {trend.isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              <span className="text-sm font-medium">{trend.value}</span>
            </motion.div>
          )}
        </div>
        
        <div className="mb-4">
          <h3 className="text-3xl font-heading font-bold text-foreground mb-1 group-hover:scale-105 transition-transform origin-left">{value}</h3>
          <p className="text-muted-foreground text-sm">{title}</p>
        </div>

        {details && (
          <div className="grid grid-cols-2 gap-2">
            {details.map(({ label, value, prefix, suffix }, index) => (
              <motion.div 
                key={label} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`${colors[color].detailBg} rounded-xl p-3 border ${colors[color].border}`}
              >
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <p className={`text-sm font-semibold ${colors[color].text} ${colors[color].darkText}`}>
                  {prefix}{value.toLocaleString()}{suffix}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
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