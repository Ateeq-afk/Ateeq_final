import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Play, 
  Settings, 
  FileText, 
  Users, 
  IndianRupee,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { creditManagementService } from '@/services/creditManagement';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';

interface BillingSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time?: string;
}

interface BillingRun {
  id: string;
  run_date: string;
  customers_processed: number;
  invoices_generated: number;
  total_amount: number;
  status: 'completed' | 'failed' | 'in_progress';
  errors?: string[];
}

const AutomatedBilling = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [schedule, setSchedule] = useState<BillingSchedule>({
    enabled: false,
    frequency: 'monthly',
    dayOfMonth: 1,
    time: '09:00'
  });

  const { showSuccess, showError } = useNotificationSystem();
  const { selectedBranch } = useBranchSelection();
  const queryClient = useQueryClient();

  // Fetch current billing schedule
  const { data: billingSchedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['billing-schedule', selectedBranch?.id],
    queryFn: () => creditManagementService.getAutomatedBillingSchedule(),
    enabled: !!selectedBranch,
  });

  // Fetch billing cycles
  const { data: billingCycles, isLoading: cyclesLoading } = useQuery({
    queryKey: ['billing-cycles', selectedBranch?.id],
    queryFn: () => creditManagementService.getBillingCycles(),
    enabled: !!selectedBranch,
  });

  // Run billing mutation
  const runBillingMutation = useMutation({
    mutationFn: () => creditManagementService.runAutomatedBilling(),
    onSuccess: () => {
      showSuccess('Automated billing run started successfully');
      queryClient.invalidateQueries({ queryKey: ['billing-cycles'] });
    },
    onError: () => {
      showError('Failed to start automated billing run');
    },
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: (newSchedule: BillingSchedule) => 
      creditManagementService.updateAutomatedBillingSchedule(newSchedule),
    onSuccess: () => {
      showSuccess('Billing schedule updated successfully');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['billing-schedule'] });
    },
    onError: () => {
      showError('Failed to update billing schedule');
    },
  });

  // Update local schedule when data is fetched
  useEffect(() => {
    if (billingSchedule?.data) {
      setSchedule(billingSchedule.data);
    }
  }, [billingSchedule]);

  const handleSaveSchedule = () => {
    updateScheduleMutation.mutate(schedule);
  };

  const handleRunBilling = () => {
    runBillingMutation.mutate();
  };

  const getFrequencyText = (freq: string) => {
    switch (freq) {
      case 'daily': return 'Every day';
      case 'weekly': return 'Every week';
      case 'monthly': return 'Every month';
      default: return freq;
    }
  };

  const getDayName = (dayNumber: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const cycles = billingCycles?.data || [];
  const openCycles = cycles.filter(cycle => cycle.status === 'Open');
  const invoicedCycles = cycles.filter(cycle => cycle.status === 'Invoiced');

  if (scheduleLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automated Billing</h1>
          <p className="text-gray-600 mt-1">Configure and monitor automated billing cycles</p>
        </div>
        <Button onClick={handleRunBilling} disabled={runBillingMutation.isPending}>
          {runBillingMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Billing Now
            </>
          )}
        </Button>
      </div>

      {/* Billing Schedule Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Billing Schedule
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              disabled={updateScheduleMutation.isPending}
            >
              {isEditing ? 'Cancel' : 'Edit Schedule'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Schedule Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${schedule.enabled ? 'bg-green-100' : 'bg-red-100'}`}>
                {schedule.enabled ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  Automated Billing is {schedule.enabled ? 'Enabled' : 'Disabled'}
                </p>
                {schedule.enabled && (
                  <p className="text-sm text-gray-600">
                    Next run: {getFrequencyText(schedule.frequency)}
                    {schedule.frequency === 'weekly' && schedule.dayOfWeek !== undefined && 
                      ` on ${getDayName(schedule.dayOfWeek)}`}
                    {schedule.frequency === 'monthly' && schedule.dayOfMonth && 
                      ` on day ${schedule.dayOfMonth}`}
                    {schedule.time && ` at ${schedule.time}`}
                  </p>
                )}
              </div>
            </div>
            
            {isEditing && (
              <div className="flex items-center space-x-2">
                <Switch
                  checked={schedule.enabled}
                  onCheckedChange={(checked) => setSchedule(prev => ({ ...prev, enabled: checked }))}
                />
                <Label>Enable</Label>
              </div>
            )}
          </div>

          {/* Schedule Configuration */}
          {isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Frequency</Label>
                <Select
                  value={schedule.frequency}
                  onValueChange={(value) => setSchedule(prev => ({ 
                    ...prev, 
                    frequency: value as BillingSchedule['frequency'] 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {schedule.frequency === 'weekly' && (
                <div>
                  <Label>Day of Week</Label>
                  <Select
                    value={schedule.dayOfWeek?.toString()}
                    onValueChange={(value) => setSchedule(prev => ({ 
                      ...prev, 
                      dayOfWeek: parseInt(value) 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 7 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {getDayName(i)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {schedule.frequency === 'monthly' && (
                <div>
                  <Label>Day of Month</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={schedule.dayOfMonth || 1}
                    onChange={(e) => setSchedule(prev => ({ 
                      ...prev, 
                      dayOfMonth: parseInt(e.target.value) 
                    }))}
                  />
                </div>
              )}

              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={schedule.time || '09:00'}
                  onChange={(e) => setSchedule(prev => ({ 
                    ...prev, 
                    time: e.target.value 
                  }))}
                />
              </div>
            </div>
          )}

          {isEditing && (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveSchedule}
                disabled={updateScheduleMutation.isPending}
              >
                {updateScheduleMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Cycles</p>
                <p className="text-2xl font-bold text-gray-900">{openCycles.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Invoiced Cycles</p>
                <p className="text-2xl font-bold text-gray-900">{invoicedCycles.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(cycles.reduce((sum, cycle) => sum + cycle.total_amount, 0))}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <IndianRupee className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Billing Cycles */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Billing Cycles</CardTitle>
        </CardHeader>
        <CardContent>
          {cyclesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : cycles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Cycle Period</th>
                    <th className="text-left p-3">Total Bookings</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cycles.slice(0, 10).map((cycle) => (
                    <tr key={cycle.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">
                            {new Date(cycle.cycle_start_date).toLocaleDateString()} - 
                            {new Date(cycle.cycle_end_date).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">{cycle.total_bookings}</td>
                      <td className="p-3 font-medium">
                        {formatCurrency(cycle.total_amount)}
                      </td>
                      <td className="p-3">
                        <Badge className={
                          cycle.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                          cycle.status === 'Invoiced' ? 'bg-green-100 text-green-800' :
                          cycle.status === 'Paid' ? 'bg-purple-100 text-purple-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {cycle.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {cycle.status === 'Open' && (
                          <Button variant="outline" size="sm">
                            Generate Invoice
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No billing cycles found</p>
              <p className="text-sm text-gray-400">
                Billing cycles will appear here once automated billing is configured
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomatedBilling;