import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Building,
  Calendar,
  CreditCard,
  User
} from 'lucide-react';

// Improved UI components
import { Button, IconButton } from '@/components/ui/button-improved';
import { Input, InputGroup, SearchInput } from '@/components/ui/input-improved';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell,
  DataCard,
  TableEmptyState,
  TableSkeleton,
  SortableHeader
} from '@/components/ui/table-improved';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/components/ui/card-improved';
import { Badge } from '@/components/ui/badge';
import { LoadingState, EmptyState } from '@/components/ui/states';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmationDialog } from '@/components/ui/dialog-improved';

// Hooks and utilities
import { useCustomers } from '@/hooks/useCustomers';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { toast } from '@/hooks/use-toast';
import { formatPhoneNumber, formatCurrency } from '@/lib/utils';
import { cn, responsive, getStatusClasses } from '@/lib/ui-improvements';

// Types
import type { Customer } from '@/types';

interface CustomerListProps {
  onSelectCustomer?: (customer: Customer) => void;
  selectionMode?: boolean;
}

export default function CustomerListImproved({ 
  onSelectCustomer, 
  selectionMode = false 
}: CustomerListProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranchSelection();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortField, setSortField] = useState<'name' | 'created_at' | 'balance'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  
  // Fetch customers with loading state
  const { 
    customers, 
    loading, 
    error, 
    refetch,
    deleteCustomer: deleteCustomerMutation 
  } = useCustomers({
    branch_id: selectedBranch?.id,
    search: searchTerm,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    sort_by: sortField,
    sort_order: sortOrder
  });

  // Computed values
  const stats = {
    total: customers?.length || 0,
    active: customers?.filter(c => c.status === 'active').length || 0,
    inactive: customers?.filter(c => c.status === 'inactive').length || 0,
    totalBalance: customers?.reduce((sum, c) => sum + (c.balance || 0), 0) || 0
  };

  // Handlers
  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async () => {
    if (!deleteCustomer) return;
    
    try {
      await deleteCustomerMutation(deleteCustomer.id);
      toast({
        title: 'Success',
        description: 'Customer deleted successfully',
      });
      setDeleteCustomer(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    // Export logic here
    toast({
      title: 'Exporting...',
      description: 'Your customer data is being exported',
    });
  };

  // Render error state
  if (error) {
    return (
      <ErrorState
        variant="server"
        onRetry={refetch}
      />
    );
  }

  return (
    <div className={cn(responsive.padding.md, "space-y-6")}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={cn(responsive.text['2xl'], "font-bold text-foreground")}>
            Customers
          </h1>
          <p className={cn(responsive.text.sm, "text-muted-foreground mt-1")}>
            Manage your customer database
          </p>
        </div>
        
        {!selectionMode && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="default"
              leftIcon={<Upload className="h-4 w-4" />}
              className="hidden sm:flex"
            >
              Import
            </Button>
            <Button
              variant="outline"
              size="default"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleExport}
              className="hidden sm:flex"
            >
              Export
            </Button>
            <Button
              variant="default"
              size="default"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/dashboard/customers/new')}
            >
              <span className="hidden sm:inline">Add Customer</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {!selectionMode && (
        <div className={cn(responsive.grid.cols4, "gap-4")}>
          <StatCard
            title="Total Customers"
            value={stats.total}
            icon={<Users className="h-5 w-5" />}
            loading={loading}
          />
          <StatCard
            title="Active"
            value={stats.active}
            icon={<User className="h-5 w-5" />}
            trend={{ value: 12, isPositive: true }}
            loading={loading}
          />
          <StatCard
            title="Inactive"
            value={stats.inactive}
            icon={<User className="h-5 w-5" />}
            loading={loading}
          />
          <StatCard
            title="Total Balance"
            value={formatCurrency(stats.totalBalance)}
            icon={<CreditCard className="h-5 w-5" />}
            loading={loading}
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-md">
                <SearchInput
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                  onClear={() => setSearchTerm('')}
                />
              </div>
              
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table/List */}
      <Card>
        {loading ? (
          <CardContent className="p-0">
            <TableSkeleton columns={6} rows={5} />
          </CardContent>
        ) : customers.length === 0 ? (
          <CardContent className="p-0">
            <TableEmptyState
              title={searchTerm ? "No customers found" : "No customers yet"}
              description={
                searchTerm 
                  ? "Try adjusting your search or filters"
                  : "Start by adding your first customer"
              }
              action={
                searchTerm ? (
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                ) : (
                  <Button onClick={() => navigate('/dashboard/customers/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Customer
                  </Button>
                )
              }
              icon={searchTerm ? <Search className="h-12 w-12" /> : <Users className="h-12 w-12" />}
            />
          </CardContent>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader
                      sorted={sortField === 'name' ? sortOrder : false}
                      onSort={() => handleSort('name')}
                    >
                      Customer
                    </SortableHeader>
                    <TableHead>Contact</TableHead>
                    <TableHead>Address</TableHead>
                    <SortableHeader
                      sorted={sortField === 'balance' ? sortOrder : false}
                      onSort={() => handleSort('balance')}
                    >
                      Balance
                    </SortableHeader>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow 
                      key={customer.id}
                      className={cn(
                        selectionMode && "cursor-pointer hover:bg-muted/50"
                      )}
                      onClick={() => selectionMode && onSelectCustomer?.(customer)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/20 flex items-center justify-center">
                            <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">
                              {customer.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ID: {customer.code}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{formatPhoneNumber(customer.phone)}</span>
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate max-w-[150px]">{customer.email}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="truncate max-w-[200px]">
                            {customer.city || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "font-medium",
                          customer.balance > 0 ? "text-success" : "text-muted-foreground"
                        )}>
                          {formatCurrency(customer.balance || 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={customer.status === 'active' ? 'success' : 'secondary'}
                        >
                          {customer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {!selectionMode && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <IconButton
                                variant="ghost"
                                size="icon-sm"
                                aria-label="More options"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </IconButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/dashboard/customers/${customer.id}`);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/dashboard/bookings/new?customerId=${customer.id}`);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                New Booking
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteCustomer(customer);
                                }}
                                className="text-danger focus:text-danger"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="block md:hidden p-4 space-y-4">
              {customers.map((customer) => (
                <DataCard
                  key={customer.id}
                  data={customer}
                  fields={[
                    { 
                      key: 'name', 
                      label: 'Name',
                      render: (value) => (
                        <div>
                          <p className="font-medium">{value}</p>
                          <p className="text-xs text-muted-foreground">ID: {customer.code}</p>
                        </div>
                      )
                    },
                    { 
                      key: 'phone', 
                      label: 'Phone',
                      render: (value) => value ? formatPhoneNumber(value) : 'N/A'
                    },
                    { key: 'city', label: 'City' },
                    { 
                      key: 'balance', 
                      label: 'Balance',
                      render: (value) => (
                        <span className={cn(
                          "font-medium",
                          value > 0 ? "text-success" : "text-muted-foreground"
                        )}>
                          {formatCurrency(value || 0)}
                        </span>
                      )
                    },
                    { 
                      key: 'status', 
                      label: 'Status',
                      render: (value) => (
                        <Badge variant={value === 'active' ? 'success' : 'secondary'}>
                          {value}
                        </Badge>
                      )
                    }
                  ]}
                  actions={
                    !selectionMode && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/dashboard/customers/${customer.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteCustomer(customer)}
                        >
                          Delete
                        </Button>
                      </div>
                    )
                  }
                  className={cn(
                    selectionMode && "cursor-pointer hover:border-brand-500"
                  )}
                  onClick={() => selectionMode && onSelectCustomer?.(customer)}
                />
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deleteCustomer}
        onOpenChange={(open) => !open && setDeleteCustomer(null)}
        title="Delete Customer"
        description={`Are you sure you want to delete ${deleteCustomer?.name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}