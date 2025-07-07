import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  IndianRupee, 
  CreditCard, 
  Bell,
  Search,
  Filter,
  Download,
  Eye,
  Edit3
} from 'lucide-react';
import { creditManagementService } from '@/services/creditManagement';
import { CustomerCreditSummary, CreditAlert } from '@/types';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import CreditLimitManager from './CreditLimitManager';

interface CreditMetrics {
  total_credit_issued: number;
  total_credit_utilized: number;
  total_outstanding: number;
  utilization_rate: number;
  customers_by_category: Record<string, {
    count: number;
    credit_limit: number;
    credit_utilized: number;
    outstanding: number;
  }>;
  customers_by_status: Record<string, {
    count: number;
    credit_limit: number;
    credit_utilized: number;
    outstanding: number;
  }>;
}

const CreditDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerCreditSummary | null>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const { showSuccess, showError } = useNotificationSystem();
  const { selectedBranch } = useBranchSelection();

  // Fetch credit summary data
  const { data: creditSummary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['credit-summary', selectedBranch?.id],
    queryFn: () => creditManagementService.getCustomerCreditSummary(),
    enabled: !!selectedBranch,
  });

  // Fetch credit analytics
  const { data: creditAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['credit-analytics', selectedBranch?.id],
    queryFn: () => creditManagementService.getCreditAnalytics(),
    enabled: !!selectedBranch,
  });

  // Fetch credit alerts
  const { data: creditAlerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['credit-alerts', selectedBranch?.id],
    queryFn: () => creditManagementService.getCreditAlerts(undefined, true),
    enabled: !!selectedBranch,
  });

  const customers: CustomerCreditSummary[] = creditSummary?.data || [];
  const analytics: CreditMetrics = creditAnalytics?.data || {
    total_credit_issued: 0,
    total_credit_utilized: 0,
    total_outstanding: 0,
    utilization_rate: 0,
    customers_by_category: {},
    customers_by_status: {},
  };
  const alerts: CreditAlert[] = creditAlerts?.data || [];

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.mobile.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || customer.credit_status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || customer.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleMarkAlertRead = async (alertId: string) => {
    try {
      await creditManagementService.markAlertAsRead(alertId);
      showSuccess('Alert marked as read');
      refetchAlerts();
    } catch (error) {
      showError('Failed to mark alert as read');
    }
  };

  const handleManageCustomer = (customer: CustomerCreditSummary) => {
    setSelectedCustomer(customer);
    setIsManageDialogOpen(true);
  };

  const handleCloseManageDialog = () => {
    setIsManageDialogOpen(false);
    setSelectedCustomer(null);
  };

  const getCreditStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800';
      case 'Blocked': return 'bg-red-100 text-red-800';
      case 'Suspended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Premium': return 'bg-purple-100 text-purple-800';
      case 'Corporate': return 'bg-blue-100 text-blue-800';
      case 'Regular': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (summaryLoading || analyticsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Credit Management</h1>
          <p className="text-gray-600 mt-1">Monitor customer credit limits and utilization</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Credit Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Credit Issued</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.total_credit_issued)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Credit Utilized</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.total_credit_utilized)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.total_outstanding)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utilization Rate</p>
                <p className={`text-2xl font-bold ${getUtilizationColor(analytics.utilization_rate)}`}>
                  {analytics.utilization_rate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Credit Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    alert.alert_level === 'Critical' ? 'bg-red-100' :
                    alert.alert_level === 'Warning' ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    <AlertTriangle className={`h-4 w-4 ${
                      alert.alert_level === 'Critical' ? 'text-red-600' :
                      alert.alert_level === 'Warning' ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{alert.message}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAlertRead(alert.id)}
                >
                  Mark as Read
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Customer Credit Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Credit Summary</CardTitle>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
                <SelectItem value="Corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Customer</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Credit Limit</th>
                  <th className="text-left p-3">Current Balance</th>
                  <th className="text-left p-3">Utilization</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.mobile}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={getCategoryColor(customer.category)}>
                        {customer.category}
                      </Badge>
                    </td>
                    <td className="p-3 font-medium">
                      {formatCurrency(customer.credit_limit)}
                    </td>
                    <td className="p-3 font-medium">
                      {formatCurrency(customer.current_balance)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              customer.utilization_percentage >= 90 ? 'bg-red-500' :
                              customer.utilization_percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(customer.utilization_percentage, 100)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${getUtilizationColor(customer.utilization_percentage)}`}>
                          {customer.utilization_percentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={getCreditStatusColor(customer.credit_status)}>
                        {customer.credit_status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleManageCustomer(customer)}
                          title="Manage Credit"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No customers found matching your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Management Dialog */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Credit Management</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <CreditLimitManager
              customer={selectedCustomer}
              onClose={handleCloseManageDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreditDashboard;