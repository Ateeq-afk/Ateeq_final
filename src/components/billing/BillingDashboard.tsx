import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  DollarSign, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Users,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useBillingStats } from '../../hooks/useBilling';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Link } from 'react-router-dom';

export const BillingDashboard: React.FC = () => {
  const { stats } = useBillingStats();

  const quickActions = [
    {
      title: 'Create Invoice',
      description: 'Generate a new invoice for a customer',
      href: '/billing/invoices/new',
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      title: 'Billing Cycles',
      description: 'Manage recurring billing periods',
      href: '/billing/cycles',
      icon: Calendar,
      color: 'bg-green-500'
    },
    {
      title: 'Supplementary Billing',
      description: 'Add extra charges or adjustments',
      href: '/billing/supplementary',
      icon: TrendingUp,
      color: 'bg-orange-500'
    },
    {
      title: 'Credit/Debit Notes',
      description: 'Create invoice adjustments',
      href: '/billing/notes',
      icon: TrendingDown,
      color: 'bg-purple-500'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Billing Dashboard</h1>
          <p className="text-gray-600">Monitor invoices, payments, and billing performance</p>
        </div>
        <div className="text-sm text-gray-500">
          {format(new Date(), 'EEEE, MMMM do, yyyy')}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl font-bold">{stats.totalInvoices}</p>
                  <Badge variant="secondary" className="text-xs">This month</Badge>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalInvoiceAmount)}</p>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.paidAmount)}</p>
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">Collected</Badge>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.outstandingAmount)}</p>
                  <Badge variant="destructive" className="text-xs">Pending</Badge>
                </div>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Invoices</p>
                <p className="text-3xl font-bold text-red-600">{stats.overdueInvoices}</p>
                <p className="text-xs text-gray-500 mt-1">Require immediate attention</p>
              </div>
              <Clock className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Billing Cycles</p>
                <p className="text-3xl font-bold text-blue-600">{stats.activeCycles}</p>
                <p className="text-xs text-gray-500 mt-1">Currently running cycles</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Supplementary</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pendingSupplementary}</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{action.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentPayments?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentPayments.map((payment: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{payment.customers?.name}</p>
                    <p className="text-sm text-gray-500">
                      {payment.payment_method} • {format(new Date(payment.payment_date), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                    <Badge variant={payment.status === 'cleared' ? 'default' : 'secondary'}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent payments found</p>
              <Button variant="outline" size="sm" className="mt-2">
                <Link to="/billing/payments">View All Payments</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collection Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Collection Rate</span>
              <span className="text-sm text-gray-500">
                {stats.totalInvoiceAmount > 0 
                  ? Math.round((stats.paidAmount / stats.totalInvoiceAmount) * 100)
                  : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{
                  width: `${stats.totalInvoiceAmount > 0 
                    ? Math.round((stats.paidAmount / stats.totalInvoiceAmount) * 100)
                    : 0}%`
                }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Collected</p>
                <p className="font-bold text-green-600">{formatCurrency(stats.paidAmount)}</p>
              </div>
              <div>
                <p className="text-gray-500">Outstanding</p>
                <p className="font-bold text-red-600">{formatCurrency(stats.outstandingAmount)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};