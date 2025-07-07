import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation } from '@tanstack/react-query';
import { expenseService, type Expense } from '@/services/expenses';
import { customerService } from '@/services/customers';
import { vehicleService } from '@/services/vehicles';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { toast } from 'sonner';

const expenseSchema = z.object({
  expense_date: z.string(),
  category_id: z.string().uuid(),
  subcategory_id: z.string().uuid().optional(),
  base_amount: z.number().positive(),
  tax_amount: z.number().min(0),
  total_amount: z.number().positive(),
  payment_method: z.enum(['cash', 'bank_transfer', 'credit_card', 'debit_card', 'cheque', 'upi', 'pending']),
  payment_reference: z.string().optional(),
  vendor_name: z.string().min(1),
  vendor_id: z.string().uuid().optional(),
  vendor_gstin: z.string().optional(),
  bill_number: z.string().optional(),
  bill_date: z.string().optional(),
  allocation_type: z.enum(['general', 'vehicle', 'route', 'booking', 'driver', 'branch']).optional(),
  vehicle_id: z.string().uuid().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

interface ExpenseFormProps {
  expense?: Expense | null;
  onClose: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ expense, onClose }) => {
  const { selectedBranch } = useBranchSelection();
  
  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => expenseService.getCategories(),
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => customerService.getCustomers({ page: 1, limit: 100 }),
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehicleService.getVehicles(),
  });

  const form = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense || {
      expense_date: new Date().toISOString().split('T')[0],
      payment_method: 'pending',
      base_amount: 0,
      tax_amount: 0,
      total_amount: 0,
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => expenseService.createExpense(data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense created successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create expense",
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => expenseService.updateExpense(expense!.id, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: any) => {
    if (expense) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const baseAmount = form.watch('base_amount');
  const taxAmount = form.watch('tax_amount');

  React.useEffect(() => {
    form.setValue('total_amount', baseAmount + taxAmount);
  }, [baseAmount, taxAmount, form]);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit Expense' : 'Create New Expense'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Expense Date</Label>
              <Input
                type="date"
                {...form.register('expense_date')}
              />
            </div>
            
            <div>
              <Label>Category</Label>
              <Select
                value={form.watch('category_id')}
                onValueChange={(value) => form.setValue('category_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Vendor Name</Label>
              <Input
                {...form.register('vendor_name')}
                placeholder="Enter vendor name"
              />
            </div>
            
            <div>
              <Label>Bill Number</Label>
              <Input
                {...form.register('bill_number')}
                placeholder="Enter bill number"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Base Amount</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register('base_amount', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label>Tax Amount</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register('tax_amount', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label>Total Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={form.watch('total_amount')}
                disabled
                className="bg-slate-50"
              />
            </div>
          </div>

          <div>
            <Label>Payment Method</Label>
            <Select
              value={form.watch('payment_method')}
              onValueChange={(value: any) => form.setValue('payment_method', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="debit_card">Debit Card</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              {...form.register('description')}
              placeholder="Enter expense description"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : expense ? 'Update' : 'Create'} Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseForm;