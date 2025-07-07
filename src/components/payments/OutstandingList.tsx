import React, { useState } from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Eye, Edit, Send, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';
import { useOutstandingAmounts, useUpdateOutstandingAmount } from '../../hooks/usePayments';
import { useBranchSelection } from '../../contexts/BranchSelectionContext';
import { OutstandingFilters } from '../../services/payments';

interface OutstandingListProps {
  onViewOutstanding?: (id: string) => void;
  onCreateReminder?: (id: string) => void;
  onMarkPaid?: (id: string, amount: number) => void;
}

export const OutstandingList: React.FC<OutstandingListProps> = ({
  onViewOutstanding,
  onCreateReminder,
  onMarkPaid,
}) => {
  const { selectedBranch } = useBranchSelection();
  const updateOutstandingMutation = useUpdateOutstandingAmount();

  const [filters, setFilters] = useState<OutstandingFilters>({
    branch_id: selectedBranch?.id,
    status: 'pending',
    page: 1,
    limit: 50,
  });

  const { data: outstandingResponse, isLoading } = useOutstandingAmounts(filters);
  const outstandingAmounts = outstandingResponse?.data || [];
  const pagination = outstandingResponse?.pagination;

  const handleFilterChange = (key: keyof OutstandingFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: 1,
    }));
  };

  const handleMarkPaid = async (id: string, paidAmount: number) => {
    const outstanding = outstandingAmounts.find(o => o.id === id);
    if (!outstanding) return;

    const newPaidAmount = outstanding.paid_amount + paidAmount;
    const newStatus = newPaidAmount >= outstanding.original_amount ? 'fully_paid' : 'partially_paid';

    await updateOutstandingMutation.mutateAsync({
      id,
      updates: {
        paid_amount: newPaidAmount,
        status: newStatus,
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      partially_paid: 'default',
      fully_paid: 'outline',
      written_off: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getAgingBadge = (agingBucket: string, overduedays: number) => {
    if (overduedays === 0) {
      return <Badge variant="outline">Current</Badge>;
    }

    const colors = {
      '1-30_days': 'bg-yellow-100 text-yellow-800',
      '31-60_days': 'bg-orange-100 text-orange-800',
      '61-90_days': 'bg-red-100 text-red-800',
      '90+_days': 'bg-red-200 text-red-900',
    } as const;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${colors[agingBucket as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {overduedays > 0 && <AlertTriangle className="h-3 w-3" />}
        {overduedays} days overdue
      </span>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Amounts</CardTitle>
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

  const totalOutstanding = outstandingAmounts.reduce((sum, item) => sum + item.outstanding_amount, 0);
  const overdueAmount = outstandingAmounts.filter(item => item.overdue_days > 0).reduce((sum, item) => sum + item.outstanding_amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                <p className="text-2xl font-bold">₹{totalOutstanding.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue Amount</p>
                <p className="text-2xl font-bold text-red-600">₹{overdueAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold">{pagination?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Outstanding Amounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partially_paid">Partially Paid</SelectItem>
                      <SelectItem value="fully_paid">Fully Paid</SelectItem>
                      <SelectItem value="written_off">Written Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Aging</Label>
                  <Select
                    value={filters.aging_bucket || 'all'}
                    onValueChange={(value) => handleFilterChange('aging_bucket', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All aging" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Aging</SelectItem>
                      <SelectItem value="current">Current</SelectItem>
                      <SelectItem value="1-30_days">1-30 Days</SelectItem>
                      <SelectItem value="31-60_days">31-60 Days</SelectItem>
                      <SelectItem value="61-90_days">61-90 Days</SelectItem>
                      <SelectItem value="90+_days">90+ Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Input
                    placeholder="Search customer..."
                    onChange={(e) => handleFilterChange('customer_search', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Original Amount</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Aging</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outstandingAmounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No outstanding amounts found
                    </TableCell>
                  </TableRow>
                ) : (
                  outstandingAmounts.map((outstanding) => (
                    <TableRow key={outstanding.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{outstanding.reference_number}</div>
                          <div className="text-sm text-gray-500 capitalize">
                            {outstanding.reference_type}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{outstanding.customer_name}</div>
                          {outstanding.contact_phone && (
                            <div className="text-sm text-gray-500">{outstanding.contact_phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{outstanding.original_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-green-600">
                        ₹{outstanding.paid_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-medium text-red-600">
                        ₹{outstanding.outstanding_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(outstanding.due_date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        {getAgingBadge(outstanding.aging_bucket, outstanding.overdue_days)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(outstanding.status)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewOutstanding?.(outstanding.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {outstanding.status !== 'fully_paid' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    const amount = prompt('Enter payment amount:');
                                    if (amount && !isNaN(Number(amount))) {
                                      handleMarkPaid(outstanding.id, Number(amount));
                                    }
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Mark Payment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onCreateReminder?.(outstanding.id)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Reminder
                                </DropdownMenuItem>
                              </>
                            )}
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
                {pagination.total} outstanding amounts
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
    </div>
  );
};

export default OutstandingList;