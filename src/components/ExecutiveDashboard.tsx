import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Truck,
  Package,
  Users,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Filter,
  Calendar,
  MoreHorizontal,
  Plus,
  Upload,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { operationalDashboardService } from '@/services/operationalDashboard';
import { dashboardService } from '@/services/dashboard';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ElementType;
  color: 'blue' | 'green' | 'red' | 'orange' | 'purple';
  subtitle?: string;
  actionable?: boolean;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
  subtitle,
  actionable = false,
  onClick
}) => {
  const colorMap = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500'
  };

  const bgColorMap = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    red: 'bg-red-50 border-red-100',
    orange: 'bg-orange-50 border-orange-100',
    purple: 'bg-purple-50 border-purple-100'
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="h-3 w-3 text-red-600" />;
    return null;
  };

  return (
    <motion.div
      whileHover={actionable ? { scale: 1.02 } : {}}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={`${bgColorMap[color]} cursor-pointer transition-all duration-200 hover:shadow-md ${
          actionable ? 'hover:shadow-lg' : ''
        }`}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">{value}</span>
                {change !== undefined && (
                  <div className="flex items-center gap-1">
                    {getTrendIcon()}
                    <span className={`text-xs font-medium ${
                      trend === 'up' ? 'text-green-600' : 
                      trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {Math.abs(change)}%
                    </span>
                  </div>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
            <div className={`p-3 rounded-full ${colorMap[color]} bg-opacity-10`}>
              <Icon className={`h-6 w-6 ${colorMap[color].replace('bg-', 'text-')}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ExecutiveDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);
  const { selectedBranch } = useBranchSelection();
  const navigate = useNavigate();

  // Fetch real dashboard metrics
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['dashboard-metrics', selectedBranch?.id, timeRange],
    queryFn: () => dashboardService.getMetrics(selectedBranch?.id),
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch operational data
  const { data: operationalData, isLoading: operationalLoading, refetch: refetchOperational } = useQuery({
    queryKey: ['operational-dashboard', selectedBranch?.id],
    queryFn: () => operationalDashboardService.getOperationalData(selectedBranch?.id),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch trends data
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['dashboard-trends', selectedBranch?.id, timeRange],
    queryFn: () => dashboardService.getTrends(selectedBranch?.id, timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchMetrics(),
      refetchOperational()
    ]);
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString()}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (metricsLoading || operationalLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const dashboardMetrics = metrics?.data || {};
  const operational = operationalData || {};

  // Calculate key performance indicators
  const todayRevenue = dashboardMetrics.todayRevenue || 0;
  const monthRevenue = dashboardMetrics.monthRevenue || 0;
  const totalBookings = dashboardMetrics.totalBookings || 0;
  const activeBookings = dashboardMetrics.activeBookings || 0;
  const deliverySuccessRate = dashboardMetrics.deliverySuccessRate || 0;
  const onTimeDeliveryRate = dashboardMetrics.onTimeDeliveryRate || 0;
  const monthlyGrowthRate = dashboardMetrics.monthlyGrowthRate || 0;

  // Critical alerts from operational data
  const criticalIssues = [];
  if (operational.exceptions?.delayedShipments?.count > 0) {
    criticalIssues.push({
      type: 'delayed',
      count: operational.exceptions.delayedShipments.count,
      value: operational.exceptions.delayedShipments.totalValue
    });
  }
  if (operational.exceptions?.overduePayments?.count > 0) {
    criticalIssues.push({
      type: 'payments',
      count: operational.exceptions.overduePayments.count,
      value: operational.exceptions.overduePayments.totalValue
    });
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Executive Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            {selectedBranch ? `${selectedBranch.name} Branch` : 'All Branches'} • Real-time Operations Overview
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            onClick={() => navigate('/new-booking')}
            className="w-full h-24 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
          >
            <div className="flex flex-col items-center gap-2">
              <Plus className="h-8 w-8 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">New Booking</span>
            </div>
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={() => navigate('/loading')}
            className="w-full h-24 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Load</span>
            </div>
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={() => navigate('/unloading')}
            className="w-full h-24 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
          >
            <div className="flex flex-col items-center gap-2">
              <Download className="h-8 w-8 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Unload</span>
            </div>
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={() => navigate('/bookings')}
            className="w-full h-24 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
          >
            <div className="flex flex-col items-center gap-2">
              <Package className="h-8 w-8 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">View Bookings</span>
            </div>
          </Button>
        </motion.div>
      </div>

      {/* Critical Alerts */}
      {criticalIssues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Immediate Action Required</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {criticalIssues.map((issue, idx) => (
              <div key={idx} className="bg-white rounded p-3 border border-red-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-red-800">
                    {issue.type === 'delayed' ? 'Delayed Shipments' : 'Overdue Payments'}
                  </span>
                  <Badge variant="destructive">{issue.count}</Badge>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  {formatCurrency(issue.value)} at risk
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Revenue"
          value={formatCurrency(todayRevenue)}
          change={monthlyGrowthRate}
          trend={monthlyGrowthRate > 0 ? 'up' : monthlyGrowthRate < 0 ? 'down' : 'stable'}
          icon={DollarSign}
          color="green"
          subtitle="Real-time booking revenue"
          actionable
        />
        
        <MetricCard
          title="Active Bookings"
          value={formatNumber(activeBookings)}
          icon={Package}
          color="blue"
          subtitle={`${formatNumber(totalBookings)} total bookings`}
          actionable
        />
        
        <MetricCard
          title="Delivery Success"
          value={`${deliverySuccessRate.toFixed(1)}%`}
          icon={CheckCircle}
          color={deliverySuccessRate >= 95 ? 'green' : deliverySuccessRate >= 85 ? 'orange' : 'red'}
          subtitle={`${onTimeDeliveryRate.toFixed(1)}% on-time`}
          actionable
        />
        
        <MetricCard
          title="Fleet Utilization"
          value={`${operational.operations?.fleet?.utilizationRate?.toFixed(1) || 0}%`}
          icon={Truck}
          color="purple"
          subtitle={`${operational.operations?.fleet?.activeVehicles || 0}/${operational.operations?.fleet?.totalVehicles || 0} active`}
          actionable
        />
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Financial Performance</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Live Data
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{formatCurrency(monthRevenue)}</div>
                <div className="text-sm text-gray-600">This Month</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {monthlyGrowthRate > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs ${monthlyGrowthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(monthlyGrowthRate).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{formatCurrency(dashboardMetrics.averageBookingValue || 0)}</div>
                <div className="text-sm text-gray-600">Avg Booking Value</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{formatCurrency(dashboardMetrics.weekRevenue || 0)}</div>
                <div className="text-sm text-gray-600">This Week</div>
              </div>
            </div>
            
            {operational.financial && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-3">Outstanding Receivables</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(operational.financial.outstandingReceivables.current)}
                    </div>
                    <div className="text-xs text-gray-600">0-30 days</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded">
                    <div className="text-lg font-semibold text-yellow-800">
                      {formatCurrency(operational.financial.outstandingReceivables.aging30)}
                    </div>
                    <div className="text-xs text-yellow-600">31-60 days</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded">
                    <div className="text-lg font-semibold text-orange-800">
                      {formatCurrency(operational.financial.outstandingReceivables.aging60)}
                    </div>
                    <div className="text-xs text-orange-600">61-90 days</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="text-lg font-semibold text-red-800">
                      {formatCurrency(operational.financial.outstandingReceivables.aging90)}
                    </div>
                    <div className="text-xs text-red-600">90+ days</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operational Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Collection Rate</span>
                <span className="font-semibold">
                  {operational.financial?.dailyPerformance?.collectionRate?.toFixed(1) || 0}%
                </span>
              </div>
              <Progress 
                value={operational.financial?.dailyPerformance?.collectionRate || 0} 
                className="h-2" 
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Fleet Utilization</span>
                <span className="font-semibold">
                  {operational.operations?.fleet?.utilizationRate?.toFixed(1) || 0}%
                </span>
              </div>
              <Progress 
                value={operational.operations?.fleet?.utilizationRate || 0} 
                className="h-2" 
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">On-Time Delivery</span>
                <span className="font-semibold">{onTimeDeliveryRate.toFixed(1)}%</span>
              </div>
              <Progress value={onTimeDeliveryRate} className="h-2" />
            </div>
            
            <div className="pt-3 border-t">
              <div className="text-xs text-gray-500 mb-2">Quick Stats</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Customers</span>
                  <span className="text-sm font-medium">{dashboardMetrics.totalCustomers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active Vehicles</span>
                  <span className="text-sm font-medium">{dashboardMetrics.activeVehicles || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Articles in Transit</span>
                  <span className="text-sm font-medium">{dashboardMetrics.articlesInTransit || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers & Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Customers (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardMetrics.topCustomers?.slice(0, 5).map((customer: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{customer.name}</div>
                    <div className="text-sm text-gray-600">{customer.totalBookings} bookings</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(customer.totalRevenue)}
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4 text-gray-500">
                  No customer data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardMetrics.popularRoutes?.slice(0, 5).map((route: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{route.from} → {route.to}</div>
                    <div className="text-sm text-gray-600">{route.count} shipments</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(route.revenue)}
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4 text-gray-500">
                  No route data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;