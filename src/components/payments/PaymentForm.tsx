import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { usePaymentModes, useCreatePayment, useUpdatePayment } from '../../hooks/usePayments';
import { useBranchSelection } from '../../contexts/BranchSelectionContext';
import { Payment, CreatePaymentRequest } from '../../services/payments';

const paymentSchema = z.object({
  payment_mode_id: z.string().min(1, 'Payment mode is required'),
  payment_reference: z.string().optional(),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  payment_date: z.string().min(1, 'Payment date is required'),
  payer_name: z.string().min(1, 'Payer name is required'),
  payer_type: z.enum(['customer', 'vendor', 'employee', 'other']),
  payer_id: z.string().optional(),
  purpose: z.enum(['booking_payment', 'advance', 'balance', 'freight', 'detention', 'other']),
  description: z.string().optional(),
  bank_name: z.string().optional(),
  bank_branch: z.string().optional(),
  account_number: z.string().optional(),
  ifsc_code: z.string().optional(),
});

const allocationSchema = z.object({
  allocation_type: z.enum(['booking', 'invoice', 'advance', 'outstanding']),
  reference_number: z.string().min(1, 'Reference number is required'),
  allocated_amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;
type AllocationFormData = z.infer<typeof allocationSchema>;

interface PaymentFormProps {
  payment?: Payment | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  payment,
  onSuccess,
  onCancel,
}) => {
  const { selectedBranch } = useBranchSelection();
  const { data: paymentModes } = usePaymentModes();
  const createPaymentMutation = useCreatePayment();
  const updatePaymentMutation = useUpdatePayment();
  const [allocations, setAllocations] = useState<AllocationFormData[]>([]);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<any>(null);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_mode_id: '',
      payment_reference: '',
      amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      payer_name: '',
      payer_type: 'customer',
      purpose: 'booking_payment',
      description: '',
      bank_name: '',
      bank_branch: '',
      account_number: '',
      ifsc_code: '',
    },
  });

  useEffect(() => {
    if (payment) {
      form.reset({
        payment_mode_id: payment.payment_mode_id,
        payment_reference: payment.payment_reference || '',
        amount: payment.amount,
        payment_date: payment.payment_date,
        payer_name: payment.payer_name,
        payer_type: payment.payer_type,
        purpose: payment.purpose,
        description: payment.description || '',
        bank_name: payment.bank_name || '',
        bank_branch: payment.bank_branch || '',
        account_number: payment.account_number || '',
        ifsc_code: payment.ifsc_code || '',
      });
    }
  }, [payment, form]);

  useEffect(() => {
    const paymentModeId = form.watch('payment_mode_id');
    const mode = paymentModes?.find(m => m.id === paymentModeId);
    setSelectedPaymentMode(mode);
  }, [form.watch('payment_mode_id'), paymentModes]);

  const onSubmit = async (data: PaymentFormData) => {
    if (!selectedBranch) {
      return;
    }

    try {
      const paymentData: CreatePaymentRequest = {
        ...data,
        branch_id: selectedBranch.id,
        organization_id: selectedBranch.organization_id,
        allocations: allocations.length > 0 ? allocations : undefined,
      };

      if (payment) {
        await updatePaymentMutation.mutateAsync({
          id: payment.id,
          updates: paymentData,
        });
      } else {
        await createPaymentMutation.mutateAsync(paymentData);
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  };

  const addAllocation = () => {
    setAllocations([
      ...allocations,
      {
        allocation_type: 'booking',
        reference_number: '',
        allocated_amount: 0,
        description: '',
      },
    ]);
  };

  const removeAllocation = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const updateAllocation = (index: number, field: keyof AllocationFormData, value: any) => {
    const updated = [...allocations];
    updated[index] = { ...updated[index], [field]: value };
    setAllocations(updated);
  };

  const totalAllocated = allocations.reduce((sum, allocation) => sum + allocation.allocated_amount, 0);
  const paymentAmount = form.watch('amount') || 0;
  const unallocatedAmount = paymentAmount - totalAllocated;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {payment ? 'Edit Payment' : 'Create New Payment'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_mode_id">Payment Mode *</Label>
                <Select
                  value={form.watch('payment_mode_id')}
                  onValueChange={(value) => form.setValue('payment_mode_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentModes?.map((mode) => (
                      <SelectItem key={mode.id} value={mode.id}>
                        {mode.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.payment_mode_id && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.payment_mode_id.message}
                  </p>
                )}
              </div>

              {selectedPaymentMode?.requires_reference && (
                <div className="space-y-2">
                  <Label htmlFor="payment_reference">
                    Reference Number *
                    {selectedPaymentMode?.type === 'cheque' && ' (Cheque Number)'}
                    {selectedPaymentMode?.type === 'bank_transfer' && ' (Transaction ID)'}
                    {selectedPaymentMode?.type === 'upi' && ' (UPI Transaction ID)'}
                  </Label>
                  <Input
                    id="payment_reference"
                    {...form.register('payment_reference')}
                    placeholder="Enter reference number"
                  />
                  {form.formState.errors.payment_reference && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.payment_reference.message}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...form.register('amount', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {form.formState.errors.amount && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_date">Payment Date *</Label>
                <Input
                  id="payment_date"
                  type="date"
                  {...form.register('payment_date')}
                />
                {form.formState.errors.payment_date && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.payment_date.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payer_name">Payer Name *</Label>
                <Input
                  id="payer_name"
                  {...form.register('payer_name')}
                  placeholder="Enter payer name"
                />
                {form.formState.errors.payer_name && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.payer_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payer_type">Payer Type *</Label>
                <Select
                  value={form.watch('payer_type')}
                  onValueChange={(value) => form.setValue('payer_type', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose *</Label>
                <Select
                  value={form.watch('purpose')}
                  onValueChange={(value) => form.setValue('purpose', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="booking_payment">Booking Payment</SelectItem>
                    <SelectItem value="advance">Advance</SelectItem>
                    <SelectItem value="balance">Balance</SelectItem>
                    <SelectItem value="freight">Freight</SelectItem>
                    <SelectItem value="detention">Detention</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Additional details about the payment"
                  rows={3}
                />
              </div>
            </div>

            {selectedPaymentMode?.type !== 'cash' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bank Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input
                        id="bank_name"
                        {...form.register('bank_name')}
                        placeholder="Enter bank name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bank_branch">Bank Branch</Label>
                      <Input
                        id="bank_branch"
                        {...form.register('bank_branch')}
                        placeholder="Enter branch name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account_number">Account Number</Label>
                      <Input
                        id="account_number"
                        {...form.register('account_number')}
                        placeholder="Enter account number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ifsc_code">IFSC Code</Label>
                      <Input
                        id="ifsc_code"
                        {...form.register('ifsc_code')}
                        placeholder="Enter IFSC code"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Payment Allocations</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAllocation}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Allocation
                </Button>
              </CardHeader>
              <CardContent>
                {allocations.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No allocations added. Add allocations to specify what this payment covers.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {allocations.map((allocation, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">Allocation {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAllocation(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Allocation Type</Label>
                            <Select
                              value={allocation.allocation_type}
                              onValueChange={(value) => updateAllocation(index, 'allocation_type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="booking">Booking</SelectItem>
                                <SelectItem value="invoice">Invoice</SelectItem>
                                <SelectItem value="advance">Advance</SelectItem>
                                <SelectItem value="outstanding">Outstanding</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Reference Number</Label>
                            <Input
                              value={allocation.reference_number}
                              onChange={(e) => updateAllocation(index, 'reference_number', e.target.value)}
                              placeholder="Enter reference"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={allocation.allocated_amount || ''}
                              onChange={(e) => updateAllocation(index, 'allocated_amount', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-3">
                            <Label>Description</Label>
                            <Input
                              value={allocation.description || ''}
                              onChange={(e) => updateAllocation(index, 'description', e.target.value)}
                              placeholder="Additional details"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Payment Amount: ₹{paymentAmount.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">Total Allocated: ₹{totalAllocated.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={unallocatedAmount === 0 ? 'default' : unallocatedAmount > 0 ? 'secondary' : 'destructive'}>
                          Unallocated: ₹{unallocatedAmount.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createPaymentMutation.isPending ||
                  updatePaymentMutation.isPending
                }
              >
                {payment ? 'Update Payment' : 'Create Payment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};