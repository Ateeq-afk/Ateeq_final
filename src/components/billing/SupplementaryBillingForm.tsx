import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Plus, Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { customerService } from '../../services/customers';
import { billingService } from '../../services/billing';
import { useSupplementaryBillings, useCreateSupplementaryBilling, useApproveSupplementaryBilling } from '../../hooks/useBilling';
import { Customer, SupplementaryBilling } from '../../types';
import { format } from 'date-fns';

const supplementaryBillingSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  original_invoice_id: z.string().optional(),
  reason: z.string().min(1, 'Reason is required'),
  description: z.string().optional(),
  charge_type: z.enum(['additional_service', 'penalty', 'adjustment', 'extra_charge']),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  is_taxable: z.boolean().default(true),
  tax_rate: z.number().min(0).max(50).default(18)
});

type SupplementaryBillingFormData = z.infer<typeof supplementaryBillingSchema>;

interface SupplementaryBillingFormProps {
  onClose: () => void;
}

const SupplementaryBillingFormComponent: React.FC<SupplementaryBillingFormProps> = ({ onClose }) => {
  const createMutation = useCreateSupplementaryBilling();

  const form = useForm<SupplementaryBillingFormData>({
    resolver: zodResolver(supplementaryBillingSchema),
    defaultValues: {
      customer_id: '',
      original_invoice_id: '',
      reason: '',
      description: '',
      charge_type: 'additional_service',
      amount: 0,
      is_taxable: true,
      tax_rate: 18
    }
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers()
  });

  const watchedCustomerId = form.watch('customer_id');
  const watchedAmount = form.watch('amount');
  const watchedIsTaxable = form.watch('is_taxable');
  const watchedTaxRate = form.watch('tax_rate');

  // Get customer invoices for selected customer
  const { data: invoices } = useQuery({
    queryKey: ['customer-invoices', watchedCustomerId],
    queryFn: () => billingService.getInvoices({ customer_id: watchedCustomerId }),
    enabled: !!watchedCustomerId
  });

  const calculateTotals = () => {
    const baseAmount = watchedAmount || 0;
    const taxAmount = watchedIsTaxable ? (baseAmount * (watchedTaxRate || 0)) / 100 : 0;
    const totalAmount = baseAmount + taxAmount;

    return {
      baseAmount,
      taxAmount,
      totalAmount
    };
  };

  const totals = calculateTotals();

  const onSubmit = async (data: SupplementaryBillingFormData) => {
    const finalData = {
      ...data,
      tax_amount: totals.taxAmount,
      total_amount: totals.totalAmount
    };

    try {
      await createMutation.mutateAsync(finalData);
      onClose();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customer_id">Customer *</Label>
          <Select
            value={form.watch('customer_id')}
            onValueChange={(value) => form.setValue('customer_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers?.map((customer: Customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.customer_id && (
            <p className="text-sm text-red-600">{form.formState.errors.customer_id.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="original_invoice_id">Related Invoice (Optional)</Label>
          <Select
            value={form.watch('original_invoice_id')}
            onValueChange={(value) => form.setValue('original_invoice_id', value)}
            disabled={!watchedCustomerId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select invoice" />
            </SelectTrigger>
            <SelectContent>
              {invoices?.data?.map((invoice: any) => (
                <SelectItem key={invoice.id} value={invoice.id}>
                  {invoice.invoice_number} - ₹{invoice.total_amount}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="charge_type">Charge Type *</Label>
          <Select
            value={form.watch('charge_type')}
            onValueChange={(value: any) => form.setValue('charge_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select charge type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="additional_service">Additional Service</SelectItem>
              <SelectItem value="penalty">Penalty</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
              <SelectItem value="extra_charge">Extra Charge</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.charge_type && (
            <p className="text-sm text-red-600">{form.formState.errors.charge_type.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="amount">Amount *</Label>
          <Input
            type="number"
            step="0.01"
            {...form.register('amount', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {form.formState.errors.amount && (
            <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="reason">Reason *</Label>
        <Input
          {...form.register('reason')}
          placeholder="Brief reason for supplementary billing"
        />
        {form.formState.errors.reason && (
          <p className="text-sm text-red-600">{form.formState.errors.reason.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          {...form.register('description')}
          placeholder="Detailed description of the supplementary charge"
          rows={3}
        />
      </div>

      {/* Tax Configuration */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_taxable"
            {...form.register('is_taxable')}
            className="rounded"
          />
          <Label htmlFor="is_taxable">This charge is taxable</Label>
        </div>

        {watchedIsTaxable && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tax_rate">Tax Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register('tax_rate', { valueAsNumber: true })}
                placeholder="18.00"
              />
            </div>
          </div>
        )}
      </div>

      {/* Amount Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Amount Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Base Amount:</span>
              <span>₹{totals.baseAmount.toFixed(2)}</span>
            </div>
            {watchedIsTaxable && (
              <div className="flex justify-between">
                <span>Tax ({watchedTaxRate}%):</span>
                <span>₹{totals.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total Amount:</span>
              <span>₹{totals.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create Supplementary Billing'}
        </Button>
      </div>
    </form>
  );
};

export const SupplementaryBillingList: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: supplementaryBillings, isLoading } = useSupplementaryBillings({
    status: statusFilter || undefined
  });
  const approveMutation = useApproveSupplementaryBilling();

  const getStatusBadge = (status: SupplementaryBilling['status']) => {
    const variants: Record<SupplementaryBilling['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      approved: 'secondary',
      invoiced: 'default',
      cancelled: 'destructive'
    };

    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const getChargeTypeBadge = (type: SupplementaryBilling['charge_type']) => {
    const colors: Record<SupplementaryBilling['charge_type'], string> = {
      additional_service: 'bg-blue-100 text-blue-800',
      penalty: 'bg-red-100 text-red-800',
      adjustment: 'bg-yellow-100 text-yellow-800',
      extra_charge: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type]}`}>
        {type.replace('_', ' ')}
      </span>
    );
  };

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Supplementary Billing</h1>
          <p className="text-gray-600">Manage additional charges and adjustments</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Supplementary Billing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create Supplementary Billing</DialogTitle>
            </DialogHeader>
            <SupplementaryBillingFormComponent onClose={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{supplementaryBillings?.length || 0}</p>
              </div>
              <Plus className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {supplementaryBillings?.filter((bill: SupplementaryBilling) => bill.status === 'pending').length || 0}
                </p>
              </div>
              <X className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {supplementaryBillings?.filter((bill: SupplementaryBilling) => bill.status === 'approved').length || 0}
                </p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{supplementaryBillings?.reduce((sum: number, bill: SupplementaryBilling) => sum + bill.total_amount, 0).toFixed(2) || '0.00'}
                </p>
              </div>
              <Plus className="w-8 h-8 text-blue-500" />
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="invoiced">Invoiced</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Supplementary Billing Table */}
      <Card>
        <CardHeader>
          <CardTitle>Supplementary Billing List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading supplementary billings...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Charge Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Tax Amount</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplementaryBillings?.map((billing: SupplementaryBilling) => (
                  <TableRow key={billing.id}>
                    <TableCell className="font-medium">{billing.reference_number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{billing.customers?.name}</p>
                        <p className="text-sm text-gray-500">{billing.customers?.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getChargeTypeBadge(billing.charge_type)}</TableCell>
                    <TableCell className="max-w-xs truncate">{billing.reason}</TableCell>
                    <TableCell>₹{billing.amount.toFixed(2)}</TableCell>
                    <TableCell>₹{billing.tax_amount.toFixed(2)}</TableCell>
                    <TableCell>₹{billing.total_amount.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(billing.status)}</TableCell>
                    <TableCell>
                      {format(new Date(billing.billing_date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      {billing.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(billing.id)}
                          disabled={approveMutation.isPending}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                      )}
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