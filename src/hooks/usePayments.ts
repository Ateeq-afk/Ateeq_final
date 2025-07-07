import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService, PaymentFilters, OutstandingFilters, CreatePaymentRequest, Payment, OutstandingAmount, PaymentReminder, PaymentMode } from '../services/payments';
import { toast } from '@/lib/utils';

export const usePaymentModes = () => {
  return useQuery({
    queryKey: ['payment-modes'],
    queryFn: paymentService.getPaymentModes,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePayments = (filters: PaymentFilters = {}) => {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: () => paymentService.getPayments(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const usePayment = (id: string) => {
  return useQuery({
    queryKey: ['payment', id],
    queryFn: () => paymentService.getPaymentById(id),
    enabled: !!id,
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePaymentRequest) => paymentService.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['outstanding-amounts'] });
      queryClient.invalidateQueries({ queryKey: ['payment-analytics'] });
      toast.success('Payment created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create payment');
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Payment> }) => 
      paymentService.updatePayment(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', data.id] });
      queryClient.invalidateQueries({ queryKey: ['payment-analytics'] });
      toast.success('Payment updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update payment');
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => paymentService.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-analytics'] });
      toast.success('Payment deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete payment');
    },
  });
};

export const useOutstandingAmounts = (filters: OutstandingFilters = {}) => {
  return useQuery({
    queryKey: ['outstanding-amounts', filters],
    queryFn: () => paymentService.getOutstandingAmounts(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useCreateOutstandingAmount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<OutstandingAmount, 'id' | 'outstanding_amount' | 'overdue_days' | 'created_at' | 'updated_at' | 'created_by' | 'is_deleted'>) => 
      paymentService.createOutstandingAmount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outstanding-amounts'] });
      queryClient.invalidateQueries({ queryKey: ['payment-analytics'] });
      toast.success('Outstanding amount created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create outstanding amount');
    },
  });
};

export const useUpdateOutstandingAmount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<OutstandingAmount> }) => 
      paymentService.updateOutstandingAmount(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outstanding-amounts'] });
      queryClient.invalidateQueries({ queryKey: ['payment-analytics'] });
      toast.success('Outstanding amount updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update outstanding amount');
    },
  });
};

export const usePaymentReminders = (filters: any = {}) => {
  return useQuery({
    queryKey: ['payment-reminders', filters],
    queryFn: () => paymentService.getPaymentReminders(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useCreatePaymentReminder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<PaymentReminder, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => 
      paymentService.createPaymentReminder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-reminders'] });
      toast.success('Payment reminder created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create payment reminder');
    },
  });
};

export const useUpdatePaymentReminder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PaymentReminder> }) => 
      paymentService.updatePaymentReminder(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-reminders'] });
      toast.success('Payment reminder updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update payment reminder');
    },
  });
};

export const usePaymentAnalytics = (filters: { branch_id?: string; date_from?: string; date_to?: string } = {}) => {
  return useQuery({
    queryKey: ['payment-analytics', filters],
    queryFn: () => paymentService.getPaymentAnalytics(filters),
    staleTime: 60 * 1000, // 1 minute
  });
};