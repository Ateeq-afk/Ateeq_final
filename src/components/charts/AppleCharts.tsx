import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  LineChart as LineChartIcon,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Target,
  ArrowUp,
  ArrowDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Download
} from 'lucide-react';

interface ChartProps {
  data?: any;
  height?: number;
  className?: string;
  loading?: boolean;
}

// Smooth animated line chart
export const AppleLineChart: React.FC<ChartProps> = ({ 
  data = [], 
  height = 200, 
  className,
  loading = false 
}) => {
  if (loading) {
    return (
      <div className={cn("relative rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4", className)} style={{ height }}>
        <div className="space-y-3">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  // Generate smooth curve points for demo
  const points = Array.from({ length: 12 }, (_, i) => ({
    x: (i / 11) * 100,
    y: 50 + Math.sin(i / 2) * 30 + Math.random() * 10
  }));

  const pathData = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x},${100 - point.y}`;
    
    const prev = points[index - 1];
    const cp1x = prev.x + (point.x - prev.x) / 3;
    const cp1y = 100 - prev.y;
    const cp2x = prev.x + (2 * (point.x - prev.x)) / 3;
    const cp2y = 100 - point.y;
    
    return `${path} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${point.x},${100 - point.y}`;
  }, '');

  return (
    <div className={cn("relative rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4", className)} style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#007AFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#007AFF" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="currentColor"
            strokeOpacity="0.1"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Area fill */}
        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          d={`${pathData} L 100,100 L 0,100 Z`}
          fill="url(#lineGradient)"
        />
        
        {/* Line */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          d={pathData}
          fill="none"
          stroke="#007AFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {points.map((point, i) => (
          <motion.circle
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.05 * i, duration: 0.2 }}
            cx={point.x}
            cy={100 - point.y}
            r="3"
            fill="#007AFF"
            className="hover:r-4 transition-all cursor-pointer"
          />
        ))}
      </svg>
    </div>
  );
};

// Modern bar chart
export const AppleBarChart: React.FC<ChartProps> = ({ 
  data = [], 
  height = 200, 
  className,
  loading = false 
}) => {
  if (loading) {
    return (
      <div className={cn("relative rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4", className)} style={{ height }}>
        <div className="flex items-end justify-around h-full gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" 
              style={{ height: `${Math.random() * 60 + 40}%` }} />
          ))}
        </div>
      </div>
    );
  }

  const bars = Array.from({ length: 6 }, (_, i) => ({
    value: Math.random() * 80 + 20,
    label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]
  }));

  return (
    <div className={cn("relative rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4", className)} style={{ height }}>
      <div className="flex items-end justify-around h-full gap-3">
        {bars.map((bar, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${bar.value}%` }}
            transition={{ delay: 0.1 * i, duration: 0.5, ease: "easeOut" }}
            className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg hover:from-blue-600 hover:to-blue-500 transition-colors cursor-pointer relative group"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + 0.1 * i }}
              className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-700 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {bar.value.toFixed(0)}%
            </motion.div>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-500 dark:text-gray-400">
              {bar.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Elegant donut chart
export const AppleDonutChart: React.FC<ChartProps> = ({ 
  data = [], 
  height = 200, 
  className,
  loading = false 
}) => {
  if (loading) {
    return (
      <div className={cn("relative rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4", className)} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="relative">
            <div className="h-32 w-32 rounded-full border-8 border-gray-200 dark:border-gray-700 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const segments = [
    { value: 35, color: '#007AFF', label: 'Active' },
    { value: 25, color: '#34C759', label: 'Completed' },
    { value: 20, color: '#FF9500', label: 'Pending' },
    { value: 20, color: '#AF52DE', label: 'Other' }
  ];

  let cumulativePercentage = 0;

  return (
    <div className={cn("relative rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4", className)} style={{ height }}>
      <div className="flex items-center justify-center h-full">
        <div className="relative">
          <svg width="160" height="160" viewBox="0 0 160 160">
            {segments.map((segment, i) => {
              const startAngle = (cumulativePercentage * 360) / 100;
              const endAngle = ((cumulativePercentage + segment.value) * 360) / 100;
              cumulativePercentage += segment.value;

              const startAngleRad = (startAngle * Math.PI) / 180;
              const endAngleRad = (endAngle * Math.PI) / 180;

              const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

              const x1 = 80 + 60 * Math.cos(startAngleRad);
              const y1 = 80 + 60 * Math.sin(startAngleRad);
              const x2 = 80 + 60 * Math.cos(endAngleRad);
              const y2 = 80 + 60 * Math.sin(endAngleRad);

              const pathData = [
                `M 80 80`,
                `L ${x1} ${y1}`,
                `A 60 60 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');

              return (
                <motion.path
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * i, duration: 0.5 }}
                  d={pathData}
                  fill={segment.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  transform="rotate(-90 80 80)"
                />
              );
            })}
            <circle cx="80" cy="80" r="40" fill="white" className="dark:fill-gray-900" />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">85%</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Success Rate</span>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex flex-wrap gap-4 justify-center">
          {segments.map((segment, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + 0.1 * i }}
              className="flex items-center gap-2"
            >
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="text-xs text-gray-600 dark:text-gray-400">{segment.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Sparkline chart for small spaces
export const AppleSparkline: React.FC<ChartProps & { color?: string }> = ({ 
  data = [], 
  height = 40, 
  className,
  color = '#007AFF'
}) => {
  const points = Array.from({ length: 20 }, (_, i) => ({
    x: (i / 19) * 100,
    y: 50 + Math.sin(i / 3) * 30 + Math.random() * 20
  }));

  const pathData = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x},${100 - point.y}`;
    return `${path} L ${point.x},${100 - point.y}`;
  }, '');

  return (
    <svg 
      viewBox="0 0 100 100" 
      preserveAspectRatio="none" 
      className={cn("w-full", className)}
      style={{ height }}
    >
      <defs>
        <linearGradient id={`sparkGradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
        d={`${pathData} L 100,100 L 0,100 Z`}
        fill={`url(#sparkGradient-${color})`}
      />
      
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Activity rings (Apple Watch style)
export const AppleActivityRings: React.FC<{
  rings: Array<{ value: number; max: number; color: string; label: string }>;
  size?: number;
  className?: string;
}> = ({ rings, size = 120, className }) => {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {rings.map((ring, i) => {
          const offset = circumference - (ring.value / ring.max) * circumference;
          const ringRadius = radius - i * (strokeWidth + 4);
          const ringCircumference = 2 * Math.PI * ringRadius;
          const ringOffset = ringCircumference - (ring.value / ring.max) * ringCircumference;

          return (
            <g key={i}>
              {/* Background ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={ringRadius}
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeWidth={strokeWidth}
              />
              {/* Progress ring */}
              <motion.circle
                initial={{ strokeDashoffset: ringCircumference }}
                animate={{ strokeDashoffset: ringOffset }}
                transition={{ duration: 1, delay: 0.2 * i, ease: "easeOut" }}
                cx={size / 2}
                cy={size / 2}
                r={ringRadius}
                fill="none"
                stroke={ring.color}
                strokeWidth={strokeWidth}
                strokeDasharray={ringCircumference}
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {rings[0]?.value || 0}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Complete</div>
        </div>
      </div>
    </div>
  );
};

// Trend indicator
export const AppleTrendIndicator: React.FC<{
  value: number;
  previousValue: number;
  format?: (value: number) => string;
  className?: string;
}> = ({ value, previousValue, format = (v) => v.toString(), className }) => {
  const change = ((value - previousValue) / previousValue) * 100;
  const isPositive = change >= 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        {format(value)}
      </span>
      <div className={cn(
        "flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full",
        isPositive 
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      )}>
        {isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {Math.abs(change).toFixed(1)}%
      </div>
    </div>
  );
};

// Apple-inspired color palette for data visualization
const APPLE_COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  gray: '#8E8E93',
  gradients: {
    blue: ['#007AFF', '#5856D6'],
    green: ['#34C759', '#30D158'],
    orange: ['#FF9500', '#FF6B35'],
    purple: ['#5856D6', '#AF52DE'],
    red: ['#FF3B30', '#FF6B6B']
  }
};

// Interactive Data Table Component
interface DataTableProps {
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    format?: (value: any) => string;
    sortable?: boolean;
    width?: string;
  }>;
  searchable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  className?: string;
  onRowClick?: (row: any) => void;
}

export const AppleDataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  searchable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  className,
  onRowClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data.filter(row =>
      searchTerm === '' || 
      Object.values(row).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    if (sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        const modifier = sortDirection === 'asc' ? 1 : -1;
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * modifier;
        }
        return aVal?.toString().localeCompare(bVal?.toString()) * modifier;
      });
    }

    return filtered;
  }, [data, searchTerm, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = processedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (key: string) => {
    if (!sortable) return;
    
    if (sortColumn === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(key);
      setSortDirection('asc');
    }
  };

  return (
    <div className={cn("bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden", className)}>
      {/* Header with search */}
      {searchable && (
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="relative">
            <Eye className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full pl-12 pr-4 py-3 rounded-2xl border-0",
                "bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100",
                "placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-gray-700/50",
                "transition-all duration-200"
              )}
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200/50 dark:border-gray-800/50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100",
                    "bg-gray-50/50 dark:bg-gray-800/30",
                    column.sortable && sortable && "cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-700/30",
                    column.width && `w-${column.width}`
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortable && sortColumn === column.key && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-blue-600 dark:text-blue-400"
                      >
                        {sortDirection === 'asc' ? 
                          <ArrowUp className="h-4 w-4" /> : 
                          <ArrowDown className="h-4 w-4" />
                        }
                      </motion.div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {paginatedData.map((row, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "border-b border-gray-200/30 dark:border-gray-800/30 last:border-0",
                    "hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors duration-200",
                    onRowClick && "cursor-pointer",
                    hoveredRow === index && "bg-gray-50/50 dark:bg-gray-800/30"
                  )}
                  onMouseEnter={() => setHoveredRow(index)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {column.format ? column.format(row[column.key]) : row[column.key]}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="p-6 border-t border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} results
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={cn(
                "p-2 rounded-xl transition-all duration-200",
                "hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200",
                      currentPage === pageNum
                        ? "bg-blue-500 text-white shadow-lg"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={cn(
                "p-2 rounded-xl transition-all duration-200",
                "hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Metric Card with Trend Analysis
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon?: React.ElementType;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  subtitle?: string;
  target?: number;
  sparklineData?: number[];
  className?: string;
  onClick?: () => void;
}

export const AppleMetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color = 'blue',
  subtitle,
  target,
  sparklineData,
  className,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const colorConfig = {
    blue: { bg: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-200/50 dark:border-blue-800/30', text: 'text-blue-600 dark:text-blue-400' },
    green: { bg: 'from-green-500/20 to-green-600/10', border: 'border-green-200/50 dark:border-green-800/30', text: 'text-green-600 dark:text-green-400' },
    orange: { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-200/50 dark:border-orange-800/30', text: 'text-orange-600 dark:text-orange-400' },
    purple: { bg: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-200/50 dark:border-purple-800/30', text: 'text-purple-600 dark:text-purple-400' },
    red: { bg: 'from-red-500/20 to-red-600/10', border: 'border-red-200/50 dark:border-red-800/30', text: 'text-red-600 dark:text-red-400' }
  };

  const config = colorConfig[color];

  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-3xl p-6",
        "bg-gradient-to-br", config.bg,
        "border", config.border,
        "backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300",
        onClick && "cursor-pointer hover:scale-[1.02]",
        className
      )}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Glass morphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </h3>
            <motion.div
              className="text-3xl font-bold text-gray-900 dark:text-gray-100 tabular-nums"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {value}
            </motion.div>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          
          {Icon && (
            <motion.div
              className={cn(
                "p-3 rounded-2xl", 
                "bg-white/60 dark:bg-black/20 backdrop-blur-sm",
                config.border, "border"
              )}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <Icon className={cn("h-6 w-6", config.text)} strokeWidth={1.5} />
            </motion.div>
          )}
        </div>

        {/* Trend and Change */}
        {(change !== undefined || trend) && (
          <motion.div
            className="flex items-center gap-2 mb-3"
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {change !== undefined && (
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold",
                change > 0 
                  ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" 
                  : change < 0
                  ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
              )}>
                {change > 0 ? <ArrowUp className="h-3 w-3" /> : 
                 change < 0 ? <ArrowDown className="h-3 w-3" /> : 
                 <Activity className="h-3 w-3" />}
                {Math.abs(change).toFixed(1)}%
              </div>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              vs last period
            </span>
          </motion.div>
        )}

        {/* Sparkline */}
        {sparklineData && (
          <motion.div
            className="mb-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <AppleSparkline 
              data={sparklineData} 
              height={40} 
              color={APPLE_COLORS[color as keyof typeof APPLE_COLORS] || APPLE_COLORS.primary} 
            />
          </motion.div>
        )}

        {/* Progress to target */}
        {target && (
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Progress to target</span>
              <span className={cn("font-semibold", config.text)}>
                {((Number(value) / target) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full bg-gradient-to-r", 
                  color === 'blue' ? 'from-blue-500 to-blue-600' :
                  color === 'green' ? 'from-green-500 to-green-600' :
                  color === 'orange' ? 'from-orange-500 to-orange-600' :
                  color === 'purple' ? 'from-purple-500 to-purple-600' :
                  'from-red-500 to-red-600'
                )}
                initial={{ width: 0 }}
                animate={isInView ? { width: `${Math.min((Number(value) / target) * 100, 100)}%` } : {}}
                transition={{ duration: 1, delay: 0.6 }}
              />
            </div>
          </motion.div>
        )}

        {/* Hover indicator */}
        <motion.div
          className="absolute bottom-4 right-4 opacity-0 transition-opacity duration-300"
          animate={{ opacity: isHovered ? 1 : 0 }}
        >
          <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <ChevronRight className="h-3 w-3 text-white" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};