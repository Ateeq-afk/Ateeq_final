import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Package, Truck, Users, IndianRupee,
  ArrowUpRight, ArrowDownRight, Clock, Target, AlertTriangle,
  CheckCircle2, BarChart3, Eye, Zap, Bell, Filter, Calendar,
  MapPin, DollarSign, Activity, ChevronRight, Star, Gauge
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
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboardMetrics, useDashboardTrends, useRecentActivities } from '@/hooks/useDashboard';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

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

interface AlertItem {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  description: string;
  timestamp: string;
  actionable: boolean;
}

export default function DashboardEnhanced() {
  const navigate = useNavigate();
  const { showSuccess } = useNotificationSystem();
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useDashboardMetrics();
  const { data: trends = [], isLoading: trendsLoading } = useDashboardTrends(parseInt(timeRange.replace('d', '')));
  const { data: activities = [] } = useRecentActivities(5);

  const alerts: AlertItem[] = [
    {
      id: '1',
      type: 'critical',
      title: 'High vehicle utilization',
      description: '3 vehicles at 95%+ capacity',
      timestamp: '2 min ago',
      actionable: true
    },
    {
      id: '2',
      type: 'warning',
      title: 'Payment overdue',
      description: '₹2.5L pending collection',
      timestamp: '1 hour ago',
      actionable: true
    },
    {
      id: '3',
      type: 'info',
      title: 'Route optimization available',
      description: 'Save 12% on Delhi-Mumbai route',
      timestamp: '3 hours ago',
      actionable: true
    }
  ];

  const kpiCards = [
    {
      id: 'revenue',
      title: 'Revenue Performance',
      value: `₹${((metrics?.totalRevenue || 0) / 100000).toFixed(1)}L`,
      change: metrics?.monthlyGrowthRate || 0,
      subtitle: `₹${((metrics?.todayRevenue || 0) / 1000).toFixed(0)}K today`,
      icon: IndianRupee,
      color: 'from-emerald-500 to-emerald-600',
      trend: trends.slice(-7).map(t => t.revenue),
      onClick: () => navigate('/dashboard/revenue')
    },
    {
      id: 'bookings',
      title: 'Active Operations',
      value: metrics?.activeBookings || 0,
      change: 8.2,
      subtitle: `${metrics?.todayBookings || 0} new today`,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      trend: trends.slice(-7).map(t => t.bookings),
      onClick: () => navigate('/dashboard/bookings')
    },
    {
      id: 'efficiency',
      title: 'Delivery Excellence',
      value: `${metrics?.deliverySuccessRate || 0}%`,
      change: 2.1,
      subtitle: `${metrics?.onTimeDeliveryRate || 0}% on-time`,
      icon: Target,
      color: 'from-purple-500 to-purple-600',
      trend: [92, 94, 91, 96, 95, 97, 98],
      onClick: () => navigate('/dashboard/operations')
    },
    {
      id: 'fleet',
      title: 'Fleet Performance',
      value: `${metrics?.vehicleUtilizationRate || 0}%`,
      change: -1.5,
      subtitle: `${metrics?.activeVehicles || 0}/${metrics?.totalVehicles || 0} active`,
      icon: Truck,
      color: 'from-orange-500 to-orange-600',
      trend: [78, 82, 79, 81, 85, 83, 80],
      onClick: () => navigate('/dashboard/vehicles')
    }
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 16,
        displayColors: false,
      },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    elements: {
      line: { tension: 0.4, borderWidth: 2 },
      point: { radius: 0, hoverRadius: 6 },
    },
    interaction: { intersect: false },
  };

  const revenueTrendData = {
    labels: trends.slice(-30).map(t => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Revenue',
        data: trends.slice(-30).map(t => t.revenue),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Target',
        data: trends.slice(-30).map((_, i) => (metrics?.totalRevenue || 0) / 30 * 1.1),
        borderColor: '#6b7280',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
      }
    ],
  };

  const performanceData = {
    labels: ['On Time', 'Delayed', 'Pending'],
    datasets: [
      {
        data: [
          metrics?.onTimeDeliveryRate || 0,
          ((100 - (metrics?.onTimeDeliveryRate || 0)) * 0.7) || 0,
          ((100 - (metrics?.onTimeDeliveryRate || 0)) * 0.3) || 0
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderColor: ['#059669', '#d97706', '#dc2626'],
        borderWidth: 2,
      },
    ],
  };

  if (metricsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-slate-800/50 dark:to-purple-900/20">
      <div className="container mx-auto p-6 space-y-8">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
              Business Intelligence
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
              Real-time insights and performance analytics
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px] bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
                <Calendar className="h-4 w-4 mr-2" />
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
              onClick={() => refetchMetrics()}
              className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50"
            >
              <Activity className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Alert Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-red-500/10 via-yellow-500/10 to-blue-500/10 border-orange-200 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">3 items need attention</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">High vehicle utilization, overdue payments, and optimization opportunities</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {kpiCards.map((kpi, index) => (
            <motion.div
              key={kpi.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="cursor-pointer"
              onClick={kpi.onClick}
            >
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <kpi.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      kpi.change >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {kpi.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(kpi.change).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium text-slate-600 dark:text-slate-400 text-sm">{kpi.title}</h3>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{kpi.value}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">{kpi.subtitle}</p>
                  </div>

                  {/* Mini trend chart */}
                  <div className="mt-4 h-12">
                    <Line
                      data={{
                        labels: Array(kpi.trend.length).fill(''),
                        datasets: [{
                          data: kpi.trend,
                          borderColor: kpi.change >= 0 ? '#10b981' : '#ef4444',
                          backgroundColor: kpi.change >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          fill: true,
                          tension: 0.4,
                        }]
                      }}
                      options={chartOptions}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Analytics Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Revenue Trend Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="xl:col-span-2"
          >
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Revenue Performance</CardTitle>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Actual vs Target</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                      +{((metrics?.monthlyGrowthRate || 0)).toFixed(1)}% vs target
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <Line
                    data={revenueTrendData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: true,
                          position: 'top',
                          labels: {
                            usePointStyle: true,
                            font: { size: 12, weight: '500' },
                            color: '#64748b',
                          },
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          titleColor: '#fff',
                          bodyColor: '#fff',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderWidth: 1,
                          cornerRadius: 12,
                          padding: 16,
                          callbacks: {
                            label: function(context: any) {
                              return `${context.dataset.label}: ₹${(context.parsed.y / 1000).toFixed(1)}K`;
                            },
                          },
                        },
                      },
                      scales: {
                        x: {
                          grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false },
                          ticks: { color: '#64748b', font: { size: 11 } },
                        },
                        y: {
                          beginAtZero: true,
                          grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false },
                          ticks: {
                            color: '#64748b',
                            font: { size: 11 },
                            callback: function(value: any) {
                              return `₹${(value / 1000).toFixed(0)}K`;
                            },
                          },
                        },
                      },
                      elements: {
                        line: { tension: 0.4 },
                        point: { radius: 4, hoverRadius: 6, borderWidth: 2 },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Performance Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            {/* Delivery Performance */}
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Delivery Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[160px] flex items-center justify-center">
                  <Doughnut
                    data={performanceData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            usePointStyle: true,
                            font: { size: 11 },
                            color: '#64748b',
                            padding: 20,
                          },
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          titleColor: '#fff',
                          bodyColor: '#fff',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderWidth: 1,
                          cornerRadius: 12,
                          padding: 12,
                          callbacks: {
                            label: function(context: any) {
                              return `${context.label}: ${context.parsed.toFixed(1)}%`;
                            },
                          },
                        },
                      },
                      cutout: '65%',
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50/80 dark:bg-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium">Avg Delivery Time</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{metrics?.averageDeliveryTime || 0}h</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-50/80 dark:bg-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm font-medium">Customer Rating</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{metrics?.customerSatisfactionScore || 0}/5</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-50/80 dark:bg-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Gauge className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium">Efficiency Score</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">94%</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Row - Actionable Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Smart Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Smart Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-xl border-l-4 ${
                    alert.type === 'critical' ? 'bg-red-50 border-red-500 dark:bg-red-900/20 dark:border-red-400' :
                    alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20 dark:border-yellow-400' :
                    'bg-blue-50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-400'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 dark:text-white text-sm">{alert.title}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{alert.description}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">{alert.timestamp}</p>
                      </div>
                      {alert.actionable && (
                        <Button size="sm" variant="outline" className="ml-3">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.slice(0, 4).map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 bg-slate-50/80 dark:bg-slate-700/50 rounded-xl">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {activity.description || `New booking #${Math.random().toString().slice(2, 8)}`}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date().toLocaleTimeString()} • {activity.user || 'System'}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <Button variant="ghost" className="w-full mt-4" size="sm">
                    View All Activities
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-10 w-80 mb-2" />
          <Skeleton className="h-6 w-64" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <Skeleton className="h-20 w-full" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Skeleton className="xl:col-span-2 h-96" />
        <Skeleton className="h-96" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}