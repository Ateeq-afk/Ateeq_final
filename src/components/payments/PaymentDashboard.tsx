import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { TrendingUp, TrendingDown, DollarSign, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { usePaymentAnalytics } from '../../hooks/usePayments';
import { useBranchSelection } from '../../contexts/BranchSelectionContext';

interface PaymentDashboardProps {
  onCreatePayment?: () => void;
  onViewPayments?: () => void;
  onViewOutstanding?: () => void;
}

const PaymentDashboard: React.FC<PaymentDashboardProps> = ({
  onCreatePayment,
  onViewPayments,
  onViewOutstanding,
}) => {
  const { selectedBranch } = useBranchSelection();
  
  const [dateRange, setDateRange] = useState({
    date_from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    date_to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const { data: analytics, isLoading } = usePaymentAnalytics({
    branch_id: selectedBranch?.id,
    ...dateRange,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">No payment analytics available</p>
        </CardContent>
      </Card>
    );
  }

  const { payments, outstanding, aging } = analytics;

  const summaryCards = [
    {
      title: 'Total Payments',
      value: `₹${payments.total.toLocaleString('en-IN')}`,
      count: `${payments.count} payments`,
      icon: DollarSign,
      trend: null,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Cleared Payments',
      value: `₹${payments.cleared.toLocaleString('en-IN')}`,
      percentage: payments.total > 0 ? ((payments.cleared / payments.total) * 100).toFixed(1) + '%' : '0%',
      icon: CheckCircle,
      trend: 'up',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending Payments',
      value: `₹${payments.pending.toLocaleString('en-IN')}`,
      percentage: payments.total > 0 ? ((payments.pending / payments.total) * 100).toFixed(1) + '%' : '0%',
      icon: Clock,
      trend: 'down',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Total Outstanding',
      value: `₹${outstanding.total.toLocaleString('en-IN')}`,
      count: `${outstanding.count} records`,
      icon: AlertTriangle,
      trend: null,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  const agingData = [
    { label: 'Current', amount: aging.current, color: 'bg-green-500' },
    { label: '1-30 Days', amount: aging['1-30_days'], color: 'bg-yellow-500' },
    { label: '31-60 Days', amount: aging['31-60_days'], color: 'bg-orange-500' },
    { label: '61-90 Days', amount: aging['61-90_days'], color: 'bg-red-500' },
    { label: '90+ Days', amount: aging['90+_days'], color: 'bg-red-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payment Dashboard</CardTitle>
          <div className="flex gap-2">
            <Button onClick={onCreatePayment}>
              Create Payment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateRange.date_from}
                onChange={(e) => setDateRange(prev => ({ ...prev, date_from: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateRange.date_to}
                onChange={(e) => setDateRange(prev => ({ ...prev, date_to: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={index < 3 ? onViewPayments : onViewOutstanding}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  {card.count && (
                    <p className="text-sm text-gray-500">{card.count}</p>
                  )}
                  {card.percentage && (
                    <Badge variant="outline" className="mt-1">
                      {card.percentage}
                    </Badge>
                  )}
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
              {card.trend && (
                <div className="flex items-center mt-2">
                  {card.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span className={`text-sm ${card.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    vs pending
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Outstanding Aging Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Aging Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agingData.map((bucket, index) => {
                const maxAmount = Math.max(...agingData.map(b => b.amount));
                const percentage = maxAmount > 0 ? (bucket.amount / maxAmount) * 100 : 0;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{bucket.label}</span>
                      <span className="text-sm font-bold">
                        ₹{bucket.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${bucket.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={onCreatePayment}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Record New Payment
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={onViewPayments}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                View All Payments
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={onViewOutstanding}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Manage Outstanding
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  // This would trigger reminder generation
                  console.log('Generate payment reminders');
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Send Payment Reminders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment vs Outstanding Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Collection Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                ₹{(payments.cleared).toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-gray-600">Total Collected</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                ₹{(payments.pending).toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-gray-600">Pending Clearance</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                ₹{(outstanding.overdue).toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-gray-600">Overdue Amount</div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Collection Efficiency</span>
              <Badge variant={
                (payments.cleared / (payments.total + outstanding.total)) > 0.8 ? 'default' :
                (payments.cleared / (payments.total + outstanding.total)) > 0.6 ? 'secondary' : 'destructive'
              }>
                {(((payments.cleared) / (payments.total + outstanding.total)) * 100).toFixed(1)}%
              </Badge>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Percentage of total receivables collected
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentDashboard;