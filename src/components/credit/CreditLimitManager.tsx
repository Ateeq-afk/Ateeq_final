import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Edit3, 
  History,
  Bell,
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';
import { creditManagementService } from '@/services/creditManagement';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { CustomerCreditSummary } from '@/types';

interface CreditLimitManagerProps {
  customer: CustomerCreditSummary;
  onClose?: () => void;
}

const CreditLimitManager: React.FC<CreditLimitManagerProps> = ({ customer, onClose }) => {
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newLimit, setNewLimit] = useState(customer.credit_limit.toString());
  const [reason, setReason] = useState('');
  const [newStatus, setNewStatus] = useState(customer.credit_status);
  const [statusReason, setStatusReason] = useState('');

  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationSystem();

  // Update credit limit mutation
  const updateCreditLimitMutation = useMutation({
    mutationFn: async (data: { newLimit: number; reason?: string }) => {
      return await creditManagementService.updateCreditLimit(customer.id, data.newLimit, data.reason);
    },
    onSuccess: () => {
      showSuccess('Credit limit updated successfully');
      setIsEditingLimit(false);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['credit-summary'] });
      queryClient.invalidateQueries({ queryKey: ['credit-analytics'] });
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to update credit limit');
    },
  });

  // Update credit status mutation
  const updateCreditStatusMutation = useMutation({
    mutationFn: async (data: { status: string; reason?: string }) => {
      return await creditManagementService.updateCreditStatus(customer.id, data.status as any, data.reason);
    },
    onSuccess: () => {
      showSuccess('Credit status updated successfully');
      setIsEditingStatus(false);
      setStatusReason('');
      queryClient.invalidateQueries({ queryKey: ['credit-summary'] });
      queryClient.invalidateQueries({ queryKey: ['credit-analytics'] });
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to update credit status');
    },
  });

  const handleUpdateLimit = () => {
    const limitValue = parseFloat(newLimit);
    if (isNaN(limitValue) || limitValue < 0) {
      showError('Please enter a valid credit limit');
      return;
    }
    updateCreditLimitMutation.mutate({ newLimit: limitValue, reason });
  };

  const handleUpdateStatus = () => {
    if (!newStatus) {
      showError('Please select a status');
      return;
    }
    updateCreditStatusMutation.mutate({ status: newStatus, reason: statusReason });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Blocked': return 'bg-red-100 text-red-800 border-red-200';
      case 'Suspended': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLevel = () => {
    if (customer.utilization_percentage >= 95) return { level: 'Critical', color: 'text-red-600' };
    if (customer.utilization_percentage >= 85) return { level: 'High', color: 'text-orange-600' };
    if (customer.utilization_percentage >= 70) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Low', color: 'text-green-600' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const risk = getRiskLevel();

  return (
    <div className="space-y-6">
      {/* Customer Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-blue-600" />
              <div>
                <span className="text-xl">{customer.name}</span>
                <p className="text-sm text-gray-600 mt-1">{customer.mobile}</p>
              </div>
            </div>
            <Badge className={getStatusColor(customer.credit_status)}>
              {customer.credit_status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Credit Utilization */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Credit Utilization</Label>
                <span className={`text-sm font-bold ${risk.color}`}>
                  {risk.level} Risk
                </span>
              </div>
              <div className="space-y-2">
                <Progress 
                  value={Math.min(customer.utilization_percentage, 100)} 
                  className="h-3"
                />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {formatCurrency(customer.current_balance)} used
                  </span>
                  <span className="font-medium">
                    {customer.utilization_percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Credit Limit Management */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Credit Limit</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingLimit(true)}
                  className="h-6 px-2"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(customer.credit_limit)}
              </div>
              <div className="text-sm text-gray-600">
                Available: {formatCurrency(customer.credit_limit - customer.current_balance)}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Financial Health</Label>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending Bookings</span>
                  <span className="text-sm font-medium">{customer.pending_bookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending Amount</span>
                  <span className="text-sm font-medium">{formatCurrency(customer.pending_amount)}</span>
                </div>
                {customer.days_overdue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-red-600">Days Overdue</span>
                    <span className="text-sm font-bold text-red-600">{customer.days_overdue}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Alerts */}
      {(customer.utilization_percentage >= 80 || customer.days_overdue > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-orange-800">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Risk Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {customer.utilization_percentage >= 95 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Bell className="h-4 w-4 text-red-500" />
                    <span>Credit limit nearly exhausted ({customer.utilization_percentage.toFixed(1)}%)</span>
                  </div>
                )}
                {customer.utilization_percentage >= 80 && customer.utilization_percentage < 95 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Bell className="h-4 w-4 text-orange-500" />
                    <span>High credit utilization ({customer.utilization_percentage.toFixed(1)}%)</span>
                  </div>
                )}
                {customer.days_overdue > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Bell className="h-4 w-4 text-red-500" />
                    <span>Payment overdue by {customer.days_overdue} days</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Credit Status Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Credit Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Current Status:</span>
              <Badge className={getStatusColor(customer.credit_status)}>
                {customer.credit_status}
              </Badge>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsEditingStatus(true)}
            >
              Update Status
            </Button>
          </CardContent>
        </Card>

        {/* Billing Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Billing Cycle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Cycle:</span>
              <span className="font-medium">{customer.billing_cycle}</span>
            </div>
            {customer.next_billing_date && (
              <div className="flex items-center justify-between">
                <span>Next Billing:</span>
                <span className="font-medium">
                  {new Date(customer.next_billing_date).toLocaleDateString()}
                </span>
              </div>
            )}
            {customer.last_payment_date && (
              <div className="flex items-center justify-between">
                <span>Last Payment:</span>
                <span className="font-medium">
                  {new Date(customer.last_payment_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Credit Limit Dialog */}
      <Dialog open={isEditingLimit} onOpenChange={setIsEditingLimit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Credit Limit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Limit</Label>
              <div className="text-lg font-semibold text-gray-600">
                {formatCurrency(customer.credit_limit)}
              </div>
            </div>
            <div>
              <Label htmlFor="newLimit">New Credit Limit</Label>
              <Input
                id="newLimit"
                type="number"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                placeholder="Enter new credit limit"
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason for Change</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for credit limit change"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleUpdateLimit}
                disabled={updateCreditLimitMutation.isPending}
                className="flex-1"
              >
                {updateCreditLimitMutation.isPending ? 'Updating...' : 'Update Limit'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditingLimit(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Credit Status Dialog */}
      <Dialog open={isEditingStatus} onOpenChange={setIsEditingStatus}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Credit Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Status</Label>
              <div className="text-lg">
                <Badge className={getStatusColor(customer.credit_status)}>
                  {customer.credit_status}
                </Badge>
              </div>
            </div>
            <div>
              <Label htmlFor="newStatus">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="statusReason">Reason for Status Change</Label>
              <Textarea
                id="statusReason"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Enter reason for status change"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleUpdateStatus}
                disabled={updateCreditStatusMutation.isPending}
                className="flex-1"
              >
                {updateCreditStatusMutation.isPending ? 'Updating...' : 'Update Status'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditingStatus(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreditLimitManager;