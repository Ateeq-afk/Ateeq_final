import React from 'react';
import { motion } from 'framer-motion';
import { Route, TrendingUp, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RouteData {
  from: string;
  to: string;
  count: number;
  revenue: number;
}

interface PopularRoutesWidgetProps {
  routes: RouteData[];
  onRouteClick?: (route: RouteData) => void;
  className?: string;
}

export function PopularRoutesWidget({ routes, onRouteClick, className }: PopularRoutesWidgetProps) {
  const maxCount = Math.max(...routes.map(r => r.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("card-premium p-6", className)}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
          <Route className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-heading font-semibold text-foreground">Popular Routes</h3>
          <p className="text-sm text-muted-foreground">Most frequently used shipping routes</p>
        </div>
      </div>

      <div className="space-y-4">
        {routes.map((route, index) => (
          <motion.div
            key={`${route.from}-${route.to}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className={cn(
              "p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/50",
              "hover:bg-gray-100/50 dark:hover:bg-gray-800/70",
              "transition-all duration-200",
              onRouteClick && "cursor-pointer"
            )}
            onClick={() => onRouteClick?.(route)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-medium text-sm">{route.from}</span>
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span className="font-medium text-sm">{route.to}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">₹{route.revenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{route.count} shipments</p>
              </div>
            </div>
            
            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(route.count / maxCount) * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full"
              />
            </div>
          </motion.div>
        ))}

        {routes.length === 0 && (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Route className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-muted-foreground">No route data available</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}