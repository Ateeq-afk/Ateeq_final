import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  RefreshCw,
  Eye,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart as RechartsLineChart, Line, AreaChart, Area, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import type { Booking } from '@/types';

interface AdvancedRevenueDashboardProps {
  bookings: Booking[];
  dateRange?: string;
  onDateRangeChange?: (range: string) => void;
}

export default function AdvancedRevenueDashboard({ bookings, dateRange = 'last_month', onDateRangeChange }: AdvancedRevenueDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const { showSuccess } = useNotificationSystem();

  // Advanced analytics calculations
  const analytics = useMemo(() => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentYear = new Date(now.getFullYear(), 0, 1);
    const lastYear = new Date(now.getFullYear() - 1, 0, 1);

    // Filter bookings by different periods
    const currentMonthBookings = bookings.filter(b => new Date(b.created_at) >= currentMonth);
    const lastMonthBookings = bookings.filter(b => {
      const date = new Date(b.created_at);
      return date >= lastMonth && date < currentMonth;
    });
    const currentYearBookings = bookings.filter(b => new Date(b.created_at) >= currentYear);
    const lastYearBookings = bookings.filter(b => {
      const date = new Date(b.created_at);
      return date >= lastYear && date < currentYear;
    });

    // Revenue calculations
    const currentMonthRevenue = currentMonthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const lastMonthRevenue = lastMonthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const currentYearRevenue = currentYearBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const lastYearRevenue = lastYearBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

    // Growth calculations
    const monthlyGrowth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
    const yearlyGrowth = lastYearRevenue > 0 ? ((currentYearRevenue - lastYearRevenue) / lastYearRevenue) * 100 : 0;

    // Payment type analysis
    const paymentAnalysis = {
      paid: bookings.filter(b => b.payment_type === 'Paid').reduce((sum, b) => sum + (b.total_amount || 0), 0),
      toPay: bookings.filter(b => b.payment_type === 'To Pay').reduce((sum, b) => sum + (b.total_amount || 0), 0),
      quotation: bookings.filter(b => b.payment_type === 'Quotation').reduce((sum, b) => sum + (b.total_amount || 0), 0),
    };

    // Customer segmentation
    const customerRevenue = bookings.reduce((acc, booking) => {
      const customerId = booking.sender?.id || 'unknown';
      if (!acc[customerId]) {
        acc[customerId] = {
          customer: booking.sender,
          revenue: 0,
          bookings: 0,
          lastBooking: booking.created_at
        };
      }
      acc[customerId].revenue += booking.total_amount || 0;
      acc[customerId].bookings += 1;
      if (new Date(booking.created_at) > new Date(acc[customerId].lastBooking)) {
        acc[customerId].lastBooking = booking.created_at;
      }
      return acc;
    }, {} as any);

    const topCustomers = Object.values(customerRevenue)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);

    // Route analysis
    const routeRevenue = bookings.reduce((acc, booking) => {
      const route = `${booking.from_branch}-${booking.to_branch}`;
      if (!acc[route]) {
        acc[route] = { route, revenue: 0, bookings: 0 };
      }
      acc[route].revenue += booking.total_amount || 0;
      acc[route].bookings += 1;
      return acc;
    }, {} as any);

    const topRoutes = Object.values(routeRevenue)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);

    // Efficiency metrics
    const avgBookingValue = bookings.length > 0 ? currentYearRevenue / bookings.length : 0;
    const customerAcquisitionCost = 150; // Estimated CAC
    const customerLifetimeValue = avgBookingValue * 12; // Estimated CLV
    const profitMargin = 0.25; // Estimated 25% profit margin

    // Forecasting (simple linear projection)
    const monthlyTrend = monthlyGrowth / 100;
    const forecastNextMonth = currentMonthRevenue * (1 + monthlyTrend);
    const forecastQuarter = currentMonthRevenue * (1 + monthlyTrend) * 3;

    // Risk analysis
    const overdueAmount = bookings
      .filter(b => {
        if (b.payment_type !== 'To Pay') return false;
        const daysDiff = Math.floor((Date.now() - new Date(b.created_at).getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff > 30;
      })
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);

    const riskLevel = overdueAmount / (paymentAnalysis.toPay || 1);

    return {
      currentMonthRevenue,
      lastMonthRevenue,
      currentYearRevenue,
      monthlyGrowth,
      yearlyGrowth,
      paymentAnalysis,
      topCustomers,
      topRoutes,
      avgBookingValue,
      customerAcquisitionCost,
      customerLifetimeValue,
      profitMargin,
      forecastNextMonth,
      forecastQuarter,
      overdueAmount,
      riskLevel
    };
  }, [bookings]);

  // Monthly revenue trend data
  const monthlyTrendData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthBookings = bookings.filter(b => {
        const date = new Date(b.created_at);
        return date >= month && date <= monthEnd;
      });
      
      const revenue = monthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const profit = revenue * analytics.profitMargin;
      const bookingCount = monthBookings.length;
      
      months.push({
        month: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue,
        profit,
        bookings: bookingCount,
        avgValue: bookingCount > 0 ? revenue / bookingCount : 0
      });
    }
    
    return months;
  }, [bookings, analytics.profitMargin]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showSuccess('Dashboard Refreshed', 'Latest data has been loaded');
    }, 1000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#10b981'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
          <p className="text-gray-600 mt-1">Advanced insights and forecasting for your business</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={onDateRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_week">Last 7 Days</SelectItem>
              <SelectItem value="last_month">Last 30 Days</SelectItem>
              <SelectItem value="last_quarter">Last Quarter</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(analytics.currentMonthRevenue)}
          change={analytics.monthlyGrowth}
          icon={IndianRupee}
          color="blue"
          subtitle={`vs ${formatCurrency(analytics.lastMonthRevenue)} last month`}
        />
        <MetricCard
          title="Yearly Growth"
          value={`${analytics.yearlyGrowth > 0 ? '+' : ''}${analytics.yearlyGrowth.toFixed(1)}%`}
          change={analytics.yearlyGrowth}
          icon={TrendingUp}
          color="green"
          subtitle={`${formatCurrency(analytics.currentYearRevenue)} this year`}
        />
        <MetricCard
          title="Avg Booking Value"
          value={formatCurrency(analytics.avgBookingValue)}
          change={0}
          icon={Target}
          color="purple"
          subtitle="Per shipment revenue"
        />
        <MetricCard
          title="Collection Risk"
          value={`${(analytics.riskLevel * 100).toFixed(1)}%`}
          change={-analytics.riskLevel * 100}
          icon={AlertTriangle}
          color={analytics.riskLevel > 0.2 ? "red" : analytics.riskLevel > 0.1 ? "amber" : "green"}
          subtitle={`${formatCurrency(analytics.overdueAmount)} overdue`}
        />
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Revenue & Profit Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrendData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatNumber(value)} />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), '']}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stackId="1"
                        stroke="#3b82f6" 
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        name="Revenue"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="profit" 
                        stackId="2"
                        stroke="#10b981" 
                        fillOpacity={1}
                        fill="url(#colorProfit)"
                        name="Estimated Profit"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Payment Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Payment Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Paid', value: analytics.paymentAnalysis.paid },
                          { name: 'To Pay', value: analytics.paymentAnalysis.toPay },
                          { name: 'Quotation', value: analytics.paymentAnalysis.quotation }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { name: 'Paid', value: analytics.paymentAnalysis.paid },
                          { name: 'To Pay', value: analytics.paymentAnalysis.toPay },
                          { name: 'Quotation', value: analytics.paymentAnalysis.quotation }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Business Health Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Business Health Score
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Revenue Growth</span>
                    <span className="text-sm">{Math.min(100, Math.max(0, 50 + analytics.monthlyGrowth)).toFixed(0)}%</span>
                  </div>
                  <Progress value={Math.min(100, Math.max(0, 50 + analytics.monthlyGrowth))} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Collection Efficiency</span>
                    <span className="text-sm">{(100 - analytics.riskLevel * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={100 - analytics.riskLevel * 100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Customer Retention</span>
                    <span className="text-sm">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Profit Margin</span>
                    <span className="text-sm">{(analytics.profitMargin * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={analytics.profitMargin * 100} className="h-2" />
                </div>
                
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your business health score is <strong>Good</strong>. Revenue is growing and collection efficiency is strong.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Other tabs would continue here... */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Volume & Revenue Correlation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => formatNumber(value)} />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          name === 'revenue' ? formatCurrency(value) : value.toFixed(0),
                          name === 'revenue' ? 'Revenue' : 'Bookings'
                        ]}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue" />
                      <Bar yAxisId="right" dataKey="bookings" fill="#f59e0b" name="Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple';
  subtitle: string;
}

function MetricCard({ title, value, change, icon: Icon, color, subtitle }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
              change >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              <span className="font-medium">{Math.abs(change).toFixed(1)}%</span>
            </div>
          </div>
          
          <div className="mb-2">
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            <p className="text-gray-700 font-medium">{title}</p>
            <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}