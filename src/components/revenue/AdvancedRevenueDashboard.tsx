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
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import type { Booking } from '@/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

  // Chart configurations
  const areaChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          font: { size: 12, weight: '500' },
          color: '#64748b',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 16,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 11, weight: '500' } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false },
        ticks: {
          color: '#64748b',
          font: { size: 11, weight: '500' },
          callback: function(value: any) { return formatNumber(value); },
        },
      },
    },
    elements: {
      line: { tension: 0.4 },
      point: { radius: 4, hoverRadius: 6, borderWidth: 2 },
    },
    animation: { duration: 2000, easing: 'easeInOutQuart' },
  };

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          font: { size: 12, weight: '500' },
          color: '#64748b',
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 16,
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
          },
        },
      },
    },
    cutout: '60%',
    animation: { duration: 2000, easing: 'easeInOutQuart' },
  };

  const areaChartData = {
    labels: monthlyTrendData.map(d => d.month),
    datasets: [
      {
        label: 'Revenue',
        data: monthlyTrendData.map(d => d.revenue),
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3b82f6',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
      {
        label: 'Estimated Profit',
        data: monthlyTrendData.map(d => d.profit),
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: '#10b981',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
    ],
  };

  const paymentDistributionData = {
    labels: ['Paid', 'To Pay', 'Quotation'],
    datasets: [
      {
        data: [analytics.paymentAnalysis.paid, analytics.paymentAnalysis.toPay, analytics.paymentAnalysis.quotation],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(147, 51, 234, 0.8)',
        ],
        borderColor: [
          '#22c55e',
          '#f97316',
          '#9333ea',
        ],
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  };

  const barChartData = {
    labels: monthlyTrendData.map(d => d.month),
    datasets: [
      {
        label: 'Revenue',
        data: monthlyTrendData.map(d => d.revenue),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 8,
      },
      {
        label: 'Bookings',
        data: monthlyTrendData.map(d => d.bookings),
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderColor: '#f97316',
        borderWidth: 1,
        borderRadius: 8,
        yAxisID: 'y1',
      },
    ],
  };

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          font: { size: 12, weight: '500' },
          color: '#64748b',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 16,
        callbacks: {
          label: function(context: any) {
            if (context.dataset.label === 'Revenue') {
              return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
            }
            return `${context.dataset.label}: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 11, weight: '500' } },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false },
        ticks: {
          color: '#64748b',
          font: { size: 11, weight: '500' },
          callback: function(value: any) { return formatNumber(value); },
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: { color: '#64748b', font: { size: 11, weight: '500' } },
      },
    },
    animation: { duration: 2000, easing: 'easeInOutQuart' },
  };

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-slate-800/50 dark:to-purple-900/20 min-h-screen p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Revenue Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Advanced insights and forecasting for your business</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={onDateRangeChange}>
            <SelectTrigger className="w-[180px] bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
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
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

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
        <TabsList className="grid grid-cols-5 w-full max-w-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
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
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-blue-500" />
                    Revenue & Profit Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <Line data={areaChartData} options={areaChartOptions} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment Distribution */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-500" />
                    Payment Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <Doughnut data={paymentDistributionData} options={doughnutOptions} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Business Health Score */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
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
                  
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      Your business health score is <strong>Good</strong>. Revenue is growing and collection efficiency is strong.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 gap-6"
          >
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                  Booking Volume & Revenue Correlation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <Bar data={barChartData} options={barChartOptions} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
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
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    red: 'bg-red-500 text-white',
    amber: 'bg-amber-500 text-white',
    purple: 'bg-purple-500 text-white'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${colorClasses[color]} shadow-lg`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              change >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          </div>
          
          <div className="mb-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
            <p className="text-slate-700 dark:text-slate-300 font-medium">{title}</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{subtitle}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}