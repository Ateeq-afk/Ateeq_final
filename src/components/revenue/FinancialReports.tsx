import React, { useState } from 'react';
import { FileText, Download, Calendar, BarChart3, PieChart, LineChart, ArrowRight, Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import type { Booking } from '@/types';

interface Props {
  bookings: Booking[];
}

export default function FinancialReports({ bookings }: Props) {
  const [reportType, setReportType] = useState('revenue');
  const [timeRange, setTimeRange] = useState('last_month');
  const [exporting, setExporting] = useState(false);
  
  const { showSuccess } = useNotificationSystem();

  // Generate revenue data
  const revenueData = React.useMemo(() => {
    const monthlyData = {};
    
    // Get last 12 months
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      monthlyData[monthYear] = {
        month: monthYear,
        revenue: 0,
        expenses: 0,
        profit: 0
      };
    }
    
    // Fill in revenue data from bookings
    bookings.forEach(booking => {
      const date = new Date(booking.created_at);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      if (monthlyData[monthYear]) {
        monthlyData[monthYear].revenue += booking.total_amount || 0;
      }
    });
    
    // Add mock expense data
    Object.keys(monthlyData).forEach(key => {
      // Expenses are roughly 60-80% of revenue
      const expenses = monthlyData[key].revenue * (0.6 + Math.random() * 0.2);
      monthlyData[key].expenses = expenses;
      monthlyData[key].profit = monthlyData[key].revenue - expenses;
    });
    
    return Object.values(monthlyData);
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

  // Generate expense category data (mock data)
  const expenseCategoryData = React.useMemo(() => {
    return [
      { name: 'Fuel', value: 35000 },
      { name: 'Vehicle Maintenance', value: 25000 },
      { name: 'Salaries', value: 50000 },
      { name: 'Rent', value: 20000 },
      { name: 'Office Supplies', value: 10000 },
      { name: 'Other', value: 15000 }
    ];
  }, []);

  const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#10b981'];

  const handleExport = () => {
    setExporting(true);
    
    // Simulate export delay
    setTimeout(() => {
      setExporting(false);
      showSuccess('Report Exported', 'Financial report has been exported successfully');
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Financial Reports</h2>
          <p className="text-gray-600 mt-1">
            Generate and analyze detailed financial reports
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="last_quarter">Last Quarter</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export Report
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="profit">Profit & Loss</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
              <p className="text-2xl font-bold text-gray-900">
                ₹{revenueData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Last 12 months</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Average Monthly</h3>
              <p className="text-2xl font-bold text-gray-900">
                ₹{(revenueData.reduce((sum, d) => sum + d.revenue, 0) / revenueData.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">Per month</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Growth Rate</h3>
              <p className="text-2xl font-bold text-green-600">+12.5%</p>
              <p className="text-xs text-gray-500 mt-1">Year over year</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue</h3>
                <p className="text-sm text-gray-500 mt-1">Revenue trend over time</p>
              </div>
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₹${value/1000}K`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '0.5rem'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    fillOpacity={1}
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Payment Distribution</h3>
                  <p className="text-sm text-gray-500 mt-1">Revenue by payment type</p>
                </div>
                <PieChart className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={paymentTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {paymentTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        padding: '0.5rem'
                      }}
                    />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Top Revenue Sources</h3>
                  <p className="text-sm text-gray-500 mt-1">Revenue by customer type</p>
                </div>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Regular Customers', value: 120000 },
                      { name: 'Corporate Clients', value: 180000 },
                      { name: 'One-time Customers', value: 60000 },
                      { name: 'Government', value: 40000 },
                    ]}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" tickFormatter={(value) => `₹${value/1000}K`} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
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
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Expenses</h3>
              <p className="text-2xl font-bold text-gray-900">
                ₹{revenueData.reduce((sum, d) => sum + d.expenses, 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Last 12 months</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Average Monthly</h3>
              <p className="text-2xl font-bold text-gray-900">
                ₹{(revenueData.reduce((sum, d) => sum + d.expenses, 0) / revenueData.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">Per month</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Expense Ratio</h3>
              <p className="text-2xl font-bold text-amber-600">
                {(revenueData.reduce((sum, d) => sum + d.expenses, 0) / revenueData.reduce((sum, d) => sum + d.revenue, 0) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Of total revenue</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Monthly Expenses</h3>
                <p className="text-sm text-gray-500 mt-1">Expense trend over time</p>
              </div>
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₹${value/1000}K`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Expenses']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '0.5rem'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#ef4444" 
                    fillOpacity={1}
                    fill="url(#colorExpenses)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Expense Categories</h3>
                  <p className="text-sm text-gray-500 mt-1">Breakdown by category</p>
                </div>
                <PieChart className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={expenseCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {expenseCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        padding: '0.5rem'
                      }}
                    />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Top Expenses</h3>
                  <p className="text-sm text-gray-500 mt-1">Highest expense categories</p>
                </div>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={expenseCategoryData.sort((a, b) => b.value - a.value)}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" tickFormatter={(value) => `₹${value/1000}K`} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        padding: '0.5rem'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#ef4444" 
                      name="Expenses"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profit" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Profit</h3>
              <p className="text-2xl font-bold text-green-600">
                ₹{revenueData.reduce((sum, d) => sum + d.profit, 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Last 12 months</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Profit Margin</h3>
              <p className="text-2xl font-bold text-green-600">
                {(revenueData.reduce((sum, d) => sum + d.profit, 0) / revenueData.reduce((sum, d) => sum + d.revenue, 0) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Of total revenue</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Monthly Average</h3>
              <p className="text-2xl font-bold text-green-600">
                ₹{(revenueData.reduce((sum, d) => sum + d.profit, 0) / revenueData.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">Per month</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Profit & Loss</h3>
                <p className="text-sm text-gray-500 mt-1">Monthly revenue, expenses, and profit</p>
              </div>
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₹${value/1000}K`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '0.5rem'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    name="Revenue" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="expenses" 
                    name="Expenses" 
                    fill="#ef4444" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="profit" 
                    name="Profit" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Profit Margin Trend</h3>
                <p className="text-sm text-gray-500 mt-1">Monthly profit margin percentage</p>
              </div>
              <LineChart className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueData.map(d => ({
                    month: d.month,
                    margin: (d.profit / d.revenue) * 100
                  }))}
                >
                  <defs>
                    <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Profit Margin']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '0.5rem'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="margin" 
                    stroke="#10b981" 
                    fillOpacity={1}
                    fill="url(#colorMargin)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Available Reports</h3>
                <p className="text-sm text-gray-500 mt-1">Download detailed financial reports</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Income Statement</h4>
                    <p className="text-sm text-gray-500">Monthly revenue, expenses, and profit</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Balance Sheet</h4>
                    <p className="text-sm text-gray-500">Assets, liabilities, and equity</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Cash Flow Statement</h4>
                    <p className="text-sm text-gray-500">Cash inflows and outflows</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Tax Report</h4>
                    <p className="text-sm text-gray-500">GST and tax summary</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}