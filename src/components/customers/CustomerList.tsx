import React, { useState, useEffect } from 'react';
import { Plus, Search, Building2, AlertCircle, Settings, MoreVertical, AlertTriangle, Package, Edit, Trash, UserPlus, Filter, Download, Upload, MapPin, Phone, Mail, Tag, FileText, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomers } from '@/hooks/useCustomers';
import { useBranches } from '@/hooks/useBranches';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import CustomerForm from './CustomerForm';
import CustomerArticleRates from './CustomerArticleRates';
import CustomerSettings from './CustomerSettings';
import CustomerImport from './CustomerImport';
import CustomerExport from './CustomerExport';
import CustomerDetails from './CustomerDetails';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function CustomerList() {
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showRates, setShowRates] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'individual' | 'company'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { customers, loading, error, createCustomer, updateCustomer, deleteCustomer, refresh } = useCustomers();
  const { branches } = useBranches();
  const { showSuccess, showError } = useNotificationSystem();

  // Apply filters and sorting
  const filteredCustomers = React.useMemo(() => {
    return customers.filter(customer => {
      // Search filter
      const matchesSearch = 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.mobile.includes(searchQuery) ||
        (customer.gst && customer.gst.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Type filter
      const matchesType = activeTab === 'all' || customer.type === activeTab;
      
      // Branch filter
      const matchesBranch = branchFilter === 'all' || customer.branch_id === branchFilter;
      
      return matchesSearch && matchesType && matchesBranch;
    }).sort((a, b) => {
      // Sorting
      if (sortField === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortField === 'mobile') {
        return sortDirection === 'asc'
          ? a.mobile.localeCompare(b.mobile)
          : b.mobile.localeCompare(a.mobile);
      } else if (sortField === 'created_at') {
        return sortDirection === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });
  }, [customers, searchQuery, activeTab, branchFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreateCustomer = async (data) => {
    try {
      await createCustomer(data);
      setShowForm(false);
      showSuccess('Customer Created', 'Customer has been successfully created');
    } catch (err) {
      console.error('Failed to create customer:', err);
      showError('Creation Failed', err.message || 'Failed to create customer');
    }
  };

  const handleUpdateCustomer = async (data) => {
    if (!editingCustomer) return;
    
    try {
      await updateCustomer(editingCustomer.id, data);
      setEditingCustomer(null);
      setShowForm(false);
      setShowSettings(null);
      showSuccess('Customer Updated', 'Customer details have been updated successfully');
    } catch (err) {
      console.error('Failed to update customer:', err);
      showError('Update Failed', err.message || 'Failed to update customer');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      setDeleteError(null);
      await deleteCustomer(customerToDelete);
      setCustomerToDelete(null);
      showSuccess('Customer Deleted', 'Customer has been deleted successfully');
    } catch (err) {
      console.error('Failed to delete customer:', err);
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete customer');
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRefresh = async () => {
    try {
      await refresh();
      showSuccess('Refreshed', 'Customer list has been refreshed');
    } catch (err) {
      showError('Refresh Failed', 'Failed to refresh customer list');
    }
  };

  const handleImportSuccess = () => {
    setShowImport(false);
    refresh();
    showSuccess('Import Successful', 'Customers have been imported successfully');
  };

  const handleExportSuccess = () => {
    setShowExport(false);
    showSuccess('Export Successful', 'Customers have been exported successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-blue-600">
          <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
          <span>Loading customers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load customers. Please try again.</span>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-3xl mx-auto">
          <CustomerForm
            onSubmit={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}
            onCancel={() => {
              setShowForm(false);
              setEditingCustomer(null);
            }}
            initialData={editingCustomer || undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
          <p className="text-gray-600 mt-1">
            {filteredCustomers.length} customers found
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowImport(true)} className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={() => setShowExport(true)} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Customer
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search customers by name, mobile, or GST..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name} - {branch.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'individual' | 'company')}>
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                <TabsTrigger value="individual" className="flex-1">Individual</TabsTrigger>
                <TabsTrigger value="company" className="flex-1">Company</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th 
                  className="text-left text-sm font-medium text-gray-600 px-6 py-4 cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Name
                    {sortField === 'name' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-left text-sm font-medium text-gray-600 px-6 py-4 cursor-pointer"
                  onClick={() => handleSort('mobile')}
                >
                  <div className="flex items-center gap-2">
                    Mobile
                    {sortField === 'mobile' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">GST Number</th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Type</th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Branch</th>
                <th className="text-right text-sm font-medium text-gray-600 px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center ${
                        customer.type === 'individual' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-purple-100 text-purple-600'
                      }`}>
                        {customer.type === 'individual' ? (
                          <Users className="h-5 w-5" />
                        ) : (
                          <Building2 className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <span 
                          className="font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                          onClick={() => setShowDetails(customer.id)}
                        >
                          {customer.name}
                        </span>
                        {customer.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Mail className="h-3 w-3" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{customer.mobile}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {customer.gst ? (
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span>{customer.gst}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      customer.type === 'individual'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {customer.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {customer.branch_name ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{customer.branch_name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRates(customer.id)}
                        className="flex items-center gap-1"
                      >
                        <Tag className="h-4 w-4" />
                        <span className="hidden sm:inline">Rates</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCustomer(customer);
                          setShowSettings(customer.id);
                        }}
                        className="flex items-center gap-1"
                      >
                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline">Settings</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setShowDetails(customer.id)}>
                            <Users className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setEditingCustomer(customer);
                            setShowForm(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Customer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => setCustomerToDelete(customer.id)}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete Customer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {searchQuery || activeTab !== 'all' || branchFilter !== 'all' ? (
                      <>
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No matching customers</h3>
                        <p className="text-gray-600 mt-1">Try adjusting your search or filters</p>
                      </>
                    ) : (
                      <>
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No customers found</h3>
                        <p className="text-gray-600 mt-1">Add your first customer to get started</p>
                        <Button onClick={() => setShowForm(true)} className="mt-4">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Customer
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredCustomers.length)}
              </span>{' '}
              of <span className="font-medium">{filteredCustomers.length}</span> customers
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!customerToDelete} onOpenChange={() => {
        setCustomerToDelete(null);
        setDeleteError(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          
          {deleteError ? (
            <div className="flex items-start gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{deleteError}</span>
            </div>
          ) : (
            <div className="text-gray-600">
              Are you sure you want to delete this customer? This action cannot be undone.
            </div>
          )}
          
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setCustomerToDelete(null);
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>
            {!deleteError && (
              <Button 
                onClick={() => handleDeleteCustomer()}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Article Rates Dialog */}
      <Dialog open={!!showRates} onOpenChange={() => setShowRates(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Article Rates</DialogTitle>
          </DialogHeader>
          {showRates && (
            <CustomerArticleRates
              customer={customers.find(c => c.id === showRates)!}
              onClose={() => setShowRates(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={!!showSettings} onOpenChange={() => setShowSettings(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Settings</DialogTitle>
          </DialogHeader>
          {showSettings && (
            <CustomerSettings
              customer={customers.find(c => c.id === showSettings)!}
              onClose={() => setShowSettings(null)}
              onUpdate={handleUpdateCustomer}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Customer Details Dialog */}
      <Dialog open={!!showDetails} onOpenChange={() => setShowDetails(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {showDetails && (
            <CustomerDetails
              customer={customers.find(c => c.id === showDetails)!}
              onClose={() => setShowDetails(null)}
              onEdit={() => {
                setEditingCustomer(customers.find(c => c.id === showDetails)!);
                setShowDetails(null);
                setShowForm(true);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Customers</DialogTitle>
          </DialogHeader>
          <CustomerImport
            onClose={() => setShowImport(false)}
            onSuccess={handleImportSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Customers</DialogTitle>
          </DialogHeader>
          <CustomerExport
            customers={filteredCustomers}
            onClose={() => setShowExport(false)}
            onSuccess={handleExportSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}