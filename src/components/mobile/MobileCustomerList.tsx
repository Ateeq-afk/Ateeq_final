import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Building2,
  MoreVertical,
  Star,
  TrendingUp,
  Package,
  DollarSign,
  Calendar,
  ChevronRight,
  UserPlus,
  Filter,
  AlertTriangle,
  Eye,
  Edit
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { customerService } from '@/services/customer';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { useIsTouchDevice } from '@/hooks/useIsMobile';
import PullToRefresh from './PullToRefresh';
import { 
  ActivityIndicator, 
  TransactionSkeleton,
  NoSearchResults 
} from '@/components/ui/loading-states';
import { EmptyState } from '@/components/ui/empty-states';
import { SwipeableCard } from './SwipeableCard';
import { TouchRipple } from './TouchRipple';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  customer_type: 'individual' | 'business';
  credit_limit?: number;
  outstanding_amount?: number;
  total_bookings?: number;
  last_booking?: string;
  rating?: number;
  created_at: string;
}

interface MobileCustomerCardProps {
  customer: Customer;
  index: number;
  onClick: () => void;
  onQuickAction: (action: string) => void;
}

const getCustomerTypeConfig = (type: string) => {
  switch (type) {
    case 'business':
      return {
        color: 'bg-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        textColor: 'text-blue-700 dark:text-blue-300',
        borderColor: 'border-blue-200 dark:border-blue-800',
        icon: Building2,
        label: 'Business'
      };
    case 'individual':
      return {
        color: 'bg-green-500',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        textColor: 'text-green-700 dark:text-green-300',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: Users,
        label: 'Individual'
      };
    default:
      return {
        color: 'bg-gray-500',
        bgColor: 'bg-gray-50 dark:bg-gray-950/20',
        textColor: 'text-gray-700 dark:text-gray-300',
        borderColor: 'border-gray-200 dark:border-gray-800',
        icon: Users,
        label: 'Customer'
      };
  }
};

const AppleMobileCustomerCard: React.FC<MobileCustomerCardProps> = ({
  customer,
  index,
  onClick,
  onQuickAction
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const isTouch = useIsTouchDevice();
  const typeConfig = getCustomerTypeConfig(customer.customer_type);
  const TypeIcon = typeConfig.icon;

  const handlePress = () => {
    if (isTouch && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
    onClick();
  };

  // Calculate customer status based on outstanding amount and credit limit
  const getFinancialStatus = () => {
    if (!customer.credit_limit || !customer.outstanding_amount) return null;
    
    const utilizationPercent = (customer.outstanding_amount / customer.credit_limit) * 100;
    
    if (utilizationPercent > 90) {
      return { status: 'critical', color: 'text-red-600 dark:text-red-400', label: 'Credit Limit Reached' };
    } else if (utilizationPercent > 70) {
      return { status: 'warning', color: 'text-orange-600 dark:text-orange-400', label: 'High Utilization' };
    } else {
      return { status: 'good', color: 'text-green-600 dark:text-green-400', label: 'Good Standing' };
    }
  };

  const financialStatus = getFinancialStatus();

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
          {/* Header with customer name and type */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {/* Avatar */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    typeConfig.bgColor,
                    typeConfig.borderColor,
                    "border"
                  )}
                >
                  <TypeIcon className={cn("h-6 w-6", typeConfig.textColor)} strokeWidth={1.5} />
                </motion.div>
                
                <div className="flex-1">
                  <h3 className="text-body-md font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-1">
                    {customer.name}
                  </h3>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs font-medium px-2 py-1",
                      typeConfig.bgColor,
                      typeConfig.textColor,
                      typeConfig.borderColor
                    )}
                  >
                    {typeConfig.label}
                  </Badge>
                </div>
              </div>
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

          {/* Contact information */}
          <div className="space-y-2 mb-4">
            {customer.phone && (
              <div className="flex items-center gap-2 text-body-sm text-gray-600 dark:text-gray-400">
                <Phone className="h-3 w-3" strokeWidth={1.5} />
                <span className="font-medium">{customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2 text-body-sm text-gray-600 dark:text-gray-400">
                <Mail className="h-3 w-3" strokeWidth={1.5} />
                <span className="font-medium truncate">{customer.email}</span>
              </div>
            )}
            {customer.city && (
              <div className="flex items-center gap-2 text-body-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-3 w-3" strokeWidth={1.5} />
                <span className="font-medium">{customer.city}</span>
              </div>
            )}
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Package className="h-3 w-3 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                <span className="text-caption font-medium text-gray-500 dark:text-gray-400">Bookings</span>
              </div>
              <span className="text-body-md font-bold text-gray-900 dark:text-gray-100">
                {customer.total_bookings || 0}
              </span>
            </div>
            
            {customer.rating && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="h-3 w-3 text-yellow-600 dark:text-yellow-400" strokeWidth={1.5} />
                  <span className="text-caption font-medium text-gray-500 dark:text-gray-400">Rating</span>
                </div>
                <span className="text-body-md font-bold text-yellow-600 dark:text-yellow-400">
                  {customer.rating.toFixed(1)}
                </span>
              </div>
            )}
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="h-3 w-3 text-green-600 dark:text-green-400" strokeWidth={1.5} />
                <span className="text-caption font-medium text-gray-500 dark:text-gray-400">Joined</span>
              </div>
              <span className="text-body-sm font-semibold text-gray-900 dark:text-gray-100">
                {new Date(customer.created_at).toLocaleDateString('en-IN', { 
                  month: 'short', 
                  year: '2-digit' 
                })}
              </span>
            </div>
          </div>

          {/* Financial status */}
          {customer.credit_limit && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-caption font-medium text-gray-600 dark:text-gray-400">
                  Credit Utilization
                </span>
                {financialStatus && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs font-medium",
                      financialStatus.color
                    )}
                  >
                    {financialStatus.label}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between text-body-sm">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  ₹{(customer.outstanding_amount || 0).toLocaleString()}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  / ₹{customer.credit_limit.toLocaleString()}
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${Math.min(((customer.outstanding_amount || 0) / customer.credit_limit) * 100, 100)}%` 
                  }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={cn(
                    "h-full rounded-full",
                    financialStatus?.status === 'critical' ? 'bg-red-500' :
                    financialStatus?.status === 'warning' ? 'bg-orange-500' :
                    'bg-green-500'
                  )}
                />
              </div>
            </div>
          )}

          {/* Last booking */}
          {customer.last_booking && (
            <div className="flex items-center justify-between text-caption text-gray-500 dark:text-gray-400">
              <span>Last booking:</span>
              <span className="font-medium">
                {new Date(customer.last_booking).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short'
                })}
              </span>
            </div>
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

export default function MobileCustomerList() {
  const navigate = useNavigate();
  const { selectedBranch } = useBranchSelection();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const isTouch = useIsTouchDevice();

  // Fetch customers data
  const { 
    data: customers = [], 
    isLoading, 
    refetch,
    error 
  } = useQuery({
    queryKey: ['mobile-customers', selectedBranch?.id, searchTerm, typeFilter],
    queryFn: () => customerService.getCustomers({
      branch_id: selectedBranch?.id,
      search: searchTerm || undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined
    }),
    refetchInterval: 60000
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

  const handleCustomerClick = (customer: Customer) => {
    navigate(`/dashboard/customers/${customer.id}`);
  };

  const handleQuickAction = (customerId: string, action: string) => {
    switch (action) {
      case 'view':
        navigate(`/dashboard/customers/${customerId}`);
        break;
      case 'booking':
        navigate(`/dashboard/new-booking?customer=${customerId}`);
        break;
      case 'edit':
        navigate(`/dashboard/customers/${customerId}/edit`);
        break;
      default:
        break;
    }
  };

  const createCustomerSwipeActions = (customer: Customer) => ({
    left: [
      {
        id: 'call',
        label: 'Call',
        icon: Phone,
        color: 'success' as const,
        action: () => {
          if (customer.phone) {
            window.location.href = `tel:${customer.phone}`;
          } else {
            console.log(`No phone number for ${customer.name}`);
          }
        }
      },
      {
        id: 'booking',
        label: 'Book',
        icon: Plus,
        color: 'primary' as const,
        action: () => navigate(`/dashboard/new-booking?customer=${customer.id}`)
      }
    ],
    right: [
      {
        id: 'edit',
        label: 'Edit',
        icon: Edit,
        color: 'warning' as const,
        action: () => navigate(`/dashboard/customers/${customer.id}/edit`)
      },
      {
        id: 'details',
        label: 'Details',
        icon: Eye,
        color: 'secondary' as const,
        action: () => navigate(`/dashboard/customers/${customer.id}`)
      }
    ]
  });

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.city?.toLowerCase().includes(searchTerm.toLowerCase())
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
          
          {/* Customer skeletons */}
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
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Refreshing customers...</span>
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
                  Customers
                </h1>
                <p className="text-body-sm text-gray-600 dark:text-gray-400">
                  {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'} found
                </p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard/customers/new')}
                className={cn(
                  "w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600",
                  "text-white shadow-lg hover:shadow-xl flex items-center justify-center",
                  "transition-all duration-300 haptic-medium"
                )}
              >
                <UserPlus className="h-6 w-6" strokeWidth={2} />
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
                placeholder="Search customers, email, phone, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  "pl-12 pr-4 py-3 rounded-2xl border-0 bg-white/70 dark:bg-gray-900/70",
                  "backdrop-blur-sm shadow-sm focus:shadow-lg transition-all duration-300",
                  "text-body-md placeholder:text-gray-500"
                )}
              />
            </div>

            {/* Type filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['all', 'individual', 'business'].map((type) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTypeFilter(type)}
                  className={cn(
                    "px-4 py-2 rounded-full text-caption font-medium whitespace-nowrap",
                    "transition-all duration-300 haptic-light",
                    typeFilter === type
                      ? "bg-blue-500 text-white shadow-lg"
                      : "bg-white/60 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Customers List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {error ? (
              <EmptyState
                icon={AlertTriangle}
                title="Failed to load customers"
                description="There was an error loading your customers. Please try again."
                action={{
                  label: "Retry",
                  onClick: () => refetch()
                }}
              />
            ) : filteredCustomers.length === 0 ? (
              searchTerm ? (
                <NoSearchResults 
                  searchTerm={searchTerm}
                  onClear={() => setSearchTerm('')}
                />
              ) : (
                <EmptyState
                  icon={Users}
                  title="No customers yet"
                  description="Add your first customer to start managing relationships and bookings."
                  action={{
                    label: "Add Customer",
                    onClick: () => navigate('/dashboard/customers/new')
                  }}
                />
              )
            ) : (
              <div className="space-y-3 pb-6">
                {filteredCustomers.map((customer, index) => {
                  const swipeActions = createCustomerSwipeActions(customer);
                  return (
                    <SwipeableCard
                      key={customer.id}
                      leftActions={swipeActions.left}
                      rightActions={swipeActions.right}
                      className="rounded-2xl overflow-hidden"
                      onSwipe={(direction, actionId) => {
                        console.log(`Swiped ${direction} with action ${actionId} on customer ${customer.name}`);
                      }}
                    >
                      <TouchRipple rippleColor="rgba(139, 92, 246, 0.1)">
                        <AppleMobileCustomerCard
                          customer={customer}
                          index={index}
                          onClick={() => handleCustomerClick(customer)}
                          onQuickAction={(action) => handleQuickAction(customer.id, action)}
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