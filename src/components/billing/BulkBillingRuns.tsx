import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Play, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Progress } from '../ui/progress';
import { billingService } from '../../services/billing';
import { useBulkBillingRuns, useCreateBulkBillingRun, useExecuteBulkBillingRun, useBillingCycles } from '../../hooks/useBilling';
import { BulkBillingRun, BillingCycle } from '../../types';
import { format } from 'date-fns';

const bulkBillingRunSchema = z.object({
  billing_cycle_id: z.string().optional(),
  run_name: z.string().min(1, 'Run name is required'),
  billing_period_start: z.string().min(1, 'Start date is required'),
  billing_period_end: z.string().min(1, 'End date is required'),
  include_supplementary: z.boolean().default(false),
  auto_send_invoices: z.boolean().default(false),
  customer_filter: z.object({
    customer_ids: z.array(z.string()).optional(),
    customer_groups: z.array(z.string()).optional(),
    min_outstanding: z.number().optional(),
    exclude_zero_balance: z.boolean().default(true)
  }).optional()
}).refine((data) => new Date(data.billing_period_end) > new Date(data.billing_period_start), {
  message: "End date must be after start date",
  path: ["billing_period_end"]
});

type BulkBillingRunFormData = z.infer<typeof bulkBillingRunSchema>;

interface BulkBillingRunFormProps {
  onClose: () => void;
}

const BulkBillingRunFormComponent: React.FC<BulkBillingRunFormProps> = ({ onClose }) => {
  const createMutation = useCreateBulkBillingRun();
  const { data: billingCycles } = useBillingCycles();

  const form = useForm<BulkBillingRunFormData>({
    resolver: zodResolver(bulkBillingRunSchema),
    defaultValues: {
      billing_cycle_id: '',
      run_name: '',
      billing_period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      billing_period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
      include_supplementary: false,
      auto_send_invoices: false,
      customer_filter: {
        customer_ids: [],
        customer_groups: [],
        min_outstanding: 0,
        exclude_zero_balance: true
      }
    }
  });

  const onSubmit = async (data: BulkBillingRunFormData) => {
    try {
      await createMutation.mutateAsync(data);
      onClose();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="run_name">Run Name *</Label>
          <Input
            {...form.register('run_name')}
            placeholder="e.g., Monthly Billing - December 2024"
          />
          {form.formState.errors.run_name && (
            <p className="text-sm text-red-600">{form.formState.errors.run_name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="billing_cycle_id">Billing Cycle (Optional)</Label>
          <Select
            value={form.watch('billing_cycle_id')}
            onValueChange={(value) => form.setValue('billing_cycle_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select billing cycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No specific cycle</SelectItem>
              {billingCycles?.map((cycle: BillingCycle) => (
                <SelectItem key={cycle.id} value={cycle.id}>
                  {cycle.name} ({cycle.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div />

        <div>
          <Label htmlFor="billing_period_start">Billing Period Start *</Label>
          <Input
            type="date"
            {...form.register('billing_period_start')}
          />
          {form.formState.errors.billing_period_start && (
            <p className="text-sm text-red-600">{form.formState.errors.billing_period_start.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="billing_period_end">Billing Period End *</Label>
          <Input
            type="date"
            {...form.register('billing_period_end')}
          />
          {form.formState.errors.billing_period_end && (
            <p className="text-sm text-red-600">{form.formState.errors.billing_period_end.message}</p>
          )}
        </div>
      </div>

      {/* Options */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="include_supplementary"
              {...form.register('include_supplementary')}
              className="rounded"
            />
            <Label htmlFor="include_supplementary">Include supplementary billing charges</Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto_send_invoices"
              {...form.register('auto_send_invoices')}
              className="rounded"
            />
            <Label htmlFor="auto_send_invoices">Automatically send invoices to customers</Label>
          </div>
        </CardContent>
      </Card>

      {/* Customer Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="min_outstanding">Minimum Outstanding Amount</Label>
            <Input
              type="number"
              step="0.01"
              {...form.register('customer_filter.min_outstanding', { valueAsNumber: true })}
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="exclude_zero_balance"
              {...form.register('customer_filter.exclude_zero_balance')}
              className="rounded"
            />
            <Label htmlFor="exclude_zero_balance">Exclude customers with zero balance</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create Bulk Run'}
        </Button>
      </div>
    </form>
  );
};

export const BulkBillingRuns: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: bulkRuns, isLoading } = useBulkBillingRuns();
  const executeMutation = useExecuteBulkBillingRun();

  const getStatusBadge = (status: BulkBillingRun['status']) => {
    const variants: Record<BulkBillingRun['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      processing: 'secondary',
      completed: 'default',
      failed: 'destructive',
      cancelled: 'outline'
    };

    const icons: Record<BulkBillingRun['status'], React.ReactNode> = {
      pending: <Clock className="w-3 h-3 mr-1" />,
      processing: <AlertCircle className="w-3 h-3 mr-1" />,
      completed: <CheckCircle className="w-3 h-3 mr-1" />,
      failed: <XCircle className="w-3 h-3 mr-1" />,
      cancelled: <XCircle className="w-3 h-3 mr-1" />
    };

    return (
      <Badge variant={variants[status]} className="flex items-center">
        {icons[status]}
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getProgressPercentage = (run: BulkBillingRun) => {
    if (run.total_customers === 0) return 0;
    return Math.round((run.processed_customers / run.total_customers) * 100);
  };

  const handleExecuteRun = async (id: string) => {
    try {
      await executeMutation.mutateAsync(id);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const filteredRuns = bulkRuns?.filter((run: BulkBillingRun) => 
    !statusFilter || run.status === statusFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Bulk Billing Runs</h1>
          <p className="text-gray-600">Automate invoice generation for multiple customers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Bulk Run
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create Bulk Billing Run</DialogTitle>
            </DialogHeader>
            <BulkBillingRunFormComponent onClose={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Runs</p>
                <p className="text-2xl font-bold">{bulkRuns?.length || 0}</p>
              </div>
              <Play className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {bulkRuns?.filter((run: BulkBillingRun) => run.status === 'pending').length || 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-blue-600">
                  {bulkRuns?.filter((run: BulkBillingRun) => run.status === 'processing').length || 0}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {bulkRuns?.filter((run: BulkBillingRun) => run.status === 'completed').length || 0}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₹{bulkRuns?.reduce((sum: number, run: BulkBillingRun) => sum + run.total_invoice_amount, 0).toFixed(2) || '0.00'}
                </p>
              </div>
              <Play className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Billing Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading bulk runs...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run Name</TableHead>
                  <TableHead>Billing Period</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Customers</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRuns?.map((run: BulkBillingRun) => {
                  const progress = getProgressPercentage(run);
                  const successRate = run.total_customers > 0 
                    ? Math.round((run.successful_invoices / run.total_customers) * 100)
                    : 0;

                  return (
                    <TableRow key={run.id}>
                      <TableCell className="font-medium">{run.run_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(run.billing_period_start), 'dd MMM yyyy')}</div>
                          <div className="text-gray-500">
                            to {format(new Date(run.billing_period_end), 'dd MMM yyyy')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {run.billing_cycles ? (
                          <Badge variant="outline">{run.billing_cycles.name}</Badge>
                        ) : (
                          <span className="text-gray-500">No cycle</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={progress} className="h-2" />
                          <div className="text-xs text-gray-500">
                            {run.processed_customers}/{run.total_customers} ({progress}%)
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{run.total_customers}</TableCell>
                      <TableCell>
                        <span className={successRate >= 90 ? 'text-green-600' : successRate >= 70 ? 'text-yellow-600' : 'text-red-600'}>
                          {successRate}%
                        </span>
                        <div className="text-xs text-gray-500">
                          {run.successful_invoices} success, {run.failed_invoices} failed
                        </div>
                      </TableCell>
                      <TableCell>₹{run.total_invoice_amount.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(run.status)}</TableCell>
                      <TableCell>
                        {format(new Date(run.created_at), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        {run.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExecuteRun(run.id)}
                            disabled={executeMutation.isPending}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Execute
                          </Button>
                        )}
                        {run.status === 'failed' && run.error_log && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Show error details in a modal or expand
                              alert(run.error_log);
                            }}
                          >
                            View Error
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};