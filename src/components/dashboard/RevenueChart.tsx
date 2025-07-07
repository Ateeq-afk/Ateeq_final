import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Download, BarChart3, LineChart, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    bookings: number;
    deliveries: number;
  }>;
  period: string;
  onPeriodChange: (period: string) => void;
  onExport?: () => void;
}

export function RevenueChart({ data, period, onPeriodChange, onExport }: RevenueChartProps) {
  const [chartType, setChartType] = React.useState<'line' | 'bar'>('bar');
  
  const labels = data.map(item => {
    const date = new Date(item.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const chartOptions: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          font: {
            size: 12,
            weight: '500',
          },
          color: '#64748b',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 16,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label === 'Revenue') {
              return `${label}: ₹${(value / 1000).toFixed(1)}K`;
            }
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
            weight: '500',
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
            weight: '500',
          },
          callback: function(value: any) {
            return `₹${(value / 1000).toFixed(0)}K`;
          },
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
            weight: '500',
          },
        },
      },
    },
    elements: {
      bar: {
        borderRadius: 8,
      },
      line: {
        tension: 0.4,
      },
      point: {
        radius: 6,
        hoverRadius: 8,
        borderWidth: 3,
        hoverBorderWidth: 4,
      },
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart',
    },
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Revenue',
        data: data.map(item => item.revenue),
        backgroundColor: chartType === 'bar' 
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : 'rgba(102, 126, 234, 0.1)',
        borderColor: '#667eea',
        borderWidth: 3,
        fill: chartType === 'line',
        tension: 0.4,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        hoverBackgroundColor: '#5a67d8',
        hoverBorderColor: '#4c51bf',
      },
      {
        label: 'Bookings',
        data: data.map(item => item.bookings),
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3b82f6',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        yAxisID: 'y1',
        type: 'line' as const,
      },
      {
        label: 'Deliveries',
        data: data.map(item => item.deliveries),
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: '#22c55e',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        yAxisID: 'y1',
        type: 'line' as const,
      },
    ],
  };

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalBookings = data.reduce((sum, item) => sum + item.bookings, 0);
  const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  const growth = data.length > 1 ? ((data[data.length - 1].revenue - data[0].revenue) / data[0].revenue) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-purple-900/20 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl backdrop-blur-sm overflow-hidden"
    >
      {/* Header Section */}
      <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-transparent to-blue-50/30 dark:to-blue-900/10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                <Activity className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Revenue Analytics
              </h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium">Advanced performance insights</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 rounded-xl p-1 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
              <Button
                variant={chartType === 'bar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('bar')}
                className="rounded-lg h-9 px-3"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('line')}
                className="rounded-lg h-9 px-3"
              >
                <LineChart className="h-4 w-4" />
              </Button>
            </div>
            
            <Select value={period} onValueChange={onPeriodChange}>
              <SelectTrigger className="w-[160px] bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
                <Calendar className="h-4 w-4 mr-2 text-slate-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 hover:bg-white/80"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Card className="bg-white/40 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Revenue</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">₹{(totalRevenue / 1000).toFixed(1)}K</div>
            </CardContent>
          </Card>
          <Card className="bg-white/40 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Bookings</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalBookings}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/40 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Value</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">₹{(avgBookingValue / 1000).toFixed(1)}K</div>
            </CardContent>
          </Card>
          <Card className="bg-white/40 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Growth</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{growth.toFixed(1)}%</div>
                <Badge variant={growth >= 0 ? 'default' : 'destructive'} className="text-xs">
                  {growth >= 0 ? '↗' : '↘'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-6">
        <div className="h-[420px] relative">
          <motion.div
            key={chartType}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full"
          >
            {chartType === 'bar' ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}