import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import type { Booking } from '@/types';

interface Props {
  bookings: Booking[];
}

export default function RevenueTrends({ bookings }: Props) {
  const [chartType, setChartType] = useState<'revenue' | 'payment' | 'branch'>('revenue');
  
  // Generate daily revenue data
  const revenueData = React.useMemo(() => {
    const dailyRevenue = {};
    
    bookings.forEach(booking => {
      const date = new Date(booking.created_at).toLocaleDateString();
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = {
          date,
          total: 0,
          paid: 0,
          toPay: 0,
          quotation: 0
        };
      }

      const amount = booking.total_amount || 0;
      dailyRevenue[date].total += amount;

      switch (booking.payment_type) {
        case 'Paid':
          dailyRevenue[date].paid += amount;
          break;
        case 'To Pay':
          dailyRevenue[date].toPay += amount;
          break;
        case 'Quotation':
          dailyRevenue[date].quotation += amount;
          break;
      }
    });

    return Object.values(dailyRevenue).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [bookings]);

  // Generate payment type distribution data
  const paymentTypeData = React.useMemo(() => {
    const paymentTypes = {
      'Paid': 0,
      'To Pay': 0,
      'Quotation': 0
    };
    
    bookings.forEach(booking => {
      const type = booking.payment_type;
      paymentTypes[type] = (paymentTypes[type] || 0) + (booking.total_amount || 0);
    });

    return Object.entries(paymentTypes).map(([name, value]) => ({
      name,
      value: Number(value)
    }));
  }, [bookings]);

  // Generate branch revenue data
  const branchRevenueData = React.useMemo(() => {
    const branchRevenue = {};
    
    bookings.forEach(booking => {
      const branchName = booking.from_branch_details?.name || 'Unknown';
      if (!branchRevenue[branchName]) {
        branchRevenue[branchName] = 0;
      }
      branchRevenue[branchName] += booking.total_amount || 0;
    });

    return Object.entries(branchRevenue)
      .map(([name, value]) => ({
        name,
        value: Number(value)
      }))
      .sort((a, b) => b.value - a.value);
  }, [bookings]);

  const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#10b981'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Revenue Analysis</h3>
          <p className="text-sm text-gray-500 mt-1">Financial performance visualization</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={chartType} onValueChange={(value: 'revenue' | 'payment' | 'branch') => setChartType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select chart type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenue Trend</SelectItem>
              <SelectItem value="payment">Payment Distribution</SelectItem>
              <SelectItem value="branch">Branch Revenue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="h-[400px]">
        {chartType === 'revenue' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorToPay" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `₹${value/1000}K`}
              />
              <Tooltip 
                formatter={(value: number) => `₹${value.toFixed(2)}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '0.5rem'
                }}
              />
              <Legend />

              <Area
                type="monotone"
                dataKey="total"
                name="Total Revenue"
                stroke="#3b82f6"
                fill="url(#colorTotal)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="paid"
                name="Paid"
                stroke="#22c55e"
                fill="url(#colorPaid)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="toPay"
                name="To Pay"
                stroke="#f59e0b"
                fill="url(#colorToPay)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {chartType === 'payment' && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={paymentTypeData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {paymentTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `₹${value.toFixed(2)}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '0.5rem'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}

        {chartType === 'branch' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={branchRevenueData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tickFormatter={(value) => `₹${value/1000}K`} />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={150}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => `₹${value.toFixed(2)}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '0.5rem'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="#3b82f6" 
                name="Revenue"
                radius={[0, 4, 4, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}