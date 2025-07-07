import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Package, Truck, Users, 
  Clock, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickStatProps {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  status?: 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
}

export function QuickStat({ label, value, change, icon: Icon, status = 'info', onClick }: QuickStatProps) {
  const statusColors = {
    success: 'from-green-500 to-emerald-600',
    warning: 'from-amber-500 to-orange-600',
    danger: 'from-red-500 to-rose-600',
    info: 'from-blue-500 to-indigo-600'
  };

  const changeColors = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400'
  };

  const getChangeType = (value?: number) => {
    if (value === undefined) return 'neutral';
    return value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={cn(
        "relative overflow-hidden rounded-xl p-4 glass-card",
        "border border-white/10",
        "transition-all duration-300",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change !== undefined && (
            <div className={cn("flex items-center gap-1 mt-2", changeColors[getChangeType(change)])}>
              {change > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : change < 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : null}
              <span className="text-sm font-medium">
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-xl bg-gradient-to-br",
          statusColors[status]
        )}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

interface QuickStatsGridProps {
  stats: Array<{
    label: string;
    value: string | number;
    change?: number;
    icon: React.ElementType;
    status?: 'success' | 'warning' | 'danger' | 'info';
    onClick?: () => void;
  }>;
}

export function QuickStatsGrid({ stats }: QuickStatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <QuickStat {...stat} />
        </motion.div>
      ))}
    </div>
  );
}