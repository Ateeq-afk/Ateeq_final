import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Plus, CreditCard, Receipt } from 'lucide-react';
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
import { useCreditDebitNotes, useCreateCreditDebitNote } from '../../hooks/useBilling';
import { Customer, Invoice, CreditDebitNote } from '../../types';
import { format } from 'date-fns';

const creditDebitNoteSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  original_invoice_id: z.string().min(1, 'Original invoice is required'),
  note_type: z.enum(['credit', 'debit']),
  reason: z.string().min(1, 'Reason is required'),
  description: z.string().optional(),
  adjustment_type: z.enum(['discount', 'return', 'damage', 'shortage', 'rate_correction', 'other']),
  original_amount: z.number().min(0, 'Original amount must be non-negative'),
  adjustment_amount: z.number().min(0.01, 'Adjustment amount must be greater than 0'),
  tax_adjustment: z.number().min(0).default(0)
});

type CreditDebitNoteFormData = z.infer<typeof creditDebitNoteSchema>;

interface CreditDebitNoteFormProps {
  onClose: () => void;
}

const CreditDebitNoteFormComponent: React.FC<CreditDebitNoteFormProps> = ({ onClose }) => {
  const createMutation = useCreateCreditDebitNote();

  const form = useForm<CreditDebitNoteFormData>({
    resolver: zodResolver(creditDebitNoteSchema),
    defaultValues: {
      customer_id: '',
      original_invoice_id: '',
      note_type: 'credit',
      reason: '',
      description: '',
      adjustment_type: 'discount',
      original_amount: 0,
      adjustment_amount: 0,
      tax_adjustment: 0
    }
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers()
  });

  const watchedCustomerId = form.watch('customer_id');
  const watchedInvoiceId = form.watch('original_invoice_id');
  const watchedAdjustmentAmount = form.watch('adjustment_amount');
  const watchedTaxAdjustment = form.watch('tax_adjustment');

  // Get customer invoices for selected customer
  const { data: invoices } = useQuery({
    queryKey: ['customer-invoices', watchedCustomerId],
    queryFn: () => billingService.getInvoices({ customer_id: watchedCustomerId }),
    enabled: !!watchedCustomerId
  });

  // Get selected invoice details
  const { data: selectedInvoice } = useQuery({
    queryKey: ['invoice', watchedInvoiceId],
    queryFn: () => billingService.getInvoiceById(watchedInvoiceId),
    enabled: !!watchedInvoiceId
  });

  // Update original amount when invoice is selected
  React.useEffect(() => {
    if (selectedInvoice) {
      form.setValue('original_amount', selectedInvoice.total_amount);
    }
  }, [selectedInvoice, form]);

  const calculateTotals = () => {
    const adjustmentAmount = watchedAdjustmentAmount || 0;
    const taxAdjustment = watchedTaxAdjustment || 0;
    const totalAdjustment = adjustmentAmount + taxAdjustment;

    return {
      adjustmentAmount,
      taxAdjustment,
      totalAdjustment
    };
  };

  const totals = calculateTotals();

  const onSubmit = async (data: CreditDebitNoteFormData) => {
    const finalData = {
      ...data,
      total_adjustment: totals.totalAdjustment
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
            onValueChange={(value) => {
              form.setValue('customer_id', value);
              form.setValue('original_invoice_id', ''); // Reset invoice when customer changes
            }}
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
          <Label htmlFor="original_invoice_id">Original Invoice *</Label>
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
                  {invoice.invoice_number} - ₹{invoice.total_amount} ({invoice.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.original_invoice_id && (
            <p className="text-sm text-red-600">{form.formState.errors.original_invoice_id.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="note_type">Note Type *</Label>
          <Select
            value={form.watch('note_type')}
            onValueChange={(value: any) => form.setValue('note_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select note type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="credit">Credit Note</SelectItem>
              <SelectItem value="debit">Debit Note</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.note_type && (
            <p className="text-sm text-red-600">{form.formState.errors.note_type.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="adjustment_type">Adjustment Type *</Label>
          <Select
            value={form.watch('adjustment_type')}
            onValueChange={(value: any) => form.setValue('adjustment_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select adjustment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="discount">Discount</SelectItem>
              <SelectItem value="return">Return</SelectItem>
              <SelectItem value="damage">Damage</SelectItem>
              <SelectItem value="shortage">Shortage</SelectItem>
              <SelectItem value="rate_correction">Rate Correction</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.adjustment_type && (
            <p className="text-sm text-red-600">{form.formState.errors.adjustment_type.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="original_amount">Original Amount *</Label>
          <Input
            type="number"
            step="0.01"
            {...form.register('original_amount', { valueAsNumber: true })}
            placeholder="0.00"
            readOnly
          />
          {form.formState.errors.original_amount && (
            <p className="text-sm text-red-600">{form.formState.errors.original_amount.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="adjustment_amount">Adjustment Amount *</Label>
          <Input
            type="number"
            step="0.01"
            {...form.register('adjustment_amount', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {form.formState.errors.adjustment_amount && (
            <p className="text-sm text-red-600">{form.formState.errors.adjustment_amount.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="reason">Reason *</Label>
        <Input
          {...form.register('reason')}
          placeholder="Brief reason for the credit/debit note"
        />
        {form.formState.errors.reason && (
          <p className="text-sm text-red-600">{form.formState.errors.reason.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          {...form.register('description')}
          placeholder="Detailed description of the adjustment"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="tax_adjustment">Tax Adjustment</Label>
        <Input
          type="number"
          step="0.01"
          {...form.register('tax_adjustment', { valueAsNumber: true })}
          placeholder="0.00"
        />
      </div>

      {/* Selected Invoice Details */}
      {selectedInvoice && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Invoice Number:</strong> {selectedInvoice.invoice_number}</p>
                <p><strong>Date:</strong> {format(new Date(selectedInvoice.invoice_date), 'dd MMM yyyy')}</p>
                <p><strong>Status:</strong> {selectedInvoice.status}</p>
              </div>
              <div>
                <p><strong>Total Amount:</strong> ₹{selectedInvoice.total_amount}</p>
                <p><strong>Paid Amount:</strong> ₹{selectedInvoice.paid_amount}</p>
                <p><strong>Outstanding:</strong> ₹{selectedInvoice.outstanding_amount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Amount Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Adjustment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Adjustment Amount:</span>
              <span>₹{totals.adjustmentAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax Adjustment:</span>
              <span>₹{totals.taxAdjustment.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total Adjustment:</span>
              <span>₹{totals.totalAdjustment.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create Note'}
        </Button>
      </div>
    </form>
  );
};

export const CreditDebitNoteList: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [noteTypeFilter, setNoteTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: notes, isLoading } = useCreditDebitNotes({
    note_type: noteTypeFilter || undefined,
    status: statusFilter || undefined
  });

  const getStatusBadge = (status: CreditDebitNote['status']) => {
    const variants: Record<CreditDebitNote['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'outline',
      approved: 'secondary',
      applied: 'default',
      cancelled: 'destructive'
    };

    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const getNoteTypeBadge = (type: CreditDebitNote['note_type']) => {
    return (
      <Badge variant={type === 'credit' ? 'default' : 'secondary'}>
        {type === 'credit' ? 'Credit Note' : 'Debit Note'}
      </Badge>
    );
  };

  const getAdjustmentTypeBadge = (type: CreditDebitNote['adjustment_type']) => {
    const colors: Record<CreditDebitNote['adjustment_type'], string> = {
      discount: 'bg-green-100 text-green-800',
      return: 'bg-blue-100 text-blue-800',
      damage: 'bg-red-100 text-red-800',
      shortage: 'bg-yellow-100 text-yellow-800',
      rate_correction: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type]}`}>
        {type.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Credit & Debit Notes</h1>
          <p className="text-gray-600">Manage invoice adjustments and corrections</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create Credit/Debit Note</DialogTitle>
            </DialogHeader>
            <CreditDebitNoteFormComponent onClose={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Notes</p>
                <p className="text-2xl font-bold">{notes?.length || 0}</p>
              </div>
              <Receipt className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Credit Notes</p>
                <p className="text-2xl font-bold text-green-600">
                  {notes?.filter((note: CreditDebitNote) => note.note_type === 'credit').length || 0}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Debit Notes</p>
                <p className="text-2xl font-bold text-red-600">
                  {notes?.filter((note: CreditDebitNote) => note.note_type === 'debit').length || 0}
                </p>
              </div>
              <Receipt className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Adjustment</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{notes?.reduce((sum: number, note: CreditDebitNote) => sum + note.total_adjustment, 0).toFixed(2) || '0.00'}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-500" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={noteTypeFilter} onValueChange={setNoteTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by note type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="credit">Credit Notes</SelectItem>
                <SelectItem value="debit">Debit Notes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Credit & Debit Notes List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading notes...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Note Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Original Invoice</TableHead>
                  <TableHead>Adjustment Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Original Amount</TableHead>
                  <TableHead>Adjustment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes?.map((note: CreditDebitNote) => (
                  <TableRow key={note.id}>
                    <TableCell className="font-medium">{note.note_number}</TableCell>
                    <TableCell>{getNoteTypeBadge(note.note_type)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{note.customers?.name}</p>
                        <p className="text-sm text-gray-500">{note.customers?.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{note.original_invoice?.invoice_number}</p>
                        <p className="text-sm text-gray-500">₹{note.original_amount}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getAdjustmentTypeBadge(note.adjustment_type)}</TableCell>
                    <TableCell className="max-w-xs truncate">{note.reason}</TableCell>
                    <TableCell>₹{note.original_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={note.note_type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                        {note.note_type === 'credit' ? '-' : '+'}₹{note.total_adjustment.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(note.status)}</TableCell>
                    <TableCell>
                      {format(new Date(note.note_date), 'dd MMM yyyy')}
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