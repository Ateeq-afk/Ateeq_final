import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, TrendingUp, TrendingDown, Package, Truck, DollarSign, Users, ArrowUpRight, ArrowDownRight, Activity, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { operationalDashboardService } from '@/services/operationalDashboard';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import CreditMonitoringWidget from '@/components/credit/CreditMonitoringWidget';

const OperationalDashboard: React.FC = () => {
  const { selectedBranch } = useBranchSelection();

  const { data: operationalData, isLoading, error } = useQuery({
    queryKey: ['operationalDashboard', selectedBranch?.id],
    queryFn: () => operationalDashboardService.getOperationalData(selectedBranch?.id),
    refetchInterval: 60000, // Refresh every minute for real-time monitoring
  });

  const { data: criticalAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['criticalAlerts', selectedBranch?.id],
    queryFn: () => operationalDashboardService.getCriticalAlerts(selectedBranch?.id),
    refetchInterval: 30000, // Refresh alerts every 30 seconds
  });

  const { data: fleetEfficiency } = useQuery({
    queryKey: ['fleetEfficiency', selectedBranch?.id],
    queryFn: () => operationalDashboardService.getFleetEfficiency(selectedBranch?.id),
    refetchInterval: 60000,
  });

  const { data: financialHealth } = useQuery({
    queryKey: ['financialHealth', selectedBranch?.id],
    queryFn: () => operationalDashboardService.getFinancialHealth(selectedBranch?.id),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Failed to Load Dashboard</h3>
                <p className="text-red-600">Unable to fetch operational data. Please try again.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default: return <Activity className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-amber-200 bg-amber-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
            Operations Command Center
          </h1>
          <p className="text-slate-600 mt-1">Real-time exception monitoring and operational insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Activity className="h-4 w-4 mr-1" />
            Live Monitoring
          </Badge>
        </div>
      </motion.div>

      {/* Critical Alerts */}
      {criticalAlerts && criticalAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-red-800">
                <AlertTriangle className="h-6 w-6 mr-2" />
                Critical Alerts Requiring Immediate Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {criticalAlerts.slice(0, 4).map((alert) => (
                  <motion.div
                    key={alert.id}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-lg border ${getAlertColor(alert.type)} cursor-pointer`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800">{alert.title}</h4>
                          <p className="text-sm text-slate-600 mt-1">{alert.description}</p>
                          {alert.value && (
                            <p className="text-sm font-medium text-slate-800 mt-2">{alert.value}</p>
                          )}
                        </div>
                      </div>
                      {alert.actionable && (
                        <ArrowUpRight className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Key Performance Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Delayed Shipments */}
        <Card className="border-red-100 bg-gradient-to-br from-white to-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Delayed Shipments</p>
                <p className="text-2xl font-bold text-red-800">
                  {operationalData?.exceptions.delayedShipments.count || 0}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {formatCurrency(operationalData?.exceptions.delayedShipments.totalValue || 0)} at risk
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fleet Utilization */}
        <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Fleet Utilization</p>
                <p className="text-2xl font-bold text-blue-800">
                  {fleetEfficiency?.utilizationRate.toFixed(1) || 0}%
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {fleetEfficiency?.activeVehicles || 0}/{fleetEfficiency?.totalVehicles || 0} active
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-3">
              <Progress 
                value={fleetEfficiency?.utilizationRate || 0} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Health */}
        <Card className="border-green-100 bg-gradient-to-br from-white to-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Financial Health</p>
                <p className={`text-2xl font-bold ${getHealthScoreColor(financialHealth?.healthScore || 0)}`}>
                  {financialHealth?.healthScore || 0}/100
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {financialHealth?.dailyPerformance.collectionRate.toFixed(1) || 0}% collection rate
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-3">
              <Progress 
                value={financialHealth?.healthScore || 0} 
                className="h-2"
              />
            </div>
            {/* Sentry Test Button */}
            <Button
              onClick={() => {
                throw new Error('Sentry Frontend Test - DesiCargo ' + new Date().toISOString());
              }}
              variant="destructive"
              size="sm"
              className="mt-4 w-full"
            >
              Test Frontend Error
            </Button>
          </CardContent>
        </Card>

        {/* Overdue Payments */}
        <Card className="border-amber-100 bg-gradient-to-br from-white to-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Overdue Payments</p>
                <p className="text-2xl font-bold text-amber-800">
                  {operationalData?.exceptions.overduePayments.count || 0}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {formatCurrency(operationalData?.exceptions.overduePayments.totalValue || 0)} pending
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Package className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Performance */}
        {financialHealth && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Financial Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">Today's Revenue</p>
                      <p className="text-lg font-bold">
                        {formatCurrency(financialHealth.dailyPerformance.todayRevenue)}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">Collection Rate</p>
                      <p className="text-lg font-bold">
                        {financialHealth.dailyPerformance.collectionRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Outstanding Receivables</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">0-30 days</span>
                        <span className="font-medium">{formatCurrency(financialHealth.outstandingReceivables.current)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">31-60 days</span>
                        <span className="font-medium">{formatCurrency(financialHealth.outstandingReceivables.aging30)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">61-90 days</span>
                        <span className="font-medium">{formatCurrency(financialHealth.outstandingReceivables.aging60)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-red-600">90+ days</span>
                        <span className="font-medium text-red-600">{formatCurrency(financialHealth.outstandingReceivables.aging90)}</span>
                      </div>
                    </div>
                  </div>

                  {financialHealth.recommendations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">Recommendations</p>
                      <div className="space-y-1">
                        {financialHealth.recommendations.map((rec, index) => (
                          <p key={index} className="text-xs text-slate-600 bg-blue-50 p-2 rounded">
                            {rec}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Fleet Efficiency */}
        {fleetEfficiency && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Fleet Operations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">Active Vehicles</p>
                      <p className="text-lg font-bold">{fleetEfficiency.activeVehicles}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">Available Capacity</p>
                      <p className="text-lg font-bold">{fleetEfficiency.availableCapacity}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Utilization Rate</p>
                    <div className="flex items-center space-x-3">
                      <Progress value={fleetEfficiency.utilizationRate} className="flex-1" />
                      <span className="text-sm font-medium">{fleetEfficiency.utilizationRate.toFixed(1)}%</span>
                    </div>
                  </div>

                  {fleetEfficiency.recommendation && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-1">Recommendation</p>
                      <p className="text-sm text-blue-700">{fleetEfficiency.recommendation}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Credit Monitoring Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <CreditMonitoringWidget />
      </motion.div>

      {/* Exception Details */}
      {operationalData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Exception Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Delayed Shipments */}
                {operationalData.exceptions.delayedShipments.details.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-800 mb-3">Delayed Shipments (72+ hours)</h4>
                    <div className="space-y-2">
                      {operationalData.exceptions.delayedShipments.details.slice(0, 3).map((shipment) => (
                        <div key={shipment.id} className="p-3 bg-red-50 rounded-lg border border-red-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{shipment.lr_number}</p>
                              <p className="text-xs text-slate-600">{shipment.from_city} → {shipment.to_city}</p>
                              <p className="text-xs text-slate-600">{shipment.sender_name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{formatCurrency(shipment.total_amount)}</p>
                              <p className="text-xs text-red-600">
                                {Math.floor((Date.now() - new Date(shipment.created_at).getTime()) / (24 * 60 * 60 * 1000))} days
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overdue Payments */}
                {operationalData.exceptions.overduePayments.details.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-800 mb-3">Overdue Payments (30+ days)</h4>
                    <div className="space-y-2">
                      {operationalData.exceptions.overduePayments.details.slice(0, 3).map((payment) => (
                        <div key={payment.id} className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{payment.lr_number}</p>
                              <p className="text-xs text-slate-600">{payment.sender_name}</p>
                              <p className="text-xs text-slate-600">{payment.payment_type}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{formatCurrency(payment.total_amount)}</p>
                              <p className="text-xs text-amber-600">
                                {Math.floor((Date.now() - new Date(payment.created_at).getTime()) / (24 * 60 * 60 * 1000))} days
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default OperationalDashboard;