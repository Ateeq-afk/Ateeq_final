import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  Wallet,
  BarChart3,
  Calendar,
  Download,
  Filter,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  FileText,
  Zap,
  Shield,
  PieChart,
  Users,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { dashboardService } from '@/services/dashboard';
import { 
  AppleLineChart, 
  AppleBarChart, 
  AppleDonutChart, 
  AppleSparkline,
  AppleActivityRings 
} from '@/components/charts/AppleCharts';
import { 
  ActivityIndicator, 
  MetricCardSkeleton, 
  TransactionSkeleton, 
  LoadingCard 
} from '@/components/ui/loading-states';

// Enhanced Stripe-inspired financial metric card
const FinancialMetricCard = ({ 
  title, 
  value, 
  change, 
  trend, 
  subtitle, 
  icon: Icon, 
  color = 'blue',
  onClick,
  loading = false 
}) => {
  const colorClasses = {
    green: {
      icon: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950/20',
      border: 'border-green-200/50 dark:border-green-800/30',
      trend: 'text-green-600 dark:text-green-400',
      accent: 'from-green-500/5 to-green-600/5'
    },
    red: {
      icon: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200/50 dark:border-red-800/30',
      trend: 'text-red-600 dark:text-red-400',
      accent: 'from-red-500/5 to-red-600/5'
    },
    blue: {
      icon: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200/50 dark:border-blue-800/30',
      trend: 'text-blue-600 dark:text-blue-400',
      accent: 'from-blue-500/5 to-blue-600/5'
    },
    purple: {
      icon: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      border: 'border-purple-200/50 dark:border-purple-800/30',
      trend: 'text-purple-600 dark:text-purple-400',
      accent: 'from-purple-500/5 to-purple-600/5'
    },
    orange: {
      icon: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      border: 'border-orange-200/50 dark:border-orange-800/30',
      trend: 'text-orange-600 dark:text-orange-400',
      accent: 'from-orange-500/5 to-orange-600/5'
    }
  };

  const colors = colorClasses[color];

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
      className={cn(
        "relative p-6 rounded-2xl bg-white dark:bg-gray-900/50",
        "border", colors.border,
        "shadow-sm hover:shadow-lg transition-all duration-300",
        "cursor-pointer group overflow-hidden",
        "backdrop-blur-sm"
      )}
    >
      {/* Stripe-style accent gradient */}
      <div className={cn("absolute inset-0 bg-gradient-to-br", colors.accent, "opacity-30")} />
      
      {/* Noise texture for depth */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-5">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={cn("p-3 rounded-xl transition-colors duration-300", colors.bg)}
          >
            <Icon className={cn("h-5 w-5", colors.icon)} strokeWidth={1.5} />
          </motion.div>
          {trend && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium",
                "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm",
                trend === 'up' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}
            >
              {trend === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              <span className="text-xs font-semibold">{Math.abs(change || 0)}%</span>
            </motion.div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-label-md text-secondary font-medium tracking-tight">{title}</p>
          {loading ? (
            <div className="space-y-2">
              <div className="skeleton-wave h-8 w-36" />
              <div className="skeleton-pulse h-4 w-24" />
            </div>
          ) : (
            <>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="text-3xl font-bold text-primary tracking-tight leading-none"
              >
                {value}
              </motion.p>
              {subtitle && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="text-caption text-tertiary font-medium"
                >
                  {subtitle}
                </motion.p>
              )}
            </>
          )}
        </div>

        {/* Hover indicator */}
        <motion.div
          className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
          initial={{ x: 10, opacity: 0 }}
          whileHover={{ x: 0, opacity: 1 }}
        >
          <div className="w-8 h-8 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-sm flex items-center justify-center">
            <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Enhanced Stripe-inspired transaction list item
const TransactionItem = ({ transaction, index }) => {
  const isIncome = transaction.type === 'income';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ x: 4, backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
      className={cn(
        "group relative flex items-center justify-between p-4 rounded-xl transition-all duration-300",
        "hover:bg-gray-50/70 dark:hover:bg-gray-800/30",
        "hover:shadow-sm hover:border-gray-200/50 dark:hover:border-gray-700/50",
        "border border-transparent cursor-pointer"
      )}
    >
      {/* Hover accent line */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r opacity-0 group-hover:opacity-100 transition-all duration-300"
        initial={{ scaleY: 0 }}
        whileHover={{ scaleY: 1 }}
      />
      
      <div className="flex items-center gap-4">
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300",
            "shadow-sm border",
            isIncome 
              ? "bg-green-50 dark:bg-green-950/20 border-green-200/50 dark:border-green-800/30" 
              : "bg-red-50 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/30"
          )}
        >
          {isIncome ? (
            <ArrowDownRight className="h-5 w-5 text-green-600 dark:text-green-400" strokeWidth={2} />
          ) : (
            <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-400" strokeWidth={2} />
          )}
        </motion.div>
        
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-primary text-body-md truncate">
            {transaction.description}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-caption text-tertiary">
              {transaction.date}
            </p>
            <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span className={cn(
              "text-caption px-2 py-0.5 rounded-full font-medium",
              "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            )}>
              {transaction.category}
            </span>
          </div>
        </div>
      </div>
      
      <div className="text-right flex-shrink-0 ml-4">
        <motion.p 
          whileHover={{ scale: 1.05 }}
          className={cn(
            "font-bold text-lg tabular-nums leading-none",
            isIncome ? "text-green-600 dark:text-green-400" : "text-primary"
          )}
        >
          {isIncome ? '+' : '-'}₹{Math.abs(transaction.amount).toLocaleString()}
        </motion.p>
        <p className="text-caption text-tertiary mt-1 tabular-nums">
          {transaction.time || ''}
        </p>
      </div>
      
      {/* Hover arrow */}
      <motion.div
        className="absolute right-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
        initial={{ x: -10 }}
        whileHover={{ x: 0 }}
      >
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </motion.div>
    </motion.div>
  );
};

// Stripe-inspired quick action card
const QuickActionCard = ({ icon: Icon, title, description, color, onClick }) => {
  const colorClasses = {
    blue: {
      icon: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200/50 dark:border-blue-800/30',
      hover: 'hover:bg-blue-100/70 dark:hover:bg-blue-950/30'
    },
    green: {
      icon: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950/20',
      border: 'border-green-200/50 dark:border-green-800/30',
      hover: 'hover:bg-green-100/70 dark:hover:bg-green-950/30'
    },
    purple: {
      icon: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      border: 'border-purple-200/50 dark:border-purple-800/30',
      hover: 'hover:bg-purple-100/70 dark:hover:bg-purple-950/30'
    },
    orange: {
      icon: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      border: 'border-orange-200/50 dark:border-orange-800/30',
      hover: 'hover:bg-orange-100/70 dark:hover:bg-orange-950/30'
    }
  };

  const colors = colorClasses[color];

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative p-6 rounded-2xl bg-white dark:bg-gray-900/50",
        "border", colors.border,
        "shadow-sm hover:shadow-lg transition-all duration-300",
        "cursor-pointer overflow-hidden text-center",
        "haptic-medium hover-lift-subtle",
        colors.hover
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="relative z-10">
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4",
            "shadow-sm border transition-all duration-300",
            colors.bg, colors.border
          )}
        >
          <Icon className={cn("h-7 w-7", colors.icon)} strokeWidth={1.5} />
        </motion.div>
        
        <h3 className="font-semibold text-primary text-body-md mb-1">
          {title}
        </h3>
        <p className="text-caption text-tertiary">
          {description}
        </p>

        {/* Hover indicator */}
        <motion.div
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
          initial={{ scale: 0.8 }}
          whileHover={{ scale: 1 }}
        >
          <div className="w-6 h-6 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <ChevronRight className="h-3 w-3 text-gray-500" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Cash flow visualization
const CashFlowChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
    );
  }

  return (
    <div className="relative h-64">
      <AppleBarChart height={256} />
      <div className="absolute bottom-0 left-0 right-0 flex justify-around text-xs text-gray-500 dark:text-gray-400">
        <span>Jan</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Apr</span>
        <span>May</span>
        <span>Jun</span>
      </div>
    </div>
  );
};

export default function AppleFinancialDashboard() {
  const { selectedBranch } = useBranchSelection();
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch financial data
  const { data: financialData = {}, isLoading } = useQuery({
    queryKey: ['financial-dashboard', selectedBranch?.id, timeRange],
    queryFn: () => dashboardService.getDashboardData(selectedBranch?.id),
    refetchInterval: 60000 // Refresh every minute
  });

  // Mock data for demonstration
  const metrics = {
    totalRevenue: 2847650,
    totalExpenses: 1923450,
    netProfit: 924200,
    cashBalance: 3456780,
    accountsReceivable: 892340,
    accountsPayable: 456230,
    revenueGrowth: 18.5,
    expenseGrowth: 12.3,
    profitMargin: 32.4,
    cashFlowStatus: 'positive'
  };

  const recentTransactions = [
    { id: 1, type: 'income', description: 'Booking Payment - #BK2024001', amount: 12500, date: 'Today', time: '2:30 PM', category: 'Booking Revenue' },
    { id: 2, type: 'expense', description: 'Fuel Purchase - Vehicle DL01AB1234', amount: 5600, date: 'Today', time: '11:45 AM', category: 'Operations' },
    { id: 3, type: 'income', description: 'Payment Received - Invoice #INV2024234', amount: 45600, date: 'Yesterday', time: '4:20 PM', category: 'Collections' },
    { id: 4, type: 'expense', description: 'Driver Salary - March 2024', amount: 85000, date: 'Yesterday', time: '10:00 AM', category: 'Payroll' },
    { id: 5, type: 'income', description: 'Booking Payment - #BK2024002', amount: 8900, date: '2 days ago', time: '3:15 PM', category: 'Booking Revenue' }
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-semibold text-gray-900 dark:text-gray-100"
              >
                Financial Dashboard
              </motion.h1>
              <Badge variant="outline" className="text-xs">
                {selectedBranch?.name || 'All Branches'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32 h-9 bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                  <SelectItem value="1y">1 year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" className="h-9">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={cn(
                    "h-9 transition-all duration-300 haptic-medium",
                    refreshing && "cursor-not-allowed opacity-50"
                  )}
                >
                  <motion.div
                    animate={{ rotate: refreshing ? 360 : 0 }}
                    transition={{ 
                      duration: refreshing ? 1 : 0.3, 
                      repeat: refreshing ? Infinity : 0,
                      ease: refreshing ? "linear" : "easeOut"
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </motion.div>
                  {refreshing && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="ml-2"
                    >
                      <ActivityIndicator size="sm" />
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-grid-tight"
        >
          {isLoading ? (
            // Show skeleton cards while loading
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            // Show actual data with staggered animation
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <FinancialMetricCard
                  title="Total Revenue"
                  value={formatCurrency(metrics.totalRevenue)}
                  change={metrics.revenueGrowth}
                  trend="up"
                  icon={DollarSign}
                  color="green"
                  subtitle="This month"
                  loading={false}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FinancialMetricCard
                  title="Total Expenses"
                  value={formatCurrency(metrics.totalExpenses)}
                  change={metrics.expenseGrowth}
                  trend="up"
                  icon={Receipt}
                  color="red"
                  subtitle="Operating costs"
                  loading={false}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <FinancialMetricCard
                  title="Net Profit"
                  value={formatCurrency(metrics.netProfit)}
                  change={metrics.profitMargin}
                  trend="up"
                  icon={TrendingUp}
                  color="blue"
                  subtitle={`${metrics.profitMargin}% margin`}
                  loading={false}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <FinancialMetricCard
                  title="Cash Balance"
                  value={formatCurrency(metrics.cashBalance)}
                  icon={Wallet}
                  color="purple"
                  subtitle="Available funds"
                  loading={false}
                />
              </motion.div>
            </>
          )}
        </motion.div>

        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Revenue Trends */}
          <Card className="lg:col-span-2 border-gray-200/50 dark:border-gray-800/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Revenue Trends</CardTitle>
                  <CardDescription className="text-sm">Monthly revenue performance</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="revenue" className="w-full">
                <TabsList className="grid grid-cols-3 w-full max-w-md">
                  <TabsTrigger value="revenue">Revenue</TabsTrigger>
                  <TabsTrigger value="expenses">Expenses</TabsTrigger>
                  <TabsTrigger value="profit">Profit</TabsTrigger>
                </TabsList>
                <TabsContent value="revenue" className="mt-4">
                  <AppleLineChart height={300} loading={isLoading} />
                </TabsContent>
                <TabsContent value="expenses" className="mt-4">
                  <AppleBarChart height={300} loading={isLoading} />
                </TabsContent>
                <TabsContent value="profit" className="mt-4">
                  <AppleLineChart height={300} loading={isLoading} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <Card className="border-gray-200/50 dark:border-gray-800/50">
            <CardHeader>
              <CardTitle className="text-lg">Expense Breakdown</CardTitle>
              <CardDescription className="text-sm">Category distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <AppleDonutChart height={250} loading={isLoading} />
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Operations</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Payroll</span>
                  <span className="text-sm font-medium">30%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Maintenance</span>
                  <span className="text-sm font-medium">15%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Other</span>
                  <span className="text-sm font-medium">10%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Financial Health & Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Financial Health */}
          <Card className="border-gray-200/50 dark:border-gray-800/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Financial Health
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Good
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cash Flow Status */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Cash Flow</span>
                  <Badge variant="outline" className="text-xs">
                    <Activity className="h-3 w-3 mr-1" />
                    Positive
                  </Badge>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-semibold text-green-600 dark:text-green-400">
                    +₹456K
                  </span>
                  <span className="text-sm text-gray-500 mb-0.5">this month</span>
                </div>
                <AppleSparkline height={40} color="#10B981" className="mt-2" />
              </div>

              {/* Outstanding */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Receivables</span>
                    <span className="text-sm font-medium">₹892K</span>
                  </div>
                  <Progress value={65} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">65% collected</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Payables</span>
                    <span className="text-sm font-medium">₹456K</span>
                  </div>
                  <Progress value={45} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">45% paid</p>
                </div>
              </div>

              {/* Activity Rings */}
              <div className="flex items-center justify-center pt-4">
                <AppleActivityRings
                  rings={[
                    { value: 75, max: 100, color: '#007AFF', label: 'Revenue' },
                    { value: 60, max: 100, color: '#34C759', label: 'Collections' },
                    { value: 85, max: 100, color: '#AF52DE', label: 'Efficiency' }
                  ]}
                  size={120}
                />
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="lg:col-span-2 border-gray-200/50 dark:border-gray-800/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Transactions</CardTitle>
                <Button variant="ghost" size="sm" className="text-sm">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 p-6">
              {isLoading ? (
                <div className="space-y-1">
                  {[...Array(5)].map((_, i) => (
                    <TransactionSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    {recentTransactions.map((transaction, index) => (
                      <TransactionItem
                        key={transaction.id}
                        transaction={transaction}
                        index={index}
                      />
                    ))}
                  </div>
                  
                  {/* View more link */}
                  <motion.button
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex items-center gap-2 w-full p-4 mt-4 rounded-xl",
                      "text-blue-600 dark:text-blue-400 font-medium text-sm",
                      "hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-300",
                      "haptic-light"
                    )}
                  >
                    <span>View all transactions</span>
                    <motion.div
                      animate={{ x: [0, 2, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </motion.div>
                  </motion.button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-grid-tight"
        >
          <QuickActionCard
            icon={FileText}
            title="Generate Invoice"
            description="Create new invoice"
            color="blue"
            onClick={() => {}}
          />
          <QuickActionCard
            icon={CreditCard}
            title="Record Payment"
            description="Log new payment"
            color="green"
            onClick={() => {}}
          />
          <QuickActionCard
            icon={BarChart3}
            title="View Reports"
            description="Financial analytics"
            color="purple"
            onClick={() => {}}
          />
          <QuickActionCard
            icon={Users}
            title="Customer Credits"
            description="Manage credits"
            color="orange"
            onClick={() => {}}
          />
        </motion.div>
      </div>
    </div>
  );
}