import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Line } from 'react-chartjs-2';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    data?: number[];
  };
  subtitle?: string;
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'indigo';
  onClick?: () => void;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorConfig = {
  blue: {
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  green: {
    gradient: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  red: {
    gradient: 'from-red-500 to-red-600',
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
  amber: {
    gradient: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  purple: {
    gradient: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  indigo: {
    gradient: 'from-indigo-500 to-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
};

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  subtitle, 
  color, 
  onClick, 
  loading = false,
  size = 'md',
  className 
}: MetricCardProps) {
  const colors = colorConfig[color];
  
  const chartData = trend?.data ? {
    labels: Array(trend.data.length).fill(''),
    datasets: [{
      data: trend.data,
      borderColor: trend.isPositive ? '#10b981' : '#ef4444',
      backgroundColor: trend.isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2,
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    elements: {
      line: { tension: 0.4 },
      point: { radius: 0 },
    },
    interaction: { intersect: false },
  };

  if (loading) {
    return (
      <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <CardContent className={`${size === 'sm' ? 'p-4' : size === 'lg' ? 'p-8' : 'p-6'}`}>
          <div className="animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
              <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={onClick ? { scale: 1.02, y: -2 } : {}}
      className={cn(onClick ? 'cursor-pointer' : '', className)}
      onClick={onClick}
    >
      <Card className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group ${
        onClick ? 'hover:border-opacity-100' : ''
      }`}>
        <CardContent className={`${size === 'sm' ? 'p-4' : size === 'lg' ? 'p-8' : 'p-6'}`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className={`${size === 'sm' ? 'h-10 w-10' : size === 'lg' ? 'h-16 w-16' : 'h-12 w-12'} rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <Icon className={`${size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'} text-white`} />
            </div>
            
            {trend && (
              <Badge 
                variant="outline" 
                className={`${trend.isPositive 
                  ? 'text-emerald-700 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' 
                  : 'text-red-700 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                } text-xs font-medium`}
              >
                {trend.isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {Math.abs(trend.value).toFixed(1)}%
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h3 className={`font-medium text-slate-600 dark:text-slate-400 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-sm'}`}>
              {title}
            </h3>
            <p className={`font-bold text-slate-900 dark:text-white ${size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-3xl'}`}>
              {value}
            </p>
            {subtitle && (
              <p className={`text-slate-500 dark:text-slate-500 ${size === 'sm' ? 'text-xs' : 'text-xs'}`}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Mini trend chart */}
          {chartData && (
            <div className={`mt-4 ${size === 'sm' ? 'h-8' : size === 'lg' ? 'h-16' : 'h-12'}`}>
              <Line data={chartData} options={chartOptions} />
            </div>
          )}

          {/* Trend indicator without chart */}
          {trend && !trend.data && (
            <div className="mt-4 flex items-center gap-2">
              <div className={`flex items-center gap-1 text-xs ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span className="font-medium">
                  {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
                </span>
              </div>
              <span className="text-xs text-slate-500">vs last period</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}