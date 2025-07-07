import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, FileText, Calendar, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ratesService, RateContract } from '@/services/rates';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function RateContractList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeOnly, setActiveOnly] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['rate-contracts', statusFilter, activeOnly],
    queryFn: async () => {
      const response = await ratesService.getAllContracts({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        active_only: activeOnly,
      });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });

  const filteredContracts = data?.filter(contract =>
    contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.customer?.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (status: RateContract['status']) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, icon: FileText },
      pending_approval: { variant: 'warning' as const, icon: Clock },
      active: { variant: 'success' as const, icon: CheckCircle },
      expired: { variant: 'destructive' as const, icon: XCircle },
      terminated: { variant: 'destructive' as const, icon: XCircle },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="capitalize">
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getContractTypeBadge = (type: RateContract['contract_type']) => {
    const typeConfig = {
      standard: 'default',
      special: 'secondary',
      volume: 'outline',
      seasonal: 'outline',
    };

    return (
      <Badge variant={typeConfig[type] as any} className="capitalize">
        {type}
      </Badge>
    );
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await ratesService.approveContract(id);
      if (response.success) {
        toast.success('Rate contract approved successfully');
        refetch();
      } else {
        toast.error(response.error || 'Failed to approve contract');
      }
    } catch (error) {
      toast.error('Failed to approve contract');
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Error loading rate contracts: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Rate Contracts</h1>
        <Button onClick={() => navigate('/rates/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Contract
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by contract number or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={activeOnly ? "default" : "outline"}
              onClick={() => setActiveOnly(!activeOnly)}
            >
              Active Only
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No rate contracts found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      {contract.contract_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{contract.customer?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {contract.customer?.code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getContractTypeBadge(contract.contract_type)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(contract.valid_from), 'dd MMM yyyy')} - 
                          {format(new Date(contract.valid_until), 'dd MMM yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contract.base_discount_percentage ? (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          {contract.base_discount_percentage}%
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {contract.credit_limit ? (
                        <span className="font-medium">
                          ₹{contract.credit_limit.toLocaleString()}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(contract.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/rates/${contract.id}`)}
                        >
                          View
                        </Button>
                        {contract.status === 'pending_approval' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(contract.id)}
                          >
                            Approve
                          </Button>
                        )}
                      </div>
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
}