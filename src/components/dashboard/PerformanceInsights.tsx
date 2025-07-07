import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Target, Award, 
  AlertTriangle, Lightbulb, Zap, BarChart3 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface Insight {
  id: string;
  type: 'achievement' | 'opportunity' | 'warning' | 'tip';
  title: string;
  description: string;
  metric?: {
    value: number;
    target: number;
    unit: string;
  };
  impact?: 'high' | 'medium' | 'low';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface PerformanceInsightsProps {
  insights: Insight[];
  className?: string;
}

export function PerformanceInsights({ insights, className }: PerformanceInsightsProps) {
  const getIcon = (type: Insight['type']) => {
    switch (type) {
      case 'achievement':
        return Award;
      case 'opportunity':
        return Lightbulb;
      case 'warning':
        return AlertTriangle;
      case 'tip':
        return Zap;
    }
  };

  const getColorClasses = (type: Insight['type']) => {
    switch (type) {
      case 'achievement':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
          iconBg: 'bg-green-100 dark:bg-green-900/30'
        };
      case 'opportunity':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          iconBg: 'bg-blue-100 dark:bg-blue-900/30'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          border: 'border-amber-200 dark:border-amber-800',
          icon: 'text-amber-600 dark:text-amber-400',
          iconBg: 'bg-amber-100 dark:bg-amber-900/30'
        };
      case 'tip':
        return {
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          border: 'border-purple-200 dark:border-purple-800',
          icon: 'text-purple-600 dark:text-purple-400',
          iconBg: 'bg-purple-100 dark:bg-purple-900/30'
        };
    }
  };

  const getImpactBadge = (impact?: Insight['impact']) => {
    if (!impact) return null;
    
    const colors = {
      high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    };

    return (
      <span className={cn(
        "text-xs font-medium px-2 py-1 rounded-full",
        colors[impact]
      )}>
        {impact.charAt(0).toUpperCase() + impact.slice(1)} Impact
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("card-premium p-6", className)}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-heading font-semibold text-foreground">Performance Insights</h3>
          <p className="text-sm text-muted-foreground">AI-powered recommendations</p>
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => {
          const Icon = getIcon(insight.type);
          const colors = getColorClasses(insight.type);

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className={cn(
                "p-4 rounded-xl border transition-all duration-200",
                colors.bg,
                colors.border,
                "hover:shadow-md"
              )}
            >
              <div className="flex gap-4">
                <div className={cn("p-3 rounded-lg flex-shrink-0", colors.iconBg)}>
                  <Icon className={cn("h-5 w-5", colors.icon)} />
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-foreground">{insight.title}</h4>
                      {getImpactBadge(insight.impact)}
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>

                  {insight.metric && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {insight.metric.value} / {insight.metric.target} {insight.metric.unit}
                        </span>
                      </div>
                      <Progress 
                        value={(insight.metric.value / insight.metric.target) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}

                  {insight.action && (
                    <button
                      onClick={insight.action.onClick}
                      className={cn(
                        "text-sm font-medium transition-colors",
                        colors.icon,
                        "hover:underline"
                      )}
                    >
                      {insight.action.label} →
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {insights.length === 0 && (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-muted-foreground">No insights available</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}