import React from 'react';
import { motion } from 'framer-motion';
import { Truck, CheckCircle, Wrench, XCircle } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { cn } from '@/lib/utils';

interface VehicleStatusWidgetProps {
  total: number;
  active: number;
  maintenance: number;
  inactive: number;
  utilizationRate: number;
  className?: string;
}

export function VehicleStatusWidget({
  total,
  active,
  maintenance,
  inactive,
  utilizationRate,
  className
}: VehicleStatusWidgetProps) {
  const chartOption = React.useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '16',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { 
            value: active, 
            name: 'Active',
            itemStyle: { color: '#22c55e' }
          },
          { 
            value: maintenance, 
            name: 'Maintenance',
            itemStyle: { color: '#f59e0b' }
          },
          { 
            value: inactive, 
            name: 'Inactive',
            itemStyle: { color: '#ef4444' }
          }
        ]
      }
    ]
  }), [active, maintenance, inactive]);

  const statusData = [
    { label: 'Active', value: active, color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
    { label: 'Maintenance', value: maintenance, color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Wrench },
    { label: 'Inactive', value: inactive, color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("card-premium p-6", className)}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
          <Truck className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-heading font-semibold text-foreground">Fleet Status</h3>
          <p className="text-sm text-muted-foreground">Vehicle availability overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative">
          <div className="h-[200px]">
            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {statusData.map((status, index) => (
            <motion.div
              key={status.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", status.bgColor, `dark:${status.bgColor}/20`)}>
                  <status.icon className={cn("h-4 w-4", status.color)} />
                </div>
                <span className="text-sm font-medium text-foreground">{status.label}</span>
              </div>
              <span className={cn("text-lg font-semibold", status.color)}>{status.value}</span>
            </motion.div>
          ))}

          <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Utilization Rate</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{utilizationRate}%</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${utilizationRate}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}