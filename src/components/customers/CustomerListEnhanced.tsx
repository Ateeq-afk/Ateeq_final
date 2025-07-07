import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  Search, 
  Building2, 
  AlertCircle, 
  Settings, 
  MoreVertical, 
  Edit, 
  Trash, 
  UserPlus, 
  Download, 
  Upload, 
  MapPin, 
  Phone, 
  Mail, 
  Tag, 
  FileText, 
  Users, 
  RefreshCw,
  Filter,
  Grid3X3,
  List,
  Star,
  Clock,
  TrendingUp,
  Calendar,
  CreditCard,
  User,
  Zap,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Plus,
  Sparkles,
  Activity,
  BarChart3,
  Globe,
  Shield,
  Copy,
  ExternalLink,
  History,
  Bookmark,
  MessageCircle
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCustomers } from '@/hooks/useCustomers';
import { useBranches } from '@/hooks/useBranches';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import CustomerForm from './CustomerForm';
import CustomerArticleRates from './CustomerArticleRates';
import CustomerSettings from './CustomerSettings';
import CustomerImport from './CustomerImport';
import CustomerExport from './CustomerExport';
import CustomerDetails from './CustomerDetails';
import { cn } from '@/lib/utils';
import type { Customer } from '@/types';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

const cardHoverVariants = {
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 17
    }
  }
};

// Enhanced Search Component
const AdvancedSearch: React.FC<{
  value: string;
  onChange: (value: string) => void;
  customers: Customer[];
  onSuggestionSelect: (customer: Customer) => void;
}> = ({ value, onChange, customers, onSuggestionSelect }) => {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Customer[]>([]);

  useEffect(() => {
    if (value.length > 1) {
      const filtered = customers
        .filter(customer => 
          customer.name.toLowerCase().includes(value.toLowerCase()) ||
          customer.mobile.includes(value) ||
          customer.email?.toLowerCase().includes(value.toLowerCase()) ||
          customer.city?.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 5);
      setSuggestions(filtered);
      setOpen(filtered.length > 0);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  }, [value, customers]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search customers by name, mobile, email, or city..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-10 pr-4 h-11 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
          />
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => onChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-4 w-4" />
            </motion.button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandEmpty>No customers found.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-72">
              {suggestions.map((customer) => (
                <CommandItem
                  key={customer.id}
                  onSelect={() => {
                    onSuggestionSelect(customer);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">
                        {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{customer.name}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.mobile}
                        </span>
                        {customer.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {customer.city}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={customer.type === 'company' ? 'default' : 'secondary'}>
                      {customer.type}
                    </Badge>
                  </div>
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// Modern Customer Card Component
const CustomerCard: React.FC<{
  customer: Customer;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
  onViewRates: () => void;
}> = ({ customer, isSelected, onSelect, onEdit, onDelete, onViewDetails, onViewRates }) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getStatusColor = (type: string) => {
    return type === 'company' ? 'bg-blue-500' : 'bg-green-500';
  };

  return (
    <motion.div
      layout
      variants={itemVariants}
      whileHover="hover"
      className={cn(
        "group relative bg-white rounded-xl border transition-all duration-200 overflow-hidden",
        isSelected 
          ? "border-blue-500 shadow-lg shadow-blue-100 ring-1 ring-blue-500/20" 
          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      )}
    >
      <motion.div variants={cardHoverVariants}>
        <div className="p-6">
          {/* Header with Selection and Actions */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onSelect}
                  className="absolute -top-1 -left-1 z-10 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Avatar className="h-12 w-12">
                  <AvatarFallback className={cn("text-white font-semibold", getStatusColor(customer.type))}>
                    {getInitials(customer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white",
                  customer.type === 'company' ? 'bg-blue-500' : 'bg-green-500'
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {customer.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={customer.type === 'company' ? 'default' : 'secondary'} className="text-xs">
                    {customer.type === 'company' ? 'Company' : 'Individual'}
                  </Badge>
                  {customer.category && (
                    <Badge variant="outline" className="text-xs">
                      {customer.category}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onViewDetails} className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Customer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onViewRates} className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Manage Rates
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onDelete} 
                  className="flex items-center gap-2 text-red-600 focus:text-red-600"
                >
                  <Trash className="h-4 w-4" />
                  Delete Customer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Contact Information */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{customer.mobile}</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="truncate">{customer.email}</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="truncate">{customer.city || customer.address}</span>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Credit Limit</p>
              <p className="text-sm font-semibold text-gray-900">
                ₹{customer.credit_limit?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <Badge 
                variant={customer.credit_status === 'Active' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {customer.credit_status || 'Active'}
              </Badge>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="outline" className="flex-1 h-8" onClick={onViewDetails}>
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button size="sm" variant="outline" className="flex-1 h-8" onClick={onEdit}>
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
              <MessageCircle className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Enhanced Loading Skeleton
const CustomerCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
      <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
    </div>
    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
      <div className="h-8 bg-gray-200 rounded animate-pulse" />
      <div className="h-8 bg-gray-200 rounded animate-pulse" />
    </div>
  </div>
);

// Main Component
export default function CustomerListEnhanced() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'individual' | 'company'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'credit_limit'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  
  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showDetails, setShowDetails] = useState<Customer | null>(null);
  const [showRates, setShowRates] = useState<Customer | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { customers, loading, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { showSuccess, showError } = useNotificationSystem();

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers.filter(customer => {
      const matchesSearch = !debouncedSearchQuery || 
        customer.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        customer.mobile.includes(debouncedSearchQuery) ||
        customer.email?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        customer.city?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      const matchesTab = activeTab === 'all' || customer.type === activeTab;
      
      return matchesSearch && matchesTab;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'credit_limit':
          comparison = (a.credit_limit || 0) - (b.credit_limit || 0);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [customers, debouncedSearchQuery, activeTab, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredAndSortedCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedCustomers(new Set(paginatedCustomers.map(c => c.id)));
    } else {
      setSelectedCustomers(new Set());
    }
  }, [paginatedCustomers]);

  const handleSelectCustomer = useCallback((customerId: string, selected: boolean) => {
    const newSelected = new Set(selectedCustomers);
    if (selected) {
      newSelected.add(customerId);
    } else {
      newSelected.delete(customerId);
    }
    setSelectedCustomers(newSelected);
  }, [selectedCustomers]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = customers.length;
    const companies = customers.filter(c => c.type === 'company').length;
    const individuals = customers.filter(c => c.type === 'individual').length;
    const totalCreditLimit = customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0);
    
    return { total, companies, individuals, totalCreditLimit };
  }, [customers]);

  const handleSuggestionSelect = (customer: Customer) => {
    setShowDetails(customer);
  };

  const handleCreateCustomer = async (data: any) => {
    try {
      await createCustomer(data);
      setShowForm(false);
      showSuccess('Customer Created', 'Customer has been successfully created');
    } catch (error) {
      showError('Error', 'Failed to create customer');
    }
  };

  const handleUpdateCustomer = async (data: any) => {
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, data);
        setEditingCustomer(null);
        setShowForm(false);
        showSuccess('Customer Updated', 'Customer has been successfully updated');
      }
    } catch (error) {
      showError('Error', 'Failed to update customer');
    }
  };

  const handleDeleteCustomer = async () => {
    try {
      if (customerToDelete) {
        await deleteCustomer(customerToDelete.id);
        setCustomerToDelete(null);
        showSuccess('Customer Deleted', 'Customer has been successfully deleted');
      }
    } catch (error) {
      showError('Error', 'Failed to delete customer');
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
        {/* Enhanced Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40"
        >
          <div className="px-6 py-6">
            {/* Title and Stats */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                  Customer Management
                </h1>
                <p className="text-gray-600 mt-1">Manage your customer relationships and data</p>
              </div>
              
              {/* Quick Stats */}
              <div className="hidden lg:flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-500">Total Customers</p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.companies}</p>
                  <p className="text-xs text-gray-500">Companies</p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.individuals}</p>
                  <p className="text-xs text-gray-500">Individuals</p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">₹{(stats.totalCreditLimit / 100000).toFixed(1)}L</p>
                  <p className="text-xs text-gray-500">Total Credit</p>
                </div>
              </div>
            </div>

            {/* Search and Actions Bar */}
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Enhanced Search */}
              <div className="flex-1 w-full lg:max-w-md">
                <AdvancedSearch
                  value={searchQuery}
                  onChange={setSearchQuery}
                  customers={customers}
                  onSuggestionSelect={handleSuggestionSelect}
                />
              </div>

              {/* Filter Tabs */}
              <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    All ({stats.total})
                  </TabsTrigger>
                  <TabsTrigger value="company" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Companies ({stats.companies})
                  </TabsTrigger>
                  <TabsTrigger value="individual" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Individuals ({stats.individuals})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center border border-gray-200 rounded-lg p-1 bg-white">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Sort by Name</SelectItem>
                    <SelectItem value="created_at">Sort by Date</SelectItem>
                    <SelectItem value="credit_limit">Sort by Credit</SelectItem>
                  </SelectContent>
                </Select>

                {/* More Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowImport(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Customers
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowExport(true)}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Customers
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Data
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Primary Action */}
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </div>
            </div>

            {/* Selection Bar */}
            <AnimatePresence>
              {selectedCustomers.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      {selectedCustomers.size} customer{selectedCustomers.size > 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export Selected
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Bulk Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedCustomers(new Set())}>
                      Clear Selection
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="p-6">
          {loading ? (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {Array.from({ length: 8 }).map((_, index) => (
                <CustomerCardSkeleton key={index} />
              ))}
            </motion.div>
          ) : paginatedCustomers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="max-w-md mx-auto">
                <div className="h-24 w-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first customer'}
                </p>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Your First Customer
                </Button>
              </div>
            </motion.div>
          ) : (
            <LayoutGroup>
              <motion.div
                layout
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={cn(
                  "gap-6",
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                    : "space-y-4"
                )}
              >
                {paginatedCustomers.map((customer) => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    isSelected={selectedCustomers.has(customer.id)}
                    onSelect={(selected) => handleSelectCustomer(customer.id, selected)}
                    onEdit={() => {
                      setEditingCustomer(customer);
                      setShowForm(true);
                    }}
                    onDelete={() => setCustomerToDelete(customer)}
                    onViewDetails={() => setShowDetails(customer)}
                    onViewRates={() => setShowRates(customer)}
                  />
                ))}
              </motion.div>
            </LayoutGroup>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex items-center justify-between"
            >
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Showing</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="48">48</SelectItem>
                  </SelectContent>
                </Select>
                <span>of {filteredAndSortedCustomers.length} customers</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Modals */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </DialogTitle>
            </DialogHeader>
            <CustomerForm
              customer={editingCustomer}
              onSubmit={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}
              onCancel={() => {
                setShowForm(false);
                setEditingCustomer(null);
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={!!showDetails} onOpenChange={() => setShowDetails(null)}>
          <DialogContent className="max-w-4xl">
            {showDetails && (
              <CustomerDetails
                customer={showDetails}
                onClose={() => setShowDetails(null)}
                onEdit={() => {
                  setEditingCustomer(showDetails);
                  setShowDetails(null);
                  setShowForm(true);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!showRates} onOpenChange={() => setShowRates(null)}>
          <DialogContent className="max-w-6xl">
            {showRates && (
              <CustomerArticleRates
                customerId={showRates.id}
                customerName={showRates.name}
                onClose={() => setShowRates(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showImport} onOpenChange={setShowImport}>
          <DialogContent>
            <CustomerImport onClose={() => setShowImport(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={showExport} onOpenChange={setShowExport}>
          <DialogContent>
            <CustomerExport onClose={() => setShowExport(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Customer</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600">
                Are you sure you want to delete <strong>{customerToDelete?.name}</strong>? 
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCustomerToDelete(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteCustomer}>
                Delete Customer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}