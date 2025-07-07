import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Calendar, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { billingService } from '../../services/billing';
import { BillingCycle } from '../../types';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const billingCycleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['monthly', 'weekly', 'fortnightly', 'quarterly', 'custom']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  due_days: z.number().min(1, 'Due days must be at least 1').default(30),
  auto_generate: z.boolean().default(false),
  status: z.enum(['active', 'inactive', 'completed']).default('active')
}).refine((data) => new Date(data.end_date) > new Date(data.start_date), {
  message: "End date must be after start date",
  path: ["end_date"]
});

type BillingCycleFormData = z.infer<typeof billingCycleSchema>;

interface BillingCycleFormProps {
  cycle?: BillingCycle;
  onClose: () => void;
}

const BillingCycleForm: React.FC<BillingCycleFormProps> = ({ cycle, onClose }) => {
  const queryClient = useQueryClient();

  const form = useForm<BillingCycleFormData>({
    resolver: zodResolver(billingCycleSchema),
    defaultValues: {
      name: cycle?.name || '',
      type: cycle?.type || 'monthly',
      start_date: cycle?.start_date || new Date().toISOString().split('T')[0],
      end_date: cycle?.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      due_days: cycle?.due_days || 30,
      auto_generate: cycle?.auto_generate || false,
      status: cycle?.status || 'active'
    }
  });

  const createMutation = useMutation({
    mutationFn: billingService.createBillingCycle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-cycles'] });
      toast.success('Billing cycle created successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create billing cycle');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BillingCycle> }) =>
      billingService.updateBillingCycle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-cycles'] });
      toast.success('Billing cycle updated successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update billing cycle');
    }
  });

  const onSubmit = async (data: BillingCycleFormData) => {
    try {
      if (cycle) {
        await updateMutation.mutateAsync({ id: cycle.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      // Error handling is done in mutation callbacks
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Cycle Name *</Label>
          <Input
            {...form.register('name')}
            placeholder="e.g., Monthly Cycle - January 2024"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="type">Cycle Type *</Label>
          <Select
            value={form.watch('type')}
            onValueChange={(value: any) => form.setValue('type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select cycle type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="fortnightly">Fortnightly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.type && (
            <p className="text-sm text-red-600">{form.formState.errors.type.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="start_date">Start Date *</Label>
          <Input
            type="date"
            {...form.register('start_date')}
          />
          {form.formState.errors.start_date && (
            <p className="text-sm text-red-600">{form.formState.errors.start_date.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="end_date">End Date *</Label>
          <Input
            type="date"
            {...form.register('end_date')}
          />
          {form.formState.errors.end_date && (
            <p className="text-sm text-red-600">{form.formState.errors.end_date.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="due_days">Payment Due Days *</Label>
          <Input
            type="number"
            min="1"
            {...form.register('due_days', { valueAsNumber: true })}
            placeholder="30"
          />
          {form.formState.errors.due_days && (
            <p className="text-sm text-red-600">{form.formState.errors.due_days.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={form.watch('status')}
            onValueChange={(value: any) => form.setValue('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="auto_generate"
          {...form.register('auto_generate')}
          className="rounded"
        />
        <Label htmlFor="auto_generate">Auto-generate invoices for this cycle</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : cycle ? 'Update Cycle' : 'Create Cycle'}
        </Button>
      </div>
    </form>
  );
};

export const BillingCyclesList: React.FC = () => {
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: cycles, isLoading, error } = useQuery({
    queryKey: ['billing-cycles'],
    queryFn: billingService.getBillingCycles
  });

  const getStatusBadge = (status: BillingCycle['status']) => {
    const variants: Record<BillingCycle['status'], 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      inactive: 'secondary',
      completed: 'outline'
    };

    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const getTypeBadge = (type: BillingCycle['type']) => {
    const colors: Record<BillingCycle['type'], string> = {
      weekly: 'bg-blue-100 text-blue-800',
      fortnightly: 'bg-green-100 text-green-800',
      monthly: 'bg-purple-100 text-purple-800',
      quarterly: 'bg-orange-100 text-orange-800',
      custom: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type]}`}>
        {type}
      </span>
    );
  };

  const handleCreateCycle = () => {
    setSelectedCycle(null);
    setIsDialogOpen(true);
  };

  const handleEditCycle = (cycle: BillingCycle) => {
    setSelectedCycle(cycle);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCycle(null);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading billing cycles. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Billing Cycles</h1>
          <p className="text-gray-600">Manage recurring billing periods and schedules</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateCycle}>
              <Plus className="w-4 h-4 mr-2" />
              Create Cycle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedCycle ? 'Edit Billing Cycle' : 'Create New Billing Cycle'}
              </DialogTitle>
            </DialogHeader>
            <BillingCycleForm
              cycle={selectedCycle || undefined}
              onClose={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cycles</p>
                <p className="text-2xl font-bold">{cycles?.length || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {cycles?.filter((cycle: BillingCycle) => cycle.status === 'active').length || 0}
                </p>
              </div>
              <Settings className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {cycles?.filter((cycle: BillingCycle) => cycle.status === 'completed').length || 0}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Auto-Generate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {cycles?.filter((cycle: BillingCycle) => cycle.auto_generate).length || 0}
                </p>
              </div>
              <Settings className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cycles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Cycles</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading billing cycles...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Due Days</TableHead>
                  <TableHead>Auto Generate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycles?.map((cycle: BillingCycle) => (
                  <TableRow key={cycle.id}>
                    <TableCell className="font-medium">{cycle.name}</TableCell>
                    <TableCell>{getTypeBadge(cycle.type)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(cycle.start_date), 'dd MMM yyyy')}</div>
                        <div className="text-gray-500">
                          to {format(new Date(cycle.end_date), 'dd MMM yyyy')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{cycle.due_days} days</TableCell>
                    <TableCell>
                      <Badge variant={cycle.auto_generate ? 'default' : 'outline'}>
                        {cycle.auto_generate ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(cycle.status)}</TableCell>
                    <TableCell>
                      {format(new Date(cycle.created_at), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCycle(cycle)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};