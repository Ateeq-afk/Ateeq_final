import React from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
  Eye,
  ChevronRight,
  Activity,
  BarChart3,
  Users,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Insight {
  id: string;
  type: 'opportunity' | 'warning' | 'optimization' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  value?: string;
  progress?: number;
  tags?: string[];
}

interface AnalyticsInsightsProps {
  insights?: Insight[];
  onInsightClick?: (insight: Insight) => void;
  onViewAll?: () => void;
}

const defaultInsights: Insight[] = [
  {
    id: '1',
    type: 'opportunity',
    title: 'Route Optimization Potential',
    description: 'Delhi-Mumbai route shows 15% cost reduction opportunity through consolidation',
    impact: 'high',
    actionable: true,
    value: '₹2.3L monthly savings',
    tags: ['Routes', 'Cost Savings']
  },
  {
    id: '2',
    type: 'warning',
    title: 'Vehicle Utilization Peak',
    description: '3 vehicles operating at 95%+ capacity. Consider fleet expansion',
    impact: 'high',
    actionable: true,
    value: '95% utilization',
    tags: ['Fleet', 'Capacity']
  },
  {
    id: '3',
    type: 'trend',
    title: 'Customer Retention Improvement',
    description: 'Corporate clients show 30% higher order values and better retention',
    impact: 'medium',
    actionable: true,
    value: '+30% AOV',
    tags: ['Customers', 'Revenue']
  },
  {
    id: '4',
    type: 'optimization',
    title: 'Delivery Time Performance',
    description: 'Peak hour deliveries taking 20% longer. Schedule optimization needed',
    impact: 'medium',
    actionable: true,
    progress: 78,
    tags: ['Operations', 'Efficiency']
  }
];

const insightConfig = {
  opportunity: {
    icon: Target,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    gradient: 'from-green-500 to-emerald-500'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    gradient: 'from-amber-500 to-orange-500'
  },
  trend: {
    icon: TrendingUp,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-500 to-indigo-500'
  },
  optimization: {
    icon: Zap,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    gradient: 'from-purple-500 to-pink-500'
  }
};

const impactConfig = {
  high: {
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    label: 'High Impact'
  },
  medium: {
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'Medium Impact'
  },
  low: {
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Low Impact'
  }
};

export function AnalyticsInsights({
  insights = defaultInsights,
  onInsightClick,
  onViewAll
}: AnalyticsInsightsProps) {
  return (
    <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Smart Insights
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                AI-powered business recommendations
              </p>
            </div>
          </div>
          
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {insights.slice(0, 4).map((insight, index) => {
          const config = insightConfig[insight.type];
          const impact = impactConfig[insight.impact];
          const IconComponent = config.icon;
          
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-xl border-l-4 ${config.bg} ${config.border} cursor-pointer group transition-all duration-200`}
              onClick={() => onInsightClick?.(insight)}
            >
              <div className="flex items-start gap-4">
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-200`}>
                  <IconComponent className="h-4 w-4 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-slate-900 dark:text-white text-sm leading-tight">
                      {insight.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${impact.bg} ${impact.color} border-none`}
                      >
                        {impact.label}
                      </Badge>
                      {insight.actionable && (
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                    {insight.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {insight.value && (
                        <Badge variant="secondary" className="text-xs">
                          {insight.value}
                        </Badge>
                      )}
                      {insight.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {insight.actionable && (
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                  </div>
                  
                  {insight.progress !== undefined && (
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          Optimization Progress
                        </span>
                        <span className="text-xs font-medium text-slate-900 dark:text-white">
                          {insight.progress}%
                        </span>
                      </div>
                      <Progress value={insight.progress} className="h-1.5" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="pt-2 border-t border-slate-200 dark:border-slate-700"
        >
          <Button
            variant="ghost"
            className="w-full justify-between text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white group"
            onClick={onViewAll}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>View detailed analytics</span>
            </div>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}