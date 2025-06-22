import React from 'react';
import { IndianRupee, TrendingUp, ArrowUpRight, ArrowDownRight, CreditCard, Wallet, FileText, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Booking } from '@/types';

interface Props {
  bookings: Booking[];
}

export default function RevenueStats({ bookings }: Props) {
  // Calculate statistics
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

    // Calculate growth (mock data for now)
    const growth = 15.3;
    
    // Calculate outstanding amounts
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
        return diffDays > 30; // Assuming 30 days payment terms
      })
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);

    return {
      totalRevenue,
      paidRevenue,
      toPayRevenue,
      quotationRevenue,
      growth,
      receivableAmount,
      overdueAmount
    };
  }, [bookings]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      <StatCard
        title="Total Revenue"
        value={`₹${(stats.totalRevenue / 1000).toFixed(1)}K`}
        trend={`${stats.growth >= 0 ? '+' : ''}${stats.growth.toFixed(1)}%`}
        trendUp={stats.growth >= 0}
        color="green"
        icon={IndianRupee}
        details={`From ${bookings.length} bookings`}
      />
      <StatCard
        title="Paid Revenue"
        value={`₹${(stats.paidRevenue / 1000).toFixed(1)}K`}
        trend={`${((stats.paidRevenue / (stats.totalRevenue || 1)) * 100).toFixed(1)}%`}
        trendUp={true}
        color="blue"
        icon={CreditCard}
        details={`${bookings.filter(b => b.payment_type === 'Paid').length} paid bookings`}
      />
      <StatCard
        title="Receivable"
        value={`₹${(stats.receivableAmount / 1000).toFixed(1)}K`}
        trend={`${((stats.receivableAmount / (stats.totalRevenue || 1)) * 100).toFixed(1)}%`}
        trendUp={false}
        color="amber"
        icon={Wallet}
        details={`${bookings.filter(b => b.payment_type === 'To Pay' && b.status !== 'cancelled').length} pending payments`}
      />
      <StatCard
        title="Overdue"
        value={`₹${(stats.overdueAmount / 1000).toFixed(1)}K`}
        trend={`${((stats.overdueAmount / (stats.receivableAmount || 1)) * 100).toFixed(1)}%`}
        trendUp={false}
        color="red"
        icon={AlertCircle}
        details="Payments overdue by 30+ days"
      />
    </motion.div>
  );
}

const colors = {
  green: 'bg-green-50 text-green-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600'
};

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  color: keyof typeof colors;
  trend: string;
  trendUp: boolean;
  details: string;
}

function StatCard({ icon: Icon, title, value, color, trend, trendUp, details }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className={`flex items-center gap-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trendUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          <span className="text-sm font-medium">{trend}</span>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <p className="text-gray-600 text-sm">{title}</p>
      <p className="text-gray-500 text-xs mt-2">{details}</p>
    </div>
  );
}