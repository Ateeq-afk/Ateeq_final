import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Package, Truck, Users, FileText, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
  entityType?: string;
  entityId?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  onActivityClick?: (activity: ActivityItem) => void;
  className?: string;
}

export function ActivityFeed({ activities, onActivityClick, className }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'booking_created':
      case 'booking_updated':
        return Package;
      case 'ogpl_created':
      case 'vehicle_assigned':
        return Truck;
      case 'customer_created':
      case 'customer_updated':
        return Users;
      case 'payment_received':
      case 'invoice_generated':
        return FileText;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'booking_created':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ogpl_created':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'payment_received':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'customer_created':
        return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("card-premium p-6", className)}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <Activity className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-heading font-semibold text-foreground">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Real-time updates from your operations</p>
        </div>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl",
                  "bg-gray-50/50 dark:bg-gray-800/50",
                  "hover:bg-gray-100/50 dark:hover:bg-gray-800/70",
                  "transition-all duration-200",
                  onActivityClick && "cursor-pointer"
                )}
                onClick={() => onActivityClick?.(activity)}
              >
                <div className={cn("p-2 rounded-lg", colorClass)}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    {activity.user && (
                      <p className="text-xs text-muted-foreground">
                        by {activity.user}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {activities.length === 0 && (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Activity className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-muted-foreground">No recent activities</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}