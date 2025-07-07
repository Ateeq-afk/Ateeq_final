import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Navigation,
  Truck,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Route,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Play,
  Pause,
  MoreVertical,
  Phone,
  MessageCircle,
  Calendar,
  Target,
  Zap,
  Activity
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { trackingService } from '@/services/tracking';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { useIsTouchDevice } from '@/hooks/useIsMobile';
import PullToRefresh from './PullToRefresh';
import { 
  ActivityIndicator, 
  TransactionSkeleton,
  NoSearchResults 
} from '@/components/ui/loading-states';
import { EmptyState } from '@/components/ui/empty-states';

interface TrackingItem {
  id: string;
  booking_id: string;
  booking_number: string;
  vehicle_number?: string;
  driver_name?: string;
  driver_phone?: string;
  current_location: string;
  destination: string;
  status: 'loading' | 'in_transit' | 'reached_destination' | 'delivered' | 'delayed';
  estimated_arrival?: string;
  actual_distance?: number;
  completed_distance?: number;
  last_update: string;
  customer_name: string;
}

interface MobileTrackingCardProps {
  item: TrackingItem;
  index: number;
  onClick: () => void;
  onQuickAction: (action: string) => void;
}

const getTrackingStatusConfig = (status: string) => {
  switch (status) {
    case 'loading':
      return {
        color: 'bg-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        textColor: 'text-blue-700 dark:text-blue-300',
        borderColor: 'border-blue-200 dark:border-blue-800',
        icon: Package,
        label: 'Loading',
        pulse: true
      };
    case 'in_transit':
      return {
        color: 'bg-purple-500',
        bgColor: 'bg-purple-50 dark:bg-purple-950/20',
        textColor: 'text-purple-700 dark:text-purple-300',
        borderColor: 'border-purple-200 dark:border-purple-800',
        icon: Truck,
        label: 'In Transit',
        pulse: true
      };
    case 'reached_destination':
      return {
        color: 'bg-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-950/20',
        textColor: 'text-orange-700 dark:text-orange-300',
        borderColor: 'border-orange-200 dark:border-orange-800',
        icon: Target,
        label: 'At Destination',
        pulse: true
      };
    case 'delivered':
      return {
        color: 'bg-green-500',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        textColor: 'text-green-700 dark:text-green-300',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: CheckCircle,
        label: 'Delivered',
        pulse: false
      };
    case 'delayed':
      return {
        color: 'bg-red-500',
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        textColor: 'text-red-700 dark:text-red-300',
        borderColor: 'border-red-200 dark:border-red-800',
        icon: AlertTriangle,
        label: 'Delayed',
        pulse: true
      };
    default:
      return {
        color: 'bg-gray-500',
        bgColor: 'bg-gray-50 dark:bg-gray-950/20',
        textColor: 'text-gray-700 dark:text-gray-300',
        borderColor: 'border-gray-200 dark:border-gray-800',
        icon: MapPin,
        label: 'Unknown',
        pulse: false
      };
  }
};

const AppleMobileTrackingCard: React.FC<MobileTrackingCardProps> = ({
  item,
  index,
  onClick,
  onQuickAction
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const isTouch = useIsTouchDevice();
  const statusConfig = getTrackingStatusConfig(item.status);
  const StatusIcon = statusConfig.icon;

  const handlePress = () => {
    if (isTouch && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
    onClick();
  };

  // Calculate progress percentage
  const progressPercentage = item.actual_distance && item.completed_distance 
    ? Math.min((item.completed_distance / item.actual_distance) * 100, 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      onTapStart={() => setIsPressed(true)}
      onTap={() => setIsPressed(false)}
      onTapCancel={() => setIsPressed(false)}
      onClick={handlePress}
      className={cn(
        "cursor-pointer relative overflow-hidden",
        "haptic-medium hover-lift-subtle"
      )}
    >
      <Card className={cn(
        "p-5 border-0 shadow-sm hover:shadow-lg transition-all duration-300",
        "bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm",
        "border border-gray-200/50 dark:border-gray-800/50",
        isPressed && "scale-[0.99]"
      )}>
        {/* Glass morphism background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent" />
        
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="relative z-10">
          {/* Header with booking number and status */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-body-md font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                  {item.booking_number}
                </span>
                <motion.div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    statusConfig.color
                  )}
                  animate={statusConfig.pulse ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs font-medium px-2 py-1 flex items-center gap-1 w-fit",
                  statusConfig.bgColor,
                  statusConfig.textColor,
                  statusConfig.borderColor
                )}
              >
                <StatusIcon className="w-3 h-3" strokeWidth={2} />
                {statusConfig.label}
              </Badge>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction('menu');
              }}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
            </motion.button>
          </div>

          {/* Route information */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
              <span className="text-body-sm font-medium text-gray-900 dark:text-gray-100">
                Current: {item.current_location}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600 dark:text-green-400" strokeWidth={1.5} />
              <span className="text-body-sm font-medium text-gray-900 dark:text-gray-100">
                Destination: {item.destination}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          {item.actual_distance && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-caption font-medium text-gray-500 dark:text-gray-400">Progress</span>
                <span className="text-caption font-bold text-gray-900 dark:text-gray-100">
                  {progressPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-caption text-gray-500 dark:text-gray-400">
                  {item.completed_distance}km completed
                </span>
                <span className="text-caption text-gray-500 dark:text-gray-400">
                  {item.actual_distance}km total
                </span>
              </div>
            </div>
          )}

          {/* Vehicle and driver info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-caption font-medium text-gray-500 dark:text-gray-400 mb-1">Vehicle</p>
              <div className="flex items-center gap-1">
                <Truck className="h-3 w-3 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
                <span className="text-body-sm font-semibold text-gray-900 dark:text-gray-100">
                  {item.vehicle_number || 'Not assigned'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-caption font-medium text-gray-500 dark:text-gray-400 mb-1">Driver</p>
              <span className="text-body-sm font-semibold text-gray-900 dark:text-gray-100 truncate block">
                {item.driver_name || 'Not assigned'}
              </span>
            </div>
          </div>

          {/* Customer and timing info */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-caption font-medium text-gray-500 dark:text-gray-400 mb-1">Customer</p>
              <span className="text-body-sm font-semibold text-gray-900 dark:text-gray-100 truncate block">
                {item.customer_name}
              </span>
            </div>
            
            {item.estimated_arrival && (
              <div className="text-right">
                <p className="text-caption font-medium text-gray-500 dark:text-gray-400 mb-1">ETA</p>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-orange-600 dark:text-orange-400" strokeWidth={1.5} />
                  <span className="text-body-sm font-semibold text-orange-600 dark:text-orange-400">
                    {new Date(item.estimated_arrival).toLocaleDateString('en-IN', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Last update */}
          <div className="flex items-center justify-between text-caption text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3" strokeWidth={1.5} />
              <span>Last update:</span>
            </div>
            <span className="font-medium">
              {new Date(item.last_update).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          {/* Quick action buttons */}
          {item.driver_phone && (
            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `tel:${item.driver_phone}`;
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl",
                  "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300",
                  "border border-green-200 dark:border-green-800 transition-colors",
                  "haptic-light hover:bg-green-100 dark:hover:bg-green-950/30"
                )}
              >
                <Phone className="h-4 w-4" strokeWidth={1.5} />
                <span className="text-caption font-medium">Call</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAction('track');
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl",
                  "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300",
                  "border border-blue-200 dark:border-blue-800 transition-colors",
                  "haptic-light hover:bg-blue-100 dark:hover:bg-blue-950/30"
                )}
              >
                <Navigation className="h-4 w-4" strokeWidth={1.5} />
                <span className="text-caption font-medium">Track</span>
              </motion.button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default function MobileTrackingDashboard() {
  const navigate = useNavigate();
  const { selectedBranch } = useBranchSelection();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [refreshing, setRefreshing] = useState(false);
  const isTouch = useIsTouchDevice();

  // Fetch tracking data
  const { 
    data: trackingItems = [], 
    isLoading, 
    refetch,
    error 
  } = useQuery({
    queryKey: ['mobile-tracking', selectedBranch?.id, searchTerm, statusFilter],
    queryFn: () => trackingService.getActiveTracking({
      branch_id: selectedBranch?.id,
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }),
    refetchInterval: 15000 // More frequent updates for tracking
  });

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
      if (isTouch && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  }, [refetch, isTouch]);

  const handleTrackingClick = (item: TrackingItem) => {
    navigate(`/dashboard/tracking/${item.booking_id}`);
  };

  const handleQuickAction = (itemId: string, action: string) => {
    switch (action) {
      case 'track':
        navigate(`/dashboard/tracking/${itemId}`);
        break;
      case 'booking':
        navigate(`/dashboard/bookings/${itemId}`);
        break;
      case 'map':
        navigate(`/dashboard/tracking/${itemId}/map`);
        break;
      default:
        break;
    }
  };

  const filteredItems = trackingItems.filter(item => 
    item.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.current_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/30 pb-20">
        <div className="px-4 pt-6">
          {/* Header skeleton */}
          <div className="mb-6">
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          
          {/* Search skeleton */}
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse mb-6" />
          
          {/* Tracking skeletons */}
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <TransactionSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/30 pb-20">
      {/* Enhanced refresh indicator */}
      <AnimatePresence>
        {refreshing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-lg border border-gray-200/50 dark:border-gray-700/50 flex items-center gap-3">
              <ActivityIndicator size="sm" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Refreshing tracking...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 pt-6">
          {/* Enhanced Header */}
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-display-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                  Live Tracking
                </h1>
                <p className="text-body-sm text-gray-600 dark:text-gray-400">
                  {filteredItems.length} {filteredItems.length === 1 ? 'shipment' : 'shipments'} in transit
                </p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard/tracking/map')}
                className={cn(
                  "w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600",
                  "text-white shadow-lg hover:shadow-xl flex items-center justify-center",
                  "transition-all duration-300 haptic-medium"
                )}
              >
                <MapPin className="h-6 w-6" strokeWidth={2} />
              </motion.button>
            </div>
          </motion.div>

          {/* Enhanced Search and Filter */}
          <motion.div 
            className="mb-6 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" strokeWidth={1.5} />
              <Input
                placeholder="Search bookings, vehicles, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  "pl-12 pr-4 py-3 rounded-2xl border-0 bg-white/70 dark:bg-gray-900/70",
                  "backdrop-blur-sm shadow-sm focus:shadow-lg transition-all duration-300",
                  "text-body-md placeholder:text-gray-500"
                )}
              />
            </div>

            {/* Status filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['active', 'loading', 'in_transit', 'reached_destination', 'delayed'].map((status) => (
                <motion.button
                  key={status}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-4 py-2 rounded-full text-caption font-medium whitespace-nowrap",
                    "transition-all duration-300 haptic-light",
                    statusFilter === status
                      ? "bg-blue-500 text-white shadow-lg"
                      : "bg-white/60 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  {status === 'active' ? 'All Active' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Tracking List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {error ? (
              <EmptyState
                icon={AlertTriangle}
                title="Failed to load tracking data"
                description="There was an error loading tracking information. Please try again."
                action={{
                  label: "Retry",
                  onClick: () => refetch()
                }}
              />
            ) : filteredItems.length === 0 ? (
              searchTerm ? (
                <NoSearchResults 
                  searchTerm={searchTerm}
                  onClear={() => setSearchTerm('')}
                />
              ) : (
                <EmptyState
                  icon={MapPin}
                  title="No active tracking"
                  description="There are no shipments currently in transit. Start tracking by creating bookings."
                  action={{
                    label: "View Bookings",
                    onClick: () => navigate('/dashboard/bookings')
                  }}
                />
              )
            ) : (
              <div className="space-y-3 pb-6">
                {filteredItems.map((item, index) => (
                  <AppleMobileTrackingCard
                    key={item.id}
                    item={item}
                    index={index}
                    onClick={() => handleTrackingClick(item)}
                    onQuickAction={(action) => handleQuickAction(item.booking_id, action)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </PullToRefresh>
    </div>
  );
}