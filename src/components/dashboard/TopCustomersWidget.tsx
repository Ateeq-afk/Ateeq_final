import React from 'react';
import { motion } from 'framer-motion';
import { Users, Crown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface CustomerData {
  id: string;
  name: string;
  totalBookings: number;
  totalRevenue: number;
}

interface TopCustomersWidgetProps {
  customers: CustomerData[];
  onCustomerClick?: (customer: CustomerData) => void;
  className?: string;
}

export function TopCustomersWidget({ customers, onCustomerClick, className }: TopCustomersWidgetProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (index === 1) return <Crown className="h-4 w-4 text-gray-400" />;
    if (index === 2) return <Crown className="h-4 w-4 text-amber-600" />;
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("card-premium p-6", className)}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
          <Users className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-heading font-semibold text-foreground">Top Customers</h3>
          <p className="text-sm text-muted-foreground">Your most valuable customers</p>
        </div>
      </div>

      <div className="space-y-3">
        {customers.map((customer, index) => (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl",
              "bg-gray-50/50 dark:bg-gray-800/50",
              "hover:bg-gray-100/50 dark:hover:bg-gray-800/70",
              "transition-all duration-200",
              onCustomerClick && "cursor-pointer"
            )}
            onClick={() => onCustomerClick?.(customer)}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-white font-semibold">
                    {getInitials(customer.name)}
                  </AvatarFallback>
                </Avatar>
                {index < 3 && (
                  <div className="absolute -top-1 -right-1">
                    {getRankIcon(index)}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{customer.name}</p>
                <p className="text-sm text-muted-foreground">
                  {customer.totalBookings} bookings
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="font-semibold text-foreground">₹{(customer.totalRevenue / 1000).toFixed(1)}K</p>
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <TrendingUp className="h-3 w-3" />
                <span>Active</span>
              </div>
            </div>
          </motion.div>
        ))}

        {customers.length === 0 && (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-muted-foreground">No customer data available</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}