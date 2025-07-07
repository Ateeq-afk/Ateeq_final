import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, TrendingDown, DollarSign, Receipt, CreditCard, 
  FileText, Calendar, Download, Filter, ChevronRight,
  AlertCircle, CheckCircle, Clock, BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { financialReportsService } from '@/services/financialReports';
import { expenseService } from '@/services/expenses';
import { billingService } from '@/services/billing';
import { paymentService } from '@/services/payments';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const FinancialDashboard: React.FC = () => {
  const { selectedBranch } = useBranchSelection();
  const [dateRange, setDateRange] = useState(() => financialReportsService.getCurrentMonthDates());
  const [comparisonPeriod, setComparisonPeriod] = useState<'previous_period' | 'previous_year' | 'none'>('previous_period');

  // Financial Summary
  const { data: financialSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['financial-summary', selectedBranch?.id],
    queryFn: () => financialReportsService.getFinancialSummary(selectedBranch?.id),
    refetchInterval: 300000, // 5 minutes
  });

  // P&L Statement
  const { data: pnlData, isLoading: pnlLoading } = useQuery({
    queryKey: ['pnl-statement', selectedBranch?.id, dateRange, comparisonPeriod],
    queryFn: () => financialReportsService.getPnLStatement({
      branch_id: selectedBranch?.id,
      start_date: dateRange.start_date,
      end_date: dateRange.end_date,
      comparison_period: comparisonPeriod,
      format: 'detailed'
    }),
  });

  // Expense Trends
  const { data: expenseTrends } = useQuery({
    queryKey: ['expense-trends', selectedBranch?.id],
    queryFn: () => expenseService.getTrends({
      branch_id: selectedBranch?.id,
      period: 'monthly',
      months: 6
    }),
  });

  // Outstanding Invoices
  const { data: outstandingInvoices } = useQuery({
    queryKey: ['outstanding-invoices', selectedBranch?.id],
    queryFn: () => billingService.getOutstandingInvoices({
      branch_id: selectedBranch?.id,
      page: 1,
      limit: 5
    }),
  });

  const formatCurrency = (amount: number) => financialReportsService.formatCurrency(amount);
  const formatPercentage = (value: number) => financialReportsService.formatPercentage(value);

  const MetricCard = ({ title, value, change, icon: Icon, color, subtitle }: any) => (
    <Card className={`border-${color}-100 bg-gradient-to-br from-white to-${color}-50`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={`text-sm font-medium text-${color}-600`}>{title}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-600 mt-1">{subtitle}</p>
            )}
            {change !== undefined && (
              <div className="flex items-center mt-2 text-sm">
                {change > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : change < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                ) : null}
                <span className={change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'}>
                  {change > 0 ? '+' : ''}{formatPercentage(change)}
                </span>
                <span className="text-slate-600 ml-1">vs last period</span>
              </div>
            )}
          </div>
          <div className={`p-3 bg-${color}-100 rounded-lg`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Expense breakdown chart data
  const expenseChartData = {
    labels: ['Direct', 'Indirect', 'Administrative'],
    datasets: [{
      data: pnlData?.expenses && typeof pnlData.expenses !== 'number' ? [
        (pnlData.expenses.direct_expenses as any).total || 0,
        (pnlData.expenses.indirect_expenses as any).total || 0,
        (pnlData.expenses.administrative_expenses as any).total || 0
      ] : [0, 0, 0],
      backgroundColor: ['#8b5cf6', '#3b82f6', '#f59e0b'],
      borderWidth: 0,
    }]
  };

  // Revenue trend chart data
  const revenueTrendData = {
    labels: expenseTrends?.map(t => t.period) || [],
    datasets: [
      {
        label: 'Revenue',
        data: expenseTrends?.map(t => t.total) || [], // Using expense total as proxy
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Expenses',
        data: expenseTrends?.map(t => t.total) || [],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  if (summaryLoading || pnlLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
            Financial Dashboard
          </h1>
          <p className="text-slate-600 mt-1">Comprehensive financial insights and P&L analysis</p>
        </div>
        <div className="flex items-center space-x-3">
          <DatePickerWithRange
            date={{
              from: dateRange.start_date ? new Date(dateRange.start_date) : undefined,
              to: dateRange.end_date ? new Date(dateRange.end_date) : undefined
            }}
            onDateChange={(range) => {
              if (range?.from && range?.to) {
                setDateRange({
                  start_date: range.from.toISOString().split('T')[0],
                  end_date: range.to.toISOString().split('T')[0]
                });
              }
            }}
          />
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(financialSummary?.current_month.revenue || 0)}
          change={financialSummary?.growth.revenue_growth}
          icon={DollarSign}
          color="green"
          subtitle={`Daily avg: ${formatCurrency(financialSummary?.current_month.revenue / 30 || 0)}`}
        />
        <MetricCard
          title="Total Expenses"
          value={formatCurrency(financialSummary?.current_month.expenses || 0)}
          change={financialSummary?.growth.expense_growth}
          icon={Receipt}
          color="red"
          subtitle={`${formatPercentage((financialSummary?.current_month.expenses / financialSummary?.current_month.revenue) * 100 || 0)} of revenue`}
        />
        <MetricCard
          title="Net Profit"
          value={formatCurrency(financialSummary?.current_month.profit || 0)}
          change={financialSummary?.growth.profit_growth}
          icon={TrendingUp}
          color="blue"
          subtitle={`Margin: ${formatPercentage(financialSummary?.current_month.margin || 0)}`}
        />
        <MetricCard
          title="Outstanding"
          value={formatCurrency(financialSummary?.outstanding.total_receivables || 0)}
          icon={Clock}
          color="amber"
          subtitle={`Overdue: ${formatCurrency(financialSummary?.outstanding.overdue_30_days || 0)}`}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="pnl" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pnl">P&L Statement</TabsTrigger>
          <TabsTrigger value="expenses">Expense Analysis</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Insights</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
        </TabsList>

        {/* P&L Statement Tab */}
        <TabsContent value="pnl" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Profit & Loss Statement</CardTitle>
                <Select value={comparisonPeriod} onValueChange={(value: any) => setComparisonPeriod(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Comparison</SelectItem>
                    <SelectItem value="previous_period">Previous Period</SelectItem>
                    <SelectItem value="previous_year">Previous Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {pnlData && (
                <div className="space-y-6">
                  {/* Revenue Section */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">Revenue</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Freight Revenue</span>
                        <span className="font-medium">{formatCurrency(pnlData.revenue.freight_revenue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Other Revenue</span>
                        <span className="font-medium">{formatCurrency(pnlData.revenue.other_revenue)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-semibold">Total Revenue</span>
                        <span className="font-bold text-green-600">{formatCurrency(pnlData.revenue.total_revenue)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">Expenses</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Direct Expenses</span>
                        <span className="font-medium">
                          {formatCurrency(typeof pnlData.expenses.direct_expenses === 'number' 
                            ? pnlData.expenses.direct_expenses 
                            : pnlData.expenses.direct_expenses.total)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Indirect Expenses</span>
                        <span className="font-medium">
                          {formatCurrency(typeof pnlData.expenses.indirect_expenses === 'number' 
                            ? pnlData.expenses.indirect_expenses 
                            : pnlData.expenses.indirect_expenses.total)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Administrative Expenses</span>
                        <span className="font-medium">
                          {formatCurrency(typeof pnlData.expenses.administrative_expenses === 'number' 
                            ? pnlData.expenses.administrative_expenses 
                            : pnlData.expenses.administrative_expenses.total)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-semibold">Total Expenses</span>
                        <span className="font-bold text-red-600">{formatCurrency(pnlData.expenses.total_expenses)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Profitability Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">Profitability</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Gross Profit</span>
                        <div className="text-right">
                          <span className="font-medium">{formatCurrency(pnlData.profitability.gross_profit)}</span>
                          <span className="text-sm text-slate-500 ml-2">({formatPercentage(pnlData.profitability.gross_margin)})</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Operating Profit</span>
                        <div className="text-right">
                          <span className="font-medium">{formatCurrency(pnlData.profitability.operating_profit)}</span>
                          <span className="text-sm text-slate-500 ml-2">({formatPercentage(pnlData.profitability.operating_margin)})</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-semibold">Net Profit</span>
                        <div className="text-right">
                          <span className={`font-bold ${pnlData.profitability.net_profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(pnlData.profitability.net_profit)}
                          </span>
                          <span className="text-sm text-slate-500 ml-2">({formatPercentage(pnlData.profitability.net_margin)})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expense Analysis Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Chart type="doughnut" data={expenseChartData} options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      }
                    }
                  }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Chart type="line" data={revenueTrendData} options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      }
                    }
                  }} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Insights Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {outstandingInvoices?.data?.map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <p className="text-sm text-slate-600">{invoice.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(invoice.total_amount)}</p>
                      <p className="text-xs text-slate-600">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Tab */}
        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-slate-600">Cash flow analysis coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialDashboard;