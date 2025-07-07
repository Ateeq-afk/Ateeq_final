import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  Package,
  TrendingUp,
  Users,
  Truck,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  RefreshCw,
  Plus,
  Bell,
  Settings,
  Search,
  ChevronRight,
  Activity,
  DollarSign,
  Calendar,
  Clock,
  MapPin,
  Star,
  Zap,
  BarChart3,
  Eye,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { useDeviceType, useIsTouchDevice } from '@/hooks/useIsMobile';
import PullToRefresh from './PullToRefresh';
import { 
  ActivityIndicator, 
  MetricCardSkeleton, 
  NoSearchResults,
  LoadingCard
} from '@/components/ui/loading-states';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
}

const AppleMobileMetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  onClick
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const isTouch = useIsTouchDevice();

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onTapStart={() => setIsPressed(true)}
      onTap={() => setIsPressed(false)}
      onTapCancel={() => setIsPressed(false)}
      onClick={onClick}
      className={cn(
        "cursor-pointer relative overflow-hidden",
        "haptic-medium hover-lift-subtle"
      )}
    >
      <Card className={cn(
        "p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300",
        "bg-gradient-to-br backdrop-blur-sm",
        "border border-white/20",
        color,
        isPressed && "scale-[0.98]"
      )}>
        {/* Glass morphism background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent" />
        
        {/* Noise texture for depth */}
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-caption font-medium text-white/80 tracking-tight">{title}</p>
              <motion.p 
                className="text-display-xs font-bold text-white mt-2 tracking-tight"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {value}
              </motion.p>
            </div>
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 10 }}
              className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20"
            >
              <Icon className="h-6 w-6 text-white" strokeWidth={1.5} />
            </motion.div>
          </div>
          
          {change !== undefined && (
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full",
                "bg-white/20 backdrop-blur-sm border border-white/20"
              )}>
                {change > 0 ? (
                  <ArrowUp className="h-3 w-3 text-white" strokeWidth={2} />
                ) : (
                  <ArrowDown className="h-3 w-3 text-white" strokeWidth={2} />
                )}
                <span className="text-xs font-bold text-white tabular-nums">
                  {Math.abs(change)}%
                </span>
              </div>
              <span className="text-xs text-white/70 font-medium">
                vs last period
              </span>
            </motion.div>
          )}
          
          {/* Hover indicator */}
          <motion.div
            className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300"
            initial={{ x: 10 }}
            whileHover={{ x: 0 }}
          >
            <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ChevronRight className="h-3 w-3 text-white" />
            </div>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
}

const AppleQuickAction: React.FC<QuickActionProps> = ({ 
  icon: Icon, 
  label, 
  onClick,
  color = "bg-white dark:bg-gray-900"
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center gap-3 p-4 rounded-2xl",
        "transition-all duration-300 overflow-hidden",
        "border border-gray-200/50 dark:border-gray-800/50",
        "shadow-sm hover:shadow-lg backdrop-blur-sm",
        "haptic-light hover-lift-subtle",
        color
      )}
    >
      {/* Glass morphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 via-white/50 to-gray-100/30 dark:from-gray-800/30 dark:via-gray-900/50 dark:to-gray-800/30" />
      
      <div className="relative z-10 flex flex-col items-center gap-3">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            "bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30",
            "group-hover:bg-blue-100 dark:group-hover:bg-blue-950/30 transition-colors duration-300"
          )}
        >
          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
        </motion.div>
        <span className="text-caption font-medium text-gray-900 dark:text-gray-100 tracking-tight">
          {label}
        </span>
      </div>
      
      {/* Hover effect */}
      <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.button>
  );
};

// Enhanced Recent Activity Card
const RecentActivityCard: React.FC<{
  title: string;
  items: any[];
  onViewAll: () => void;
  icon: React.ElementType;
}> = ({ title, items, onViewAll, icon: Icon }) => {
  return (
    <Card className="p-6 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
          </div>
          <span className="text-body-md font-semibold text-gray-900 dark:text-gray-100">{title}</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onViewAll}
          className="text-caption text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 haptic-light"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </motion.button>
      </div>
      <div className="space-y-3">
        {items.slice(0, 3).map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
          >
            <div className="flex-1">
              <p className="text-body-sm font-medium text-gray-900 dark:text-gray-100">{item.primary}</p>
              <p className="text-caption text-gray-500 dark:text-gray-400">{item.secondary}</p>
            </div>
            <span className={cn(
              "text-caption font-medium px-2 py-1 rounded-full",
              item.status === 'active' ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/20" :
              item.status === 'warning' ? "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/20" :
              "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20"
            )}>
              {item.statusText}
            </span>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};

export default function MobileDashboard() {
  const navigate = useNavigate();
  const { selectedBranch } = useBranchSelection();
  const [refreshing, setRefreshing] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const deviceType = useDeviceType();
  const isTouch = useIsTouchDevice();

  // Fetch dashboard data
  const { data: dashboardData = {}, isLoading, refetch } = useQuery({
    queryKey: ['mobile-dashboard', selectedBranch?.id],
    queryFn: () => dashboardService.getDashboardData(selectedBranch?.id),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
      // Add haptic feedback on touch devices
      if (isTouch && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  }, [refetch, isTouch]);

  // Swipe handler for sections
  const handleSwipe = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    
    if (info.offset.x > swipeThreshold && currentSection > 0) {
      setCurrentSection(currentSection - 1);
    } else if (info.offset.x < -swipeThreshold && currentSection < 2) {
      setCurrentSection(currentSection + 1);
    }
  };

  // Enhanced metrics with real data
  const metrics = [
    {
      title: 'Active Bookings',
      value: dashboardData.activeBookings || '0',
      change: dashboardData.bookingGrowth || 0,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      onClick: () => navigate('/dashboard/bookings')
    },
    {
      title: 'Today Revenue',
      value: `₹${(dashboardData.todayRevenue || 0).toLocaleString()}`,
      change: dashboardData.revenueGrowth || 0,
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      onClick: () => navigate('/dashboard/financial')
    },
    {
      title: 'Fleet Active',
      value: dashboardData.activeVehicles || '0',
      change: dashboardData.fleetGrowth || 0,
      icon: Truck,
      color: 'from-purple-500 to-purple-600',
      onClick: () => navigate('/dashboard/vehicles')
    },
    {
      title: 'Deliveries',
      value: dashboardData.todayDeliveries || '0',
      change: dashboardData.deliveryRate || 0,
      icon: CheckCircle,
      color: 'from-emerald-500 to-emerald-600',
      onClick: () => navigate('/dashboard/tracking')
    }
  ];

  const quickActions = [
    { icon: Plus, label: 'New Booking', onClick: () => navigate('/dashboard/new-booking') },
    { icon: MapPin, label: 'Track', onClick: () => navigate('/dashboard/tracking') },
    { icon: Search, label: 'Search', onClick: () => navigate('/dashboard/bookings') },
    { icon: BarChart3, label: 'Analytics', onClick: () => navigate('/dashboard/financial') }
  ];

  const recentBookings = [
    { primary: 'BK001234', secondary: 'Mumbai → Delhi', status: 'active', statusText: 'In Transit' },
    { primary: 'BK001235', secondary: 'Delhi → Bangalore', status: 'warning', statusText: 'Delayed' },
    { primary: 'BK001236', secondary: 'Chennai → Mumbai', status: 'completed', statusText: 'Delivered' }
  ];

  const topRoutes = [
    { primary: 'Mumbai → Delhi', secondary: '45 trips this week', status: 'active', statusText: '92%' },
    { primary: 'Delhi → Bangalore', secondary: '32 trips this week', status: 'active', statusText: '88%' },
    { primary: 'Chennai → Mumbai', secondary: '28 trips this week', status: 'active', statusText: '95%' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
        <div className="px-4 pt-4 space-y-6">
          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          
          {/* Metrics skeleton */}
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))}
          </div>
          
          {/* Quick actions skeleton */}
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <LoadingCard key={i} className="h-20" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/30 pb-20">
      {/* Enhanced Pull to refresh indicator */}
      <AnimatePresence>
        {refreshing && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-lg border border-gray-200/50 dark:border-gray-700/50 flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <ActivityIndicator size="sm" />
              </motion.div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Refreshing data...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content with enhanced pull to refresh */}
      <PullToRefresh onRefresh={handleRefresh}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="px-4 pt-6"
        >
          {/* Enhanced Welcome Section */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-display-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                  Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}! 👋
                </h1>
                <p className="text-body-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedBranch?.name || 'All branches'} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center shadow-sm"
              >
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
              </motion.button>
            </div>
          </motion.div>

          {/* Enhanced Metrics Grid */}
          <motion.div 
            className="grid grid-cols-2 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {metrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <AppleMobileMetricCard {...metric} />
              </motion.div>
            ))}
          </motion.div>

          {/* Enhanced Quick Actions */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 tracking-tight">Quick Actions</h2>
            <div className="grid grid-cols-4 gap-3">
              {quickActions.map((action, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <AppleQuickAction {...action} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Enhanced Recent Activity */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Recent Activity</h2>
              <div className="flex gap-1">
                {[0, 1].map((index) => (
                  <motion.div
                    key={index}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      currentSection === index
                        ? "bg-blue-500 w-6"
                        : "bg-gray-300 dark:bg-gray-600 w-2"
                    )}
                    whileHover={{ scale: 1.2 }}
                  />
                ))}
              </div>
            </div>

            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleSwipe}
              className="overflow-hidden"
            >
              <motion.div
                animate={{ x: -currentSection * 100 + '%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex"
              >
                {/* Recent Bookings */}
                <div className="w-full flex-shrink-0">
                  <RecentActivityCard
                    title="Recent Bookings"
                    items={recentBookings}
                    onViewAll={() => navigate('/dashboard/bookings')}
                    icon={Package}
                  />
                </div>

                {/* Top Routes */}
                <div className="w-full flex-shrink-0 px-4">
                  <RecentActivityCard
                    title="Top Routes"
                    items={topRoutes}
                    onViewAll={() => navigate('/dashboard/tracking')}
                    icon={MapPin}
                  />
                </div>

              </motion.div>
            </motion.div>
          </motion.div>
          
          {/* Performance Indicators */}
          <motion.div
            className="grid grid-cols-2 gap-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="p-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-caption font-medium text-gray-900 dark:text-gray-100">On-Time Rate</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {dashboardData.onTimeRate || '95'}%
              </p>
              <p className="text-caption text-gray-500 dark:text-gray-400">Last 30 days</p>
            </Card>
            
            <Card className="p-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-caption font-medium text-gray-900 dark:text-gray-100">Rating</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                {dashboardData.customerRating || '4.8'}
              </p>
              <p className="text-caption text-gray-500 dark:text-gray-400">Customer satisfaction</p>
            </Card>
          </motion.div>
        </motion.div>
      </PullToRefresh>
    </div>
  );
}