import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  ChevronRight,
  Plus,
  Eye,
  MoreVertical,
  Truck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { bookingService } from '@/services/booking';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { useIsTouchDevice } from '@/hooks/useIsMobile';
import PullToRefresh from './PullToRefresh';
import { 
  ActivityIndicator, 
  TransactionSkeleton,
  NoSearchResults 
} from '@/components/ui/loading-states';
import { EmptyState } from '@/components/ui/empty-states';
import { SwipeableCard, commonActions } from './SwipeableCard';
import { TouchRipple } from './TouchRipple';

interface Booking {
  id: string;
  booking_number: string;
  origin: string;
  destination: string;
  status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';
  total_amount: number;
  created_at: string;
  customer_name: string;
  article_count: number;
  expected_delivery?: string;
}

interface MobileBookingCardProps {
  booking: Booking;
  index: number;
  onClick: () => void;
  onQuickAction: (action: string) => void;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending':
      return {
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
        textColor: 'text-yellow-700 dark:text-yellow-300',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        icon: Clock
      };
    case 'confirmed':
      return {
        color: 'bg-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        textColor: 'text-blue-700 dark:text-blue-300',
        borderColor: 'border-blue-200 dark:border-blue-800',
        icon: CheckCircle
      };
    case 'in_transit':
      return {
        color: 'bg-purple-500',
        bgColor: 'bg-purple-50 dark:bg-purple-950/20',
        textColor: 'text-purple-700 dark:text-purple-300',
        borderColor: 'border-purple-200 dark:border-purple-800',
        icon: Truck
      };
    case 'delivered':
      return {
        color: 'bg-green-500',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        textColor: 'text-green-700 dark:text-green-300',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: CheckCircle
      };
    case 'cancelled':
      return {
        color: 'bg-red-500',
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        textColor: 'text-red-700 dark:text-red-300',
        borderColor: 'border-red-200 dark:border-red-800',
        icon: XCircle
      };
    default:
      return {
        color: 'bg-gray-500',
        bgColor: 'bg-gray-50 dark:bg-gray-950/20',
        textColor: 'text-gray-700 dark:text-gray-300',
        borderColor: 'border-gray-200 dark:border-gray-800',
        icon: Package
      };
  }
};

const AppleMobileBookingCard: React.FC<MobileBookingCardProps> = ({
  booking,
  index,
  onClick,
  onQuickAction
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const isTouch = useIsTouchDevice();
  const statusConfig = getStatusConfig(booking.status);
  const StatusIcon = statusConfig.icon;

  const handlePress = () => {
    if (isTouch && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
    onClick();
  };

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
              <div className="flex items-center gap-2 mb-1">
                <span className="text-body-md font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                  {booking.booking_number}
                </span>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    statusConfig.color
                  )}
                />
              </div>
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs font-medium px-2 py-1",
                  statusConfig.bgColor,
                  statusConfig.textColor,
                  statusConfig.borderColor
                )}
              >
                <StatusIcon className="w-3 h-3 mr-1" strokeWidth={2} />
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
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
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-body-sm text-gray-900 dark:text-gray-100">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                <span className="font-medium">{booking.origin}</span>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 dark:from-gray-600 dark:via-gray-700 dark:to-gray-600" />
                <span className="font-medium">{booking.destination}</span>
              </div>
            </div>
          </div>

          {/* Customer and article info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-caption font-medium text-gray-500 dark:text-gray-400 mb-1">Customer</p>
              <p className="text-body-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {booking.customer_name}
              </p>
            </div>
            <div>
              <p className="text-caption font-medium text-gray-500 dark:text-gray-400 mb-1">Articles</p>
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
                <span className="text-body-sm font-semibold text-gray-900 dark:text-gray-100">
                  {booking.article_count} items
                </span>
              </div>
            </div>
          </div>

          {/* Financial and timing info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" strokeWidth={1.5} />
              <span className="text-body-md font-bold text-green-600 dark:text-green-400 tabular-nums">
                ₹{booking.total_amount.toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-caption text-gray-500 dark:text-gray-400">
              <Calendar className="h-3 w-3" strokeWidth={1.5} />
              <span>
                {new Date(booking.created_at).toLocaleDateString('en-IN', { 
                  day: 'numeric', 
                  month: 'short' 
                })}
              </span>
            </div>
          </div>

          {/* Expected delivery for in-transit bookings */}
          {booking.status === 'in_transit' && booking.expected_delivery && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="flex items-center gap-2 text-caption text-blue-600 dark:text-blue-400">
                <Clock className="h-3 w-3" strokeWidth={1.5} />
                <span className="font-medium">
                  Expected delivery: {new Date(booking.expected_delivery).toLocaleDateString('en-IN')}
                </span>
              </div>
            </motion.div>
          )}

          {/* Hover indicator */}
          <motion.div
            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
            initial={{ x: 10 }}
            whileHover={{ x: 0 }}
          >
            <div className="w-6 h-6 rounded-full bg-blue-500/20 backdrop-blur-sm flex items-center justify-center">
              <ChevronRight className="h-3 w-3 text-blue-600 dark:text-blue-400" strokeWidth={2} />
            </div>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};

export default function MobileBookingList() {
  const navigate = useNavigate();
  const { selectedBranch } = useBranchSelection();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const isTouch = useIsTouchDevice();

  // Fetch bookings data
  const { 
    data: bookings = [], 
    isLoading, 
    refetch,
    error 
  } = useQuery({
    queryKey: ['mobile-bookings', selectedBranch?.id, searchTerm, statusFilter],
    queryFn: () => bookingService.getBookings({
      branch_id: selectedBranch?.id,
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }),
    refetchInterval: 30000
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

  const handleBookingClick = (booking: Booking) => {
    navigate(`/dashboard/bookings/${booking.id}`);
  };

  const handleQuickAction = (bookingId: string, action: string) => {
    switch (action) {
      case 'view':
        navigate(`/dashboard/bookings/${bookingId}`);
        break;
      case 'track':
        navigate(`/dashboard/tracking?booking=${bookingId}`);
        break;
      case 'edit':
        navigate(`/dashboard/bookings/${bookingId}/edit`);
        break;
      default:
        break;
    }
  };

  const createSwipeActions = (booking: Booking) => ({
    left: [
      {
        id: 'track',
        label: 'Track',
        icon: MapPin,
        color: 'primary' as const,
        action: () => navigate(`/dashboard/tracking?booking=${booking.id}`)
      },
      {
        id: 'call',
        label: 'Call',
        icon: Phone,
        color: 'success' as const,
        action: () => {
          // In a real app, this would get customer phone from booking
          console.log(`Calling customer for booking ${booking.booking_number}`);
        }
      }
    ],
    right: [
      {
        id: 'edit',
        label: 'Edit',
        icon: Edit,
        color: 'warning' as const,
        action: () => navigate(`/dashboard/bookings/${booking.id}/edit`)
      },
      {
        id: 'details',
        label: 'Details',
        icon: Eye,
        color: 'secondary' as const,
        action: () => navigate(`/dashboard/bookings/${booking.id}`)
      }
    ]
  });

  const filteredBookings = bookings.filter(booking => 
    booking.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.destination.toLowerCase().includes(searchTerm.toLowerCase())
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
          
          {/* Booking skeletons */}
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
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Refreshing bookings...</span>
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
                  Bookings
                </h1>
                <p className="text-body-sm text-gray-600 dark:text-gray-400">
                  {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'} found
                </p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard/new-booking')}
                className={cn(
                  "w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600",
                  "text-white shadow-lg hover:shadow-xl flex items-center justify-center",
                  "transition-all duration-300 haptic-medium"
                )}
              >
                <Plus className="h-6 w-6" strokeWidth={2} />
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
                placeholder="Search bookings, customers, or routes..."
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
              {['all', 'pending', 'confirmed', 'in_transit', 'delivered'].map((status) => (
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
                  {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Bookings List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {error ? (
              <EmptyState
                icon={AlertTriangle}
                title="Failed to load bookings"
                description="There was an error loading your bookings. Please try again."
                action={{
                  label: "Retry",
                  onClick: () => refetch()
                }}
              />
            ) : filteredBookings.length === 0 ? (
              searchTerm ? (
                <NoSearchResults 
                  searchTerm={searchTerm}
                  onClear={() => setSearchTerm('')}
                />
              ) : (
                <EmptyState
                  icon={Package}
                  title="No bookings yet"
                  description="Create your first booking to get started with tracking and management."
                  action={{
                    label: "Create Booking",
                    onClick: () => navigate('/dashboard/new-booking')
                  }}
                />
              )
            ) : (
              <div className="space-y-3 pb-6">
                {filteredBookings.map((booking, index) => {
                  const swipeActions = createSwipeActions(booking);
                  return (
                    <SwipeableCard
                      key={booking.id}
                      leftActions={swipeActions.left}
                      rightActions={swipeActions.right}
                      className="rounded-2xl overflow-hidden"
                      onSwipe={(direction, actionId) => {
                        console.log(`Swiped ${direction} with action ${actionId} on booking ${booking.booking_number}`);
                      }}
                    >
                      <TouchRipple rippleColor="rgba(59, 130, 246, 0.1)">
                        <AppleMobileBookingCard
                          booking={booking}
                          index={index}
                          onClick={() => handleBookingClick(booking)}
                          onQuickAction={(action) => handleQuickAction(booking.id, action)}
                        />
                      </TouchRipple>
                    </SwipeableCard>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </PullToRefresh>
    </div>
  );
}