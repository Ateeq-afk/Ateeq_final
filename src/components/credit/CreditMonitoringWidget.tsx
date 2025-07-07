import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, AlertTriangle, AlertCircle, CheckCircle, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { creditManagementService } from '@/services/creditManagement';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';

interface CreditRisk {
  id: string;
  customerId: string;
  customerName: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  utilizationPercentage: number;
  creditLimit: number;
  currentBalance: number;
  daysOverdue?: number;
  lastPaymentDate?: string;
  reason: string;
}

interface CreditMetrics {
  totalCustomers: number;
  atRiskCustomers: number;
  totalCreditExposure: number;
  avgUtilization: number;
  overdueAmount: number;
  criticalAlerts: number;
}

const CreditMonitoringWidget = () => {
  const [refreshInterval] = useState(30000); // 30 seconds
  const { selectedBranch } = useBranchSelection();
  const { showError, showWarning } = useNotificationSystem();

  // Fetch credit alerts with real-time refresh
  const { data: creditAlerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['credit-alerts-real-time', selectedBranch?.id],
    queryFn: () => creditManagementService.getCreditAlerts(),
    enabled: !!selectedBranch,
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: true,
  });

  // Fetch credit analytics
  const { data: creditAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['credit-analytics-monitoring', selectedBranch?.id],
    queryFn: () => creditManagementService.getCreditAnalytics(),
    enabled: !!selectedBranch,
    refetchInterval: refreshInterval * 2, // Refresh every minute
  });

  // Fetch credit summary for risk analysis
  const { data: creditSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['credit-summary-monitoring', selectedBranch?.id],
    queryFn: () => creditManagementService.getCustomerCreditSummary(),
    enabled: !!selectedBranch,
    refetchInterval: refreshInterval,
  });

  const alerts = creditAlerts?.data || [];
  const analytics = creditAnalytics?.data || {};
  const customers = creditSummary?.data || [];

  // Calculate risk metrics
  const calculateRiskMetrics = (): CreditMetrics => {
    const totalCustomers = customers.length;
    const atRiskCustomers = customers.filter(c => c.utilization_percentage > 80).length;
    const totalCreditExposure = customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0);
    const avgUtilization = customers.length > 0 
      ? customers.reduce((sum, c) => sum + c.utilization_percentage, 0) / customers.length 
      : 0;
    const overdueAmount = customers
      .filter(c => c.days_overdue > 0)
      .reduce((sum, c) => sum + (c.current_balance || 0), 0);
    const criticalAlerts = alerts.filter(a => a.alert_level === 'Critical').length;

    return {
      totalCustomers,
      atRiskCustomers,
      totalCreditExposure,
      avgUtilization,
      overdueAmount,
      criticalAlerts,
    };
  };

  // Identify high-risk customers
  const getHighRiskCustomers = (): CreditRisk[] => {
    return customers
      .map(customer => {
        let riskLevel: CreditRisk['riskLevel'] = 'Low';
        let reason = 'Normal credit utilization';

        if (customer.utilization_percentage >= 95) {
          riskLevel = 'Critical';
          reason = 'Credit limit nearly exhausted';
        } else if (customer.utilization_percentage >= 85) {
          riskLevel = 'High';
          reason = 'High credit utilization';
        } else if (customer.utilization_percentage >= 70) {
          riskLevel = 'Medium';
          reason = 'Moderate credit utilization';
        }

        if (customer.days_overdue > 30) {
          riskLevel = 'Critical';
          reason = `Payment overdue by ${customer.days_overdue} days`;
        } else if (customer.days_overdue > 15) {
          riskLevel = riskLevel === 'Critical' ? 'Critical' : 'High';
          reason = `Payment overdue by ${customer.days_overdue} days`;
        }

        return {
          id: customer.id,
          customerId: customer.id,
          customerName: customer.name,
          riskLevel,
          utilizationPercentage: customer.utilization_percentage,
          creditLimit: customer.credit_limit,
          currentBalance: customer.current_balance,
          daysOverdue: customer.days_overdue,
          lastPaymentDate: customer.last_payment_date,
          reason,
        };
      })
      .filter(risk => risk.riskLevel !== 'Low')
      .sort((a, b) => {
        const riskOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      })
      .slice(0, 5);
  };

  const metrics = calculateRiskMetrics();
  const highRiskCustomers = getHighRiskCustomers();

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'Critical': return <AlertTriangle className="h-4 w-4" />;
      case 'High': return <AlertCircle className="h-4 w-4" />;
      case 'Medium': return <Bell className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  // Show notifications for critical alerts
  useEffect(() => {
    const criticalAlerts = alerts.filter(alert => 
      alert.alert_level === 'Critical' && 
      !alert.is_read &&
      new Date(alert.created_at).getTime() > Date.now() - refreshInterval
    );

    criticalAlerts.forEach(alert => {
      showError(`Critical Credit Alert: ${alert.message}`);
    });

    const highRiskWarnings = alerts.filter(alert => 
      alert.alert_level === 'Warning' && 
      !alert.is_read &&
      new Date(alert.created_at).getTime() > Date.now() - refreshInterval
    );

    highRiskWarnings.forEach(alert => {
      showWarning(`Credit Warning: ${alert.message}`);
    });
  }, [alerts, showError, showWarning, refreshInterval]);

  if (alertsLoading || analyticsLoading || summaryLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Credit Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Credit Risk Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Real-Time Credit Monitoring
            <Badge variant="outline" className="ml-auto">
              Live
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{metrics.totalCustomers}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Users className="h-3 w-3" />
                Total Customers
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.atRiskCustomers}</div>
              <div className="text-sm text-gray-600">At Risk (&gt;80%)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{metrics.criticalAlerts}</div>
              <div className="text-sm text-gray-600">Critical Alerts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.totalCreditExposure)}</div>
              <div className="text-sm text-gray-600">Total Exposure</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{metrics.avgUtilization.toFixed(1)}%</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Avg Utilization
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics.overdueAmount)}</div>
              <div className="text-sm text-gray-600">Overdue Amount</div>
            </div>
          </div>

          <Separator />

          {/* High Risk Customers */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">High Risk Customers</h4>
            <div className="space-y-2">
              <AnimatePresence>
                {highRiskCustomers.map((customer) => (
                  <motion.div
                    key={customer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={`${getRiskColor(customer.riskLevel)} border`}>
                        {getRiskIcon(customer.riskLevel)}
                        {customer.riskLevel}
                      </Badge>
                      <div>
                        <p className="font-medium text-gray-900">{customer.customerName}</p>
                        <p className="text-sm text-gray-600">{customer.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={Math.min(customer.utilizationPercentage, 100)} 
                          className="w-20 h-2"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {customer.utilizationPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {formatCurrency(customer.currentBalance)} / {formatCurrency(customer.creditLimit)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {highRiskCustomers.length === 0 && (
                <div className="text-center py-4 text-gray-600">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p>No high-risk customers detected</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Recent Critical Alerts */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Recent Critical Alerts</h4>
            <div className="space-y-2">
              {alerts
                .filter(alert => alert.alert_level === 'Critical' && !alert.is_read)
                .slice(0, 3)
                .map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-800">{alert.message}</span>
                    </div>
                    <span className="text-xs text-red-600">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                  </motion.div>
                ))}
              
              {alerts.filter(alert => alert.alert_level === 'Critical' && !alert.is_read).length === 0 && (
                <div className="text-center py-2 text-gray-600">
                  <p className="text-sm">No critical alerts</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchAlerts()}
              className="flex-1"
            >
              Refresh Data
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              View All Alerts
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditMonitoringWidget;