import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Building2, 
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
  Users, 
  RefreshCw,
  Filter,
  Grid3X3,
  List,
  Star,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Plus,
  Activity,
  Globe,
  Copy,
  ExternalLink,
  MessageCircle,
  CreditCard,
  TrendingUp,
  Calendar,
  User
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCustomers } from '@/hooks/useCustomers';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import CustomerForm from './CustomerForm';
import CustomerArticleRates from './CustomerArticleRates';
import CustomerDetails from './CustomerDetails';
import CustomerImport from './CustomerImport';
import CustomerExport from './CustomerExport';
import { cn } from '@/lib/utils';
import type { Customer } from '@/types';
// Removed problematic imports - will use inline components instead

// Enhanced Customer Card with Modern Design
const ModernCustomerCard: React.FC<{
  customer: Customer;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
  onViewRates: () => void;
}> = ({ customer, isSelected, onSelect, onEdit, onDelete, onViewDetails, onViewRates }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getStatusColor = (type: string) => {
    return type === 'company' ? 'from-blue-500 to-blue-600' : 'from-emerald-500 to-emerald-600';
  };

  const creditUtilization = customer.credit_limit ? 
    Math.min((customer.outstanding || 0) / customer.credit_limit * 100, 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "group relative bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden cursor-pointer",
        "hover:shadow-xl hover:shadow-blue-100/50",
        isSelected 
          ? "border-blue-500 shadow-lg shadow-blue-100/50 ring-2 ring-blue-200/50" 
          : "border-gray-100 hover:border-blue-200"
      )}
      onClick={() => onViewDetails()}
    >
      {/* Selection Indicator */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute top-4 left-4 z-10"
          >
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white opacity-50" />
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-14 w-14 ring-4 ring-white shadow-lg">
                <AvatarFallback className={cn(
                  "text-white font-bold text-lg bg-gradient-to-br",
                  getStatusColor(customer.type)
                )}>
                  {getInitials(customer.name)}
                </AvatarFallback>
              </Avatar>
              {/* Online Status Indicator */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg text-gray-900 leading-tight">
                  {customer.name}
                </h3>
                {customer.type === 'company' && (
                  <Building2 className="w-4 h-4 text-blue-500" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={customer.type === 'company' ? 'default' : 'secondary'} 
                  className="text-xs font-medium"
                >
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

          {/* Quick Actions */}
          <div className={cn(
            "flex items-center gap-2 transition-all duration-200",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(!isSelected);
                  }}
                >
                  <Checkbox checked={isSelected} className="pointer-events-none" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Select customer</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-gray-50"
                  onClick={(e) => e.stopPropagation()}
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
        </div>

        {/* Contact Information Grid */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Phone className="w-4 h-4 text-gray-600" />
            </div>
            <span className="font-medium text-gray-900">{customer.mobile}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(customer.mobile);
              }}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
          
          {customer.email && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-gray-700 truncate">{customer.email}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-auto h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`mailto:${customer.email}`);
                }}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          )}
          
          {customer.city && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-gray-700">{customer.city}</span>
            </div>
          )}
        </div>

        {/* Credit Information */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Credit Status</span>
            </div>
            <Badge 
              variant={customer.credit_status === 'Active' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {customer.credit_status || 'Active'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Credit Limit</p>
              <p className="text-lg font-bold text-gray-900">
                ₹{(customer.credit_limit || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Outstanding</p>
              <p className="text-lg font-bold text-gray-900">
                ₹{(customer.outstanding || 0).toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* Credit Utilization Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Utilization</span>
              <span>{creditUtilization.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  creditUtilization > 80 ? "bg-red-500" : 
                  creditUtilization > 60 ? "bg-yellow-500" : "bg-green-500"
                )}
                style={{ width: `${Math.min(creditUtilization, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 h-9"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
          >
            <Eye className="w-3 h-3 mr-2" />
            View
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 h-9"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit className="w-3 h-3 mr-2" />
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-9 w-9 p-0"
            onClick={(e) => {
              e.stopPropagation();
              // Open chat or message functionality
            }}
          >
            <MessageCircle className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};


// Main Component
export default function CustomerListModern() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'individual' | 'company'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'credit_limit'>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
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
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'credit_limit':
          return (b.credit_limit || 0) - (a.credit_limit || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [customers, debouncedSearchQuery, activeTab, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredAndSortedCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats calculation
  const stats = useMemo(() => {
    const total = customers.length;
    const companies = customers.filter(c => c.type === 'company').length;
    const individuals = customers.filter(c => c.type === 'individual').length;
    const totalCreditLimit = customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0);
    
    return { total, companies, individuals, totalCreditLimit };
  }, [customers]);

  const handleSelectCustomer = useCallback((customerId: string, selected: boolean) => {
    const newSelected = new Set(selectedCustomers);
    if (selected) {
      newSelected.add(customerId);
    } else {
      newSelected.delete(customerId);
    }
    setSelectedCustomers(newSelected);
  }, [selectedCustomers]);

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Apple-inspired Header */}
        <div className="bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-40">
          <div className="px-8 py-8">
            {/* Title Section */}
            <div className="flex items-center justify-between mb-8">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-display-sm font-bold text-primary tracking-tight">
                  Customer Management
                </h1>
                <p className="text-body-md text-secondary mt-2">Manage relationships and grow your business</p>
              </motion.div>
              
              {/* Enhanced Stats Cards */}
              <motion.div 
                className="hidden lg:flex items-center gap-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <motion.div 
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 min-w-[130px] backdrop-blur-sm"
                >
                  <div className="text-center">
                    <motion.p 
                      className="text-2xl font-bold text-primary tabular-nums"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {stats.total}
                    </motion.p>
                    <p className="text-caption text-tertiary font-medium">Total Customers</p>
                  </div>
                </motion.div>
                <motion.div 
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 min-w-[130px] backdrop-blur-sm"
                >
                  <div className="text-center">
                    <motion.p 
                      className="text-2xl font-bold text-primary tabular-nums"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {stats.companies}
                    </motion.p>
                    <p className="text-caption text-tertiary font-medium">Companies</p>
                  </div>
                </motion.div>
                <motion.div 
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 min-w-[130px] backdrop-blur-sm"
                >
                  <div className="text-center">
                    <motion.p 
                      className="text-2xl font-bold text-primary tabular-nums"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      ₹{(stats.totalCreditLimit / 100000).toFixed(1)}L
                    </motion.p>
                    <p className="text-caption text-tertiary font-medium">Total Credit</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Enhanced Search and Filter Bar */}
            <motion.div 
              className="flex flex-col lg:flex-row gap-6 items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Apple-style Search */}
              <div className="flex-1 w-full lg:max-w-2xl relative">
                <motion.div
                  className="absolute left-4 top-1/2 transform -translate-y-1/2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Search className="h-5 w-5 text-tertiary" />
                </motion.div>
                <Input
                  placeholder="Search customers by name, mobile, email, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-12 h-12 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-800/50 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-300 text-body-md shadow-sm"
                />
                <AnimatePresence>
                  {searchQuery && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery('')}
                        className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 haptic-light"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Enhanced Filter Tabs */}
              <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
                <TabsList className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 shadow-sm">
                  <TabsTrigger value="all" className="flex items-center gap-2 px-4 text-label-md">
                    <Users className="h-4 w-4" />
                    All ({stats.total})
                  </TabsTrigger>
                  <TabsTrigger value="company" className="flex items-center gap-2 px-4 text-label-md">
                    <Building2 className="h-4 w-4" />
                    Companies ({stats.companies})
                  </TabsTrigger>
                  <TabsTrigger value="individual" className="flex items-center gap-2 px-4 text-label-md">
                    <User className="h-4 w-4" />
                    Individuals ({stats.individuals})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Action Controls */}
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center border border-gray-200 rounded-xl p-1 bg-white/50">
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

                {/* Sort Options */}
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-44 bg-white/50">
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
                    <Button variant="outline" size="sm" className="bg-white/50">
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
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all h-10 px-6"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </div>
            </motion.div>

            {/* Selection Bar */}
            <AnimatePresence>
              {selectedCustomers.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="p-4 bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      {selectedCustomers.size} customer{selectedCustomers.size > 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="bg-white/50">
                      <Download className="h-4 w-4 mr-1" />
                      Export Selected
                    </Button>
                    <Button variant="outline" size="sm" className="bg-white/50">
                      <Edit className="h-4 w-4 mr-1" />
                      Bulk Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedCustomers(new Set())}
                      className="bg-white/50"
                    >
                      Clear Selection
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <LoadingCard key={index} className="h-96" />
              ))}
            </div>
          ) : paginatedCustomers.length === 0 ? (
            searchQuery ? (
              <NoSearchResults
                query={searchQuery}
                onClear={() => setSearchQuery('')}
                suggestions={[
                  'Check spelling and try again',
                  'Try different keywords',
                  'Use customer mobile number',
                  'Search by city name'
                ]}
              />
            ) : (
              <NoCustomers
                title="Welcome to Customer Management"
                description="Start building relationships by adding your first customer. Track their orders, manage credit limits, and grow your business."
                action={{
                  label: 'Add Your First Customer',
                  onClick: () => setShowForm(true)
                }}
              />
            )
          ) : (
            <>
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "gap-6",
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                    : "space-y-4"
                )}
              >
                {paginatedCustomers.map((customer) => (
                  <ModernCustomerCard
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

              {/* Pagination */}
              {totalPages > 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 flex items-center justify-center"
                >
                  <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="border-0"
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1 px-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'ghost'}
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
                      className="border-0"
                    >
                      Next
                    </Button>
                  </div>
                </motion.div>
              )}
            </>
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