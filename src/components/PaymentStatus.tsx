import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  AlertCircle, 
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Activity,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PaymentStats {
  totalOrders: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  totalAmount: number;
  totalFees: number;
  totalRefunds: number;
  refundedAmount: number;
  successRate: number;
}

interface PaymentStatusProps {
  className?: string;
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payment-gateway/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || 'Failed to fetch payment statistics');
      }
    } catch (err) {
      setError('Failed to fetch payment statistics');
      console.error('Error fetching payment stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {error || 'Unable to load payment statistics'}
            </p>
            <Button variant="outline" size="sm" onClick={fetchStats}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalAmount),
      description: 'from online payments',
      icon: DollarSign,
      trend: '+12.5%',
      trendUp: true,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Success Rate',
      value: formatPercentage(stats.successRate),
      description: `${stats.successfulPayments}/${stats.totalOrders} payments`,
      icon: TrendingUp,
      trend: '+2.1%',
      trendUp: true,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Failed Payments',
      value: stats.failedPayments.toString(),
      description: 'require attention',
      icon: AlertCircle,
      trend: '-1.2%',
      trendUp: false,
      color: 'text-red-600 dark:text-red-400'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingPayments.toString(),
      description: 'awaiting completion',
      icon: Clock,
      trend: '+0.8%',
      trendUp: true,
      color: 'text-orange-600 dark:text-orange-400'
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {card.value}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                  <span>{card.description}</span>
                  <Badge 
                    variant={card.trendUp ? 'default' : 'destructive'}
                    className="text-xs px-1 py-0"
                  >
                    {card.trendUp ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {card.trend}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Success Rate Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              Payment Performance
            </CardTitle>
            <CardDescription>
              Overall payment success rate and volume metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
                <span className="font-semibold">{formatPercentage(stats.successRate)}</span>
              </div>
              <Progress value={stats.successRate} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.successfulPayments}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Successful
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.failedPayments}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Failed
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Financial Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
              Financial Summary
            </CardTitle>
            <CardDescription>
              Revenue, fees, and refund details for the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(stats.totalAmount)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Total Revenue
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(stats.totalFees)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Gateway Fees
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-600 dark:text-red-400">
                  {stats.totalRefunds}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Refunds Issued
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(stats.refundedAmount)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Refund Amount
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentStatus;