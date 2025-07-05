import React from 'react';
import { IndianRupee, TrendingUp, ArrowUpRight, ArrowDownRight, CreditCard, Wallet, FileText, AlertCircle, Calendar, Target, DollarSign, Percent } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Booking } from '@/types';

interface Props {
  bookings: Booking[];
}

export default function RevenueStats({ bookings }: Props) {
  // Calculate comprehensive statistics
  const stats = React.useMemo(() => {
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const paidRevenue = bookings
      .filter(b => b.payment_type === 'Paid')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const toPayRevenue = bookings
      .filter(b => b.payment_type === 'To Pay')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const quotationRevenue = bookings
      .filter(b => b.payment_type === 'Quotation')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);

    // Calculate growth based on previous period
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
    
    const currentMonthRevenue = bookings
      .filter(b => new Date(b.created_at) >= lastMonth)
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);
    
    const previousMonthRevenue = bookings
      .filter(b => {
        const date = new Date(b.created_at);
        return date >= twoMonthsAgo && date < lastMonth;
      })
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);
    
    const growth = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0;
    
    // Calculate outstanding amounts with better categorization
    const receivableAmount = bookings
      .filter(b => b.payment_type === 'To Pay' && b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);
    
    const overdueAmount = bookings
      .filter(b => {
        if (b.payment_type !== 'To Pay' || b.status === 'cancelled') return false;
        const bookingDate = new Date(b.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - bookingDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 30;
      })
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);

    // Calculate average booking value and profit margins
    const avgBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;
    const totalBookings = bookings.length;
    const paidBookingsCount = bookings.filter(b => b.payment_type === 'Paid').length;
    const collectionRate = totalBookings > 0 ? (paidBookingsCount / totalBookings) * 100 : 0;
    
    // Estimate profit margin (assuming 25-35% average margin)
    const estimatedProfit = totalRevenue * 0.30;
    const profitMargin = 30;

    return {
      totalRevenue,
      paidRevenue,
      toPayRevenue,
      quotationRevenue,
      growth,
      receivableAmount,
      overdueAmount,
      avgBookingValue,
      totalBookings,
      paidBookingsCount,
      collectionRate,
      estimatedProfit,
      profitMargin,
      currentMonthRevenue,
      previousMonthRevenue
    };
  }, [bookings]);

  return (
    <div className="space-y-8">
      {/* Primary Revenue Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <EnhancedStatCard
          title="Total Revenue"
          value={`₹${(stats.totalRevenue / 1000).toFixed(1)}K`}
          trend={`${stats.growth >= 0 ? '+' : ''}${stats.growth.toFixed(1)}%`}
          trendUp={stats.growth >= 0}
          color="green"
          icon={IndianRupee}
          details={`From ${stats.totalBookings} bookings`}
          progress={100}
          subtitle="This Month vs Last Month"
        />
        <EnhancedStatCard
          title="Collection Rate"
          value={`${stats.collectionRate.toFixed(1)}%`}
          trend={`${stats.paidBookingsCount}/${stats.totalBookings}`}
          trendUp={stats.collectionRate > 80}
          color={stats.collectionRate > 80 ? "green" : stats.collectionRate > 60 ? "amber" : "red"}
          icon={CreditCard}
          details={`₹${(stats.paidRevenue / 1000).toFixed(1)}K collected`}
          progress={stats.collectionRate}
          subtitle="Payment Collection Efficiency"
        />
        <EnhancedStatCard
          title="Outstanding"
          value={`₹${(stats.receivableAmount / 1000).toFixed(1)}K`}
          trend={`${((stats.receivableAmount / (stats.totalRevenue || 1)) * 100).toFixed(1)}%`}
          trendUp={false}
          color="amber"
          icon={Wallet}
          details={`${bookings.filter(b => b.payment_type === 'To Pay' && b.status !== 'cancelled').length} pending payments`}
          progress={((stats.totalRevenue - stats.receivableAmount) / stats.totalRevenue) * 100}
          subtitle="Amount Pending Collection"
        />
        <EnhancedStatCard
          title="Profit Estimate"
          value={`₹${(stats.estimatedProfit / 1000).toFixed(1)}K`}
          trend={`${stats.profitMargin}% margin`}
          trendUp={stats.profitMargin > 25}
          color={stats.profitMargin > 25 ? "green" : "amber"}
          icon={Target}
          details="Based on 30% avg margin"
          progress={stats.profitMargin}
          subtitle="Estimated Net Profit"
        />
      </motion.div>

      {/* Secondary Metrics */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Avg Booking Value</h3>
                <p className="text-sm text-gray-500">Per shipment</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              ₹{stats.avgBookingValue.toFixed(0)}
            </Badge>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            ₹{(stats.avgBookingValue / 1000).toFixed(1)}K
          </div>
          <Progress value={Math.min((stats.avgBookingValue / 5000) * 100, 100)} className="h-2" />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-50 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Overdue Risk</h3>
                <p className="text-sm text-gray-500">30+ days pending</p>
              </div>
            </div>
            <Badge variant={stats.overdueAmount > 50000 ? "destructive" : "secondary"}>
              {((stats.overdueAmount / (stats.receivableAmount || 1)) * 100).toFixed(1)}%
            </Badge>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            ₹{(stats.overdueAmount / 1000).toFixed(1)}K
          </div>
          <Progress 
            value={Math.min(((stats.overdueAmount / stats.receivableAmount) * 100), 100)} 
            className="h-2" 
          />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                <Percent className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Growth Rate</h3>
                <p className="text-sm text-gray-500">Month over month</p>
              </div>
            </div>
            <Badge variant={stats.growth > 0 ? "default" : "destructive"}>
              {stats.growth >= 0 ? '+' : ''}{stats.growth.toFixed(1)}%
            </Badge>
          </div>
          <div className={`text-2xl font-bold mb-2 ${
            stats.growth > 0 ? 'text-green-600' : stats.growth < 0 ? 'text-red-600' : 'text-gray-900'
          }`}>
            {stats.growth >= 0 ? '+' : ''}{stats.growth.toFixed(1)}%
          </div>
          <Progress 
            value={Math.min(Math.max(stats.growth + 50, 0), 100)} 
            className="h-2" 
          />
        </div>
      </motion.div>
    </div>
  );
}

const colors = {
  green: 'bg-green-50 text-green-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600'
};

interface EnhancedStatCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  color: keyof typeof colors;
  trend: string;
  trendUp: boolean;
  details: string;
  progress: number;
  subtitle: string;
}

function EnhancedStatCard({ 
  icon: Icon, 
  title, 
  value, 
  color, 
  trend, 
  trendUp, 
  details, 
  progress, 
  subtitle 
}: EnhancedStatCardProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colors[color]} group-hover:scale-110 transition-transform duration-200`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
          trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          <span className="font-medium">{trend}</span>
        </div>
      </div>
      
      <div className="mb-3">
        <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-gray-700 font-medium">{title}</p>
        <p className="text-gray-500 text-xs">{subtitle}</p>
      </div>
      
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Progress</span>
          <span className="text-xs font-medium text-gray-600">{progress.toFixed(0)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <p className="text-gray-500 text-xs">{details}</p>
    </motion.div>
  );
}