import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService } from '../services/billing';
import { Invoice, BillingCycle, SupplementaryBilling, CreditDebitNote, BulkBillingRun, PaymentRecord } from '../types';
import { toast } from 'react-hot-toast';

// ===================== BILLING CYCLES =====================

export const useBillingCycles = () => {
  return useQuery({
    queryKey: ['billing-cycles'],
    queryFn: billingService.getBillingCycles
  });
};

export const useCreateBillingCycle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: billingService.createBillingCycle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-cycles'] });
      toast.success('Billing cycle created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create billing cycle');
    }
  });
};

export const useUpdateBillingCycle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BillingCycle> }) =>
      billingService.updateBillingCycle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-cycles'] });
      toast.success('Billing cycle updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update billing cycle');
    }
  });
};

// ===================== INVOICES =====================

export const useInvoices = (filters?: any) => {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => billingService.getInvoices(filters)
  });
};

export const useInvoice = (id: string) => {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => billingService.getInvoiceById(id),
    enabled: !!id
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: billingService.createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create invoice');
    }
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      billingService.updateInvoice(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
      toast.success('Invoice updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update invoice');
    }
  });
};

export const useGenerateInvoiceFromBookings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: billingService.generateInvoiceFromBookings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice generated from bookings successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate invoice from bookings');
    }
  });
};

// ===================== SUPPLEMENTARY BILLING =====================

export const useSupplementaryBillings = (filters?: any) => {
  return useQuery({
    queryKey: ['supplementary-billings', filters],
    queryFn: () => billingService.getSupplementaryBillings(filters)
  });
};

export const useCreateSupplementaryBilling = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: billingService.createSupplementaryBilling,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplementary-billings'] });
      toast.success('Supplementary billing created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create supplementary billing');
    }
  });
};

export const useApproveSupplementaryBilling = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: billingService.approveSupplementaryBilling,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplementary-billings'] });
      toast.success('Supplementary billing approved successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve supplementary billing');
    }
  });
};

// ===================== CREDIT/DEBIT NOTES =====================

export const useCreditDebitNotes = (filters?: any) => {
  return useQuery({
    queryKey: ['credit-debit-notes', filters],
    queryFn: () => billingService.getCreditDebitNotes(filters)
  });
};

export const useCreateCreditDebitNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: billingService.createCreditDebitNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-debit-notes'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Credit/Debit note created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create credit/debit note');
    }
  });
};

// ===================== BULK BILLING =====================

export const useBulkBillingRuns = () => {
  return useQuery({
    queryKey: ['bulk-billing-runs'],
    queryFn: billingService.getBulkBillingRuns
  });
};

export const useCreateBulkBillingRun = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: billingService.createBulkBillingRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-billing-runs'] });
      toast.success('Bulk billing run created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create bulk billing run');
    }
  });
};

export const useExecuteBulkBillingRun = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: billingService.executeBulkBillingRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-billing-runs'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Bulk billing run started successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to execute bulk billing run');
    }
  });
};

// ===================== PAYMENTS =====================

export const usePaymentRecords = (filters?: any) => {
  return useQuery({
    queryKey: ['payment-records', filters],
    queryFn: () => billingService.getPaymentRecords(filters)
  });
};

export const useRecordPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: billingService.recordPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-records'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record payment');
    }
  });
};

export const useUpdatePaymentRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PaymentRecord> }) =>
      billingService.updatePaymentRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-records'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Payment record updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update payment record');
    }
  });
};

// ===================== UTILITY HOOKS =====================

export const useBillingStats = () => {
  const { data: invoices } = useInvoices();
  const { data: cycles } = useBillingCycles();
  const { data: supplementaryBillings } = useSupplementaryBillings();
  const { data: payments } = usePaymentRecords();

  const stats = {
    totalInvoices: invoices?.pagination?.total || 0,
    totalInvoiceAmount: invoices?.data?.reduce((sum: number, inv: Invoice) => sum + inv.total_amount, 0) || 0,
    paidAmount: invoices?.data?.reduce((sum: number, inv: Invoice) => sum + inv.paid_amount, 0) || 0,
    outstandingAmount: invoices?.data?.reduce((sum: number, inv: Invoice) => sum + inv.outstanding_amount, 0) || 0,
    overdueInvoices: invoices?.data?.filter((inv: Invoice) => inv.status === 'overdue').length || 0,
    activeCycles: cycles?.filter((cycle: BillingCycle) => cycle.status === 'active').length || 0,
    pendingSupplementary: supplementaryBillings?.filter((sup: SupplementaryBilling) => sup.status === 'pending').length || 0,
    recentPayments: payments?.slice(0, 5) || []
  };

  return { stats };
};

export const useInvoiceCalculations = () => {
  const calculateGST = (amount: number, rate: number, isIGST = false) => {
    return billingService.calculateGST(amount, rate, isIGST);
  };

  const calculateLineItemTotal = (lineItem: any) => {
    return billingService.calculateLineItemTotal(lineItem);
  };

  const formatCurrency = (amount: number) => {
    return billingService.formatCurrency(amount);
  };

  const formatInvoiceNumber = (number: string) => {
    return billingService.formatInvoiceNumber(number);
  };

  return {
    calculateGST,
    calculateLineItemTotal,
    formatCurrency,
    formatInvoiceNumber
  };
};