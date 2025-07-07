import React, { useState } from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Eye, Edit, Trash2, FileText, Search, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';
import { usePayments, usePaymentModes, useDeletePayment } from '../../hooks/usePayments';
import { useBranchSelection } from '../../contexts/BranchSelectionContext';
import { PaymentFilters } from '../../services/payments';

interface PaymentListProps {
  onViewPayment?: (id: string) => void;
  onEditPayment?: (id: string) => void;
  onGenerateReceipt?: (id: string) => void;
}

export const PaymentList: React.FC<PaymentListProps> = ({
  onViewPayment,
  onEditPayment,
  onGenerateReceipt,
}) => {
  const { selectedBranch } = useBranchSelection();
  const { data: paymentModes } = usePaymentModes();
  const deletePaymentMutation = useDeletePayment();

  const [filters, setFilters] = useState<PaymentFilters>({
    branch_id: selectedBranch?.id,
    page: 1,
    limit: 50,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: paymentsResponse, isLoading } = usePayments(filters);
  const payments = paymentsResponse?.data || [];
  const pagination = paymentsResponse?.pagination;

  const handleFilterChange = (key: keyof PaymentFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleDeletePayment = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      await deletePaymentMutation.mutateAsync(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      cleared: 'default',
      bounced: 'destructive',
      cancelled: 'outline',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPurposeBadge = (purpose: string) => {
    const colors = {
      booking_payment: 'bg-blue-100 text-blue-800',
      advance: 'bg-green-100 text-green-800',
      balance: 'bg-orange-100 text-orange-800',
      freight: 'bg-purple-100 text-purple-800',
      detention: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800',
    } as const;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[purpose as keyof typeof colors] || colors.other}`}>
        {purpose.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Payments ({pagination?.total || 0})</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Search by Payer</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search payer name..."
                      className="pl-10"
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={filters.status || ''}
                    onValueChange={(value) => handleFilterChange('status', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cleared">Cleared</SelectItem>
                      <SelectItem value="bounced">Bounced</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select
                    value={filters.payment_mode_id || ''}
                    onValueChange={(value) => handleFilterChange('payment_mode_id', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All modes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Modes</SelectItem>
                      {paymentModes?.map((mode) => (
                        <SelectItem key={mode.id} value={mode.id}>
                          {mode.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payer Type</Label>
                  <Select
                    value={filters.payer_type || ''}
                    onValueChange={(value) => handleFilterChange('payer_type', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Input
                    type="date"
                    value={filters.date_from || ''}
                    onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Input
                    type="date"
                    value={filters.date_to || ''}
                    onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No payments found
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.payment_number}
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.payment_date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.payer_name}</div>
                        <div className="text-sm text-gray-500 capitalize">
                          {payment.payer_type}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ₹{payment.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {payment.payment_mode || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getPurposeBadge(payment.purpose)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell>
                      {payment.payment_reference && (
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {payment.payment_reference}
                        </code>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewPayment?.(payment.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditPayment?.(payment.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Payment
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onGenerateReceipt?.(payment.id)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Generate Receipt
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeletePayment(payment.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && pagination.total > pagination.limit && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} payments
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => handleFilterChange('page', pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page * pagination.limit >= pagination.total}
                onClick={() => handleFilterChange('page', pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentList;