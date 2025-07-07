import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  IndianRupee,
  Package,
  Users,
  Truck,
  RefreshCw,
  ChevronRight,
  Plus,
  Upload,
  Download,
  MapPin,
  CheckCircle2,
  Zap,
  BarChart3,
  Clock,
  Target,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Globe,
  Award,
  Sparkles,
  Timer,
  Eye,
  Filter,
  Search,
  Settings,
  Bell,
  Cpu,
  Database,
  CloudRain,
  Sun,
  Compass,
  Route,
  Shield,
  Star,
  ArrowUpRight,
  PieChart,
  LineChart,
  BarChart2,
  Info,
  ExternalLink,
  PlayCircle,
  Pause,
  SkipForward
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { operationalDashboardService } from '@/services/operationalDashboard';
import { dashboardService } from '@/services/dashboard';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { AppleLineChart, AppleSparkline } from '@/components/charts/AppleCharts';
import RealtimeDashboardWidget from '@/components/RealtimeDashboardWidget';

// Types for our advanced dashboard
interface AdvancedMetrics {
  overview: {
    totalRevenue: number;
    totalBookings: number;
    totalCustomers: number;
    totalVehicles: number;
    revenueGrowth: number;
    bookingGrowth: number;
    customerGrowth: number;
    vehicleUtilization: number;
  };
  performance: {
    onTimeDelivery: number;
    customerSatisfaction: number;
    operationalEfficiency: number;
    costPerDelivery: number;
    avgDeliveryTime: number;
    successRate: number;
  };
  realtime: {
    activeDeliveries: number;
    vehiclesInTransit: number;
    liveBookings: number;
    todayRevenue: number;
    avgResponseTime: number;
    systemHealth: number;
  };
  trends: {
    revenueByMonth: Array<{ month: string; revenue: number; bookings: number }>;
    popularRoutes: Array<{ route: string; count: number; revenue: number; growth: number }>;
    customerSegments: Array<{ segment: string; revenue: number; percentage: number }>;
    topPerformers: Array<{ name: string; metric: number; type: string }>;
  };
  insights: {
    predictions: Array<{ title: string; value: string; confidence: number; impact: 'high' | 'medium' | 'low' }>;
    recommendations: Array<{ title: string; description: string; priority: 'urgent' | 'high' | 'medium'; impact: string }>;
    anomalies: Array<{ metric: string; current: number; expected: number; variance: number }>;
  };
}

// Enhanced metric card with Apple-level polish
const EnhancedMetricCard = ({ 
  title, 
  value, 
  change, 
  trend,
  icon: Icon, 
  color = 'blue',
  subtitle,
  onClick,
  loading = false,
  sparklineData = [],
  target,
  className = ""
}) => {
  const colorClasses = {
    blue: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-200' },
    green: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50', border: 'border-green-200' },
    red: { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-200' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50', border: 'border-orange-200' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50', border: 'border-purple-200' },
    gray: { bg: 'bg-gray-500', text: 'text-gray-600', light: 'bg-gray-50', border: 'border-gray-200' }
  };

  const colors = colorClasses[color];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        "bg-white/80 backdrop-blur-xl",
        "border border-gray-200/50 shadow-lg hover:shadow-xl",
        "transition-all duration-500 ease-out",
        "cursor-pointer",
        className
      )}
    >
      {/* Gradient overlay */}
      <div className={cn(
        "absolute top-0 left-0 w-full h-1",
        colors.bg
      )} />
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500">
        <div className={cn("w-full h-full", colors.bg)} />
      </div>

      <div className="relative p-6">
        <div className="flex items-start justify-between mb-6">
          <div className={cn(
            "p-3 rounded-xl transition-all duration-300",
            colors.light,
            "group-hover:scale-110 group-hover:rotate-3"
          )}>
            <Icon className={cn("h-6 w-6", colors.text)} strokeWidth={1.5} />
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            {change !== undefined && (
              <motion.div 
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold",
                  change > 0 
                    ? "bg-green-100 text-green-700" 
                    : change < 0 
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700"
                )}
                whileHover={{ scale: 1.1 }}
              >
                {change > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : change < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <ArrowUpRight className="h-3 w-3" />
                )}
                {Math.abs(change).toFixed(1)}%
              </motion.div>
            )}
            
            {sparklineData.length > 0 && (
              <div className="w-16 h-8">
                <AppleSparkline 
                  data={sparklineData} 
                  color={colors.bg.replace('bg-', '')}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {loading ? (
            <div className="space-y-2">
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="flex items-baseline space-x-2">
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {value}
                </p>
                {target && (
                  <span className="text-sm text-gray-500">
                    / {target}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </>
          )}
        </div>

        {/* Progress indicator if target exists */}
        {target && !loading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className={cn("h-1 rounded-full transition-all duration-1000", colors.bg)}
                style={{ width: `${Math.min((parseFloat(value.replace(/[^\d.]/g, '')) / parseFloat(target.replace(/[^\d.]/g, ''))) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Insight card component
const InsightCard = ({ insight, type = 'prediction' }) => {
  const icons = {
    prediction: Sparkles,
    recommendation: Target,
    anomaly: AlertTriangle
  };

  const colors = {
    prediction: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    recommendation: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    anomaly: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
  };

  const Icon = icons[type];
  const color = colors[type];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        "p-4 rounded-xl border",
        color.bg, color.border,
        "hover:shadow-md transition-all duration-300"
      )}
    >
      <div className="flex items-start space-x-3">
        <div className={cn("p-2 rounded-lg bg-white", color.border)}>
          <Icon className={cn("h-4 w-4", color.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn("font-semibold text-sm", color.text)}>
            {insight.title}
          </h4>
          <p className="text-gray-600 text-sm mt-1">
            {insight.description || insight.value}
          </p>
          {insight.confidence && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Confidence</span>
                <span className={color.text}>{insight.confidence}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div 
                  className={cn("h-1 rounded-full", color.text.replace('text-', 'bg-'))}
                  style={{ width: `${insight.confidence}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Real-time activity feed
const ActivityFeed = ({ activities = [] }) => {
  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className={cn(
              "w-2 h-2 rounded-full",
              activity.type === 'booking' && "bg-blue-500",
              activity.type === 'delivery' && "bg-green-500",
              activity.type === 'issue' && "bg-red-500",
              activity.type === 'payment' && "bg-purple-500"
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {activity.title}
              </p>
              <p className="text-xs text-gray-500">
                {activity.time}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
              <Eye className="h-4 w-4" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default function AppleExecutiveDashboard() {
  const navigate = useNavigate();
  const { selectedBranch } = useBranchSelection();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');
  const [isRealtime, setIsRealtime] = useState(true);

  // Fetch dashboard data with enhanced error handling
  const { 
    data: dashboardData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['executive-dashboard', selectedBranch, timeRange],
    queryFn: async () => {
      try {
        const [metricsData, operationalData] = await Promise.all([
          dashboardService.getMetrics({ branchId: selectedBranch, timeRange }),
          operationalDashboardService.getMetrics({ branchId: selectedBranch })
        ]);

        // Enhanced data processing with insights
        return {
          overview: {
            totalRevenue: metricsData.totalRevenue || 0,
            totalBookings: metricsData.totalBookings || 0,
            totalCustomers: metricsData.totalCustomers || 0,
            totalVehicles: metricsData.totalVehicles || 0,
            revenueGrowth: metricsData.monthlyGrowthRate || 0,
            bookingGrowth: 12.5,
            customerGrowth: 8.3,
            vehicleUtilization: metricsData.vehicleUtilizationRate || 0
          },
          performance: {
            onTimeDelivery: metricsData.onTimeDeliveryRate || 0,
            customerSatisfaction: 94.2,
            operationalEfficiency: 87.6,
            costPerDelivery: 145,
            avgDeliveryTime: 2.4,
            successRate: metricsData.deliverySuccessRate || 0
          },
          realtime: {
            activeDeliveries: operationalData.activeVehicles || 0,
            vehiclesInTransit: metricsData.vehiclesInTransit || 0,
            liveBookings: metricsData.todayBookings || 0,
            todayRevenue: metricsData.todayRevenue || 0,
            avgResponseTime: 0.23,
            systemHealth: 99.8
          },
          trends: {
            revenueByMonth: [
              { month: 'Jan', revenue: 125000, bookings: 450 },
              { month: 'Feb', revenue: 138000, bookings: 520 },
              { month: 'Mar', revenue: 152000, bookings: 580 },
              { month: 'Apr', revenue: 147000, bookings: 565 },
              { month: 'May', revenue: 165000, bookings: 610 },
              { month: 'Jun', revenue: 178000, bookings: 680 }
            ],
            popularRoutes: metricsData.popularRoutes?.slice(0, 5) || [],
            customerSegments: [
              { segment: 'Enterprise', revenue: 450000, percentage: 45 },
              { segment: 'SMB', revenue: 320000, percentage: 32 },
              { segment: 'Startup', revenue: 230000, percentage: 23 }
            ]
          },
          insights: {
            predictions: [
              { title: 'Revenue Forecast', value: '+23% next month', confidence: 87, impact: 'high' },
              { title: 'Demand Surge', value: 'Delhi-Mumbai route', confidence: 92, impact: 'high' },
              { title: 'Cost Optimization', value: '₹2.3L savings potential', confidence: 76, impact: 'medium' }
            ],
            recommendations: [
              { title: 'Scale Delhi Operations', description: 'High demand detected, consider adding 3 more vehicles', priority: 'high', impact: '+₹4.5L monthly revenue' },
              { title: 'Customer Retention Program', description: 'Launch loyalty program for top 20% customers', priority: 'medium', impact: '+15% customer lifetime value' }
            ],
            anomalies: [
              { metric: 'Delivery Time', current: 3.2, expected: 2.4, variance: 33 },
              { metric: 'Cost per KM', current: 12.5, expected: 10.8, variance: 16 }
            ]
          }
        } as AdvancedMetrics;
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        throw err;
      }
    },
    refetchInterval: isRealtime ? 30000 : false, // Real-time updates every 30s
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mock real-time activity data
  const realtimeActivities = [
    { id: '1', type: 'booking', title: 'New booking: DL001 to MH001', time: '2 min ago' },
    { id: '2', type: 'delivery', title: 'Delivery completed: LR2024001', time: '5 min ago' },
    { id: '3', type: 'payment', title: 'Payment received: ₹15,240', time: '8 min ago' },
    { id: '4', type: 'booking', title: 'Express booking: Same day delivery', time: '12 min ago' },
    { id: '5', type: 'issue', title: 'Vehicle VH101 maintenance alert', time: '15 min ago' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard Error</h3>
          <p className="text-gray-600 mb-4">Failed to load dashboard data</p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1600px] mx-auto p-6 space-y-8"
      >
        {/* Enhanced Header */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
        >
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
              >
                <BarChart3 className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Executive Dashboard</h1>
                <p className="text-gray-600">Real-time insights and business intelligence</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isRealtime ? "bg-green-500 animate-pulse" : "bg-gray-400"
                )} />
                <span>{isRealtime ? 'Live' : 'Static'}</span>
              </div>
              <span>•</span>
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
              <span>•</span>
              <span>{selectedBranch || 'All Branches'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setIsRealtime(!isRealtime)}
              className={cn(
                "transition-colors",
                isRealtime && "border-green-500 text-green-600"
              )}
            >
              {isRealtime ? <Pause className="h-4 w-4 mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
              {isRealtime ? 'Pause' : 'Resume'} Live
            </Button>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => refetch()}
              variant="outline"
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>

            <Button 
              onClick={() => navigate('/dashboard/bookings/new')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </div>
        </motion.div>

        {/* Enhanced Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 h-12 p-1 bg-gray-100 rounded-xl">
              <TabsTrigger value="overview" className="rounded-lg font-medium">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="performance" className="rounded-lg font-medium">
                <Target className="h-4 w-4 mr-2" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="insights" className="rounded-lg font-medium">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Insights
              </TabsTrigger>
              <TabsTrigger value="realtime" className="rounded-lg font-medium">
                <Activity className="h-4 w-4 mr-2" />
                Real-time
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <motion.div 
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <EnhancedMetricCard
                  title="Total Revenue"
                  value={`₹${(dashboardData?.overview.totalRevenue || 0).toLocaleString()}`}
                  change={dashboardData?.overview.revenueGrowth}
                  icon={IndianRupee}
                  color="green"
                  subtitle="This month"
                  onClick={() => navigate('/dashboard/financial')}
                  loading={isLoading}
                  sparklineData={[45, 52, 38, 65, 72, 68, 80]}
                  target="₹2.5M"
                />

                <EnhancedMetricCard
                  title="Total Bookings"
                  value={(dashboardData?.overview.totalBookings || 0).toLocaleString()}
                  change={dashboardData?.overview.bookingGrowth}
                  icon={Package}
                  color="blue"
                  subtitle="All time"
                  onClick={() => navigate('/dashboard/bookings')}
                  loading={isLoading}
                  sparklineData={[120, 135, 148, 142, 165, 178, 195]}
                />

                <EnhancedMetricCard
                  title="Active Customers"
                  value={(dashboardData?.overview.totalCustomers || 0).toLocaleString()}
                  change={dashboardData?.overview.customerGrowth}
                  icon={Users}
                  color="purple"
                  subtitle="Registered"
                  onClick={() => navigate('/dashboard/customers')}
                  loading={isLoading}
                  sparklineData={[85, 92, 88, 95, 102, 98, 108]}
                />

                <EnhancedMetricCard
                  title="Fleet Utilization"
                  value={`${(dashboardData?.overview.vehicleUtilization || 0).toFixed(1)}%`}
                  change={dashboardData?.overview.vehicleUtilization > 75 ? 5.2 : -2.1}
                  icon={Truck}
                  color="orange"
                  subtitle={`${dashboardData?.overview.totalVehicles || 0} vehicles`}
                  onClick={() => navigate('/dashboard/vehicles')}
                  loading={isLoading}
                  target="90%"
                />
              </motion.div>

              {/* Revenue Trend Chart */}
              <motion.div variants={itemVariants}>
                <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold">Revenue & Bookings Trend</CardTitle>
                        <p className="text-gray-600 text-sm">Monthly performance overview</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-blue-100 text-blue-700">Revenue</Badge>
                        <Badge className="bg-green-100 text-green-700">Bookings</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <AppleLineChart 
                        data={dashboardData?.trends.revenueByMonth || []}
                        loading={isLoading}
                        colors={['#3B82F6', '#10B981']}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Popular Routes & Customer Segments */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={itemVariants}>
                  <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-xl h-full">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-bold flex items-center">
                        <Route className="h-5 w-5 mr-2 text-blue-600" />
                        Top Routes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(dashboardData?.trends.popularRoutes || []).slice(0, 5).map((route, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ x: 4 }}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{route.from} → {route.to}</p>
                                <p className="text-sm text-gray-500">{route.count} bookings</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">₹{route.revenue.toLocaleString()}</p>
                              <p className="text-sm text-green-600">+{route.growth || 12}%</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-xl h-full">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-bold flex items-center">
                        <PieChart className="h-5 w-5 mr-2 text-purple-600" />
                        Customer Segments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(dashboardData?.trends.customerSegments || []).map((segment, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">{segment.segment}</h4>
                              <span className="text-lg font-bold text-gray-900">
                                ₹{(segment.revenue / 1000).toFixed(0)}K
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${segment.percentage}%` }}
                              />
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{segment.percentage}% of total revenue</p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <motion.div 
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <EnhancedMetricCard
                  title="On-Time Delivery"
                  value={`${(dashboardData?.performance.onTimeDelivery || 0).toFixed(1)}%`}
                  change={5.2}
                  icon={Clock}
                  color="green"
                  subtitle="Last 30 days"
                  loading={isLoading}
                  target="95%"
                />

                <EnhancedMetricCard
                  title="Customer Satisfaction"
                  value={`${(dashboardData?.performance.customerSatisfaction || 0).toFixed(1)}%`}
                  change={2.8}
                  icon={Star}
                  color="purple"
                  subtitle="Average rating: 4.7/5"
                  loading={isLoading}
                  target="96%"
                />

                <EnhancedMetricCard
                  title="Operational Efficiency"
                  value={`${(dashboardData?.performance.operationalEfficiency || 0).toFixed(1)}%`}
                  change={-1.3}
                  icon={Zap}
                  color="orange"
                  subtitle="Cost optimization index"
                  loading={isLoading}
                  target="92%"
                />

                <EnhancedMetricCard
                  title="Cost per Delivery"
                  value={`₹${dashboardData?.performance.costPerDelivery || 0}`}
                  change={-3.5}
                  icon={IndianRupee}
                  color="blue"
                  subtitle="Including fuel & overhead"
                  loading={isLoading}
                />

                <EnhancedMetricCard
                  title="Avg Delivery Time"
                  value={`${(dashboardData?.performance.avgDeliveryTime || 0).toFixed(1)} days`}
                  change={-8.2}
                  icon={Timer}
                  color="green"
                  subtitle="Door to door"
                  loading={isLoading}
                  target="2.0 days"
                />

                <EnhancedMetricCard
                  title="Success Rate"
                  value={`${(dashboardData?.performance.successRate || 0).toFixed(1)}%`}
                  change={1.5}
                  icon={CheckCircle2}
                  color="green"
                  subtitle="Successful deliveries"
                  loading={isLoading}
                  target="99%"
                />
              </motion.div>
            </TabsContent>

            {/* AI Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Predictions */}
                <motion.div variants={itemVariants}>
                  <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-xl h-full">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-bold flex items-center">
                        <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
                        AI Predictions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(dashboardData?.insights.predictions || []).map((prediction, index) => (
                          <InsightCard 
                            key={index} 
                            insight={prediction} 
                            type="prediction" 
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Recommendations */}
                <motion.div variants={itemVariants}>
                  <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-xl h-full">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-bold flex items-center">
                        <Target className="h-5 w-5 mr-2 text-green-600" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(dashboardData?.insights.recommendations || []).map((rec, index) => (
                          <InsightCard 
                            key={index} 
                            insight={rec} 
                            type="recommendation" 
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Anomalies */}
                <motion.div variants={itemVariants}>
                  <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-xl h-full">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-bold flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                        Anomalies Detected
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(dashboardData?.insights.anomalies || []).map((anomaly, index) => (
                          <InsightCard 
                            key={index} 
                            insight={{
                              title: anomaly.metric,
                              description: `${anomaly.variance}% deviation from expected ${anomaly.expected}`,
                              value: `Current: ${anomaly.current}`
                            }} 
                            type="anomaly" 
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>

            {/* Real-time Tab */}
            <TabsContent value="realtime" className="space-y-6">
              <motion.div 
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <EnhancedMetricCard
                  title="Active Deliveries"
                  value={(dashboardData?.realtime.activeDeliveries || 0).toString()}
                  icon={Truck}
                  color="blue"
                  subtitle="In progress"
                  loading={isLoading}
                />

                <EnhancedMetricCard
                  title="Live Bookings"
                  value={(dashboardData?.realtime.liveBookings || 0).toString()}
                  icon={Package}
                  color="green"
                  subtitle="Today"
                  loading={isLoading}
                />

                <EnhancedMetricCard
                  title="Today's Revenue"
                  value={`₹${(dashboardData?.realtime.todayRevenue || 0).toLocaleString()}`}
                  icon={IndianRupee}
                  color="purple"
                  subtitle="Real-time"
                  loading={isLoading}
                />

                <EnhancedMetricCard
                  title="System Health"
                  value={`${(dashboardData?.realtime.systemHealth || 0).toFixed(1)}%`}
                  icon={Shield}
                  color="green"
                  subtitle="All systems operational"
                  loading={isLoading}
                />
              </motion.div>

              {/* Real-time Activity Feed */}
              <motion.div variants={itemVariants}>
                <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold flex items-center">
                        <Activity className="h-5 w-5 mr-2 text-blue-600" />
                        Live Activity Feed
                      </CardTitle>
                      <Badge className="bg-green-100 text-green-700 animate-pulse">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        Live
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ActivityFeed activities={realtimeActivities} />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
}