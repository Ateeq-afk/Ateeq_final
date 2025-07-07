import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Calendar,
  Search,
  Filter,
  Plus,
  Download,
  Send,
  Eye,
  MoreVertical,
  RefreshCw,
  X,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Building2,
  Grid3X3,
  List,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  Activity,
  Zap,
  Package,
  CreditCard,
  Users,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  Ban
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { invoiceService, Invoice } from '@/services/invoices';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import InvoiceGenerator from './InvoiceGenerator';
import { useToast } from '@/hooks/use-toast';

// Mock data for demonstration
const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoice_number: 'INV-MUM-2407-001234',
    customer_id: 'cust-1',
    organization_id: 'org-1',
    branch_id: 'branch-1',
    from_date: '2024-07-01',
    to_date: '2024-07-07',
    subtotal: 45000,
    cgst: 4050,
    sgst: 4050,
    igst: 0,
    total_tax: 8100,
    grand_total: 53100,
    status: 'generated',
    created_at: '2024-07-07T10:30:00Z',
    updated_at: '2024-07-07T10:30:00Z',
    customer: {
      id: 'cust-1',
      name: 'Acme Electronics Pvt Ltd',
      mobile: '+91 98765 43210',
      email: 'billing@acmeelectronics.com'
    },
    invoice_items: [{ count: 8 }]
  },
  {
    id: '2',
    invoice_number: 'INV-MUM-2407-001235',
    customer_id: 'cust-2',
    organization_id: 'org-1',
    branch_id: 'branch-1',
    from_date: '2024-07-01',
    to_date: '2024-07-15',
    subtotal: 28500,
    cgst: 0,
    sgst: 0,
    igst: 5130,
    total_tax: 5130,
    grand_total: 33630,
    status: 'sent',
    sent_at: '2024-07-07T14:20:00Z',
    created_at: '2024-07-07T11:45:00Z',
    updated_at: '2024-07-07T14:20:00Z',
    customer: {
      id: 'cust-2',
      name: 'Global Textiles Ltd',
      mobile: '+91 97654 32109',
      email: 'accounts@globaltextiles.com'
    },
    invoice_items: [{ count: 12 }]
  },
  {
    id: '3',
    invoice_number: 'INV-MUM-2407-001236',
    customer_id: 'cust-3',
    organization_id: 'org-1',
    branch_id: 'branch-1',
    from_date: '2024-06-20',
    to_date: '2024-06-30',
    subtotal: 67200,
    cgst: 6048,
    sgst: 6048,
    igst: 0,
    total_tax: 12096,
    grand_total: 79296,
    status: 'paid',
    paid_at: '2024-07-05T09:15:00Z',
    payment_reference: 'UTR123456789',
    created_at: '2024-07-01T16:00:00Z',
    updated_at: '2024-07-05T09:15:00Z',
    customer: {
      id: 'cust-3',
      name: 'Industrial Components Co',
      mobile: '+91 96543 21098',
      email: 'finance@industrialcomp.com'
    },
    invoice_items: [{ count: 15 }]
  }
];

const mockStats = {
  totalInvoices: 24,
  totalAmount: 1256780,
  paidAmount: 945230,
  pendingAmount: 311550,
  thisMonthInvoices: 8,
  thisMonthAmount: 387650,
  averageInvoiceValue: 52365,
  paymentRate: 75.2
};

export default function InvoiceDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'generator'>('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  const { getCurrentUserBranch } = useAuth();
  const { selectedBranch } = useBranchSelection();
  const { toast } = useToast();

  const effectiveBranchId = selectedBranch?.id || selectedBranch || getCurrentUserBranch()?.id;

  // Load invoices
  const loadInvoices = async () => {
    setLoading(true);
    try {
      const response = await invoiceService.getInvoices({
        page: 1,
        limit: 50,
        status: filterStatus !== 'all' ? filterStatus : undefined
      });
      setInvoices(response.data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
      // Use mock data as fallback
      setInvoices(mockInvoices);
      toast({
        title: 'Error',
        description: 'Failed to load invoices. Using sample data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveBranchId) {
      loadInvoices();
    }
  }, [effectiveBranchId, filterStatus]);

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer?.mobile.includes(searchQuery);
    
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    
    // Date range filter
    let matchesDateRange = true;
    if (filterDateRange !== 'all') {
      const invoiceDate = new Date(invoice.created_at);
      const today = new Date();
      
      switch (filterDateRange) {
        case 'today':
          matchesDateRange = invoiceDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDateRange = invoiceDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDateRange = invoiceDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generated': return FileText;
      case 'sent': return Send;
      case 'paid': return CheckCircle2;
      case 'cancelled': return Ban;
      default: return FileText;
    }
  };

  const downloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const blob = await invoiceService.downloadInvoicePDF(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: 'Invoice downloaded successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download invoice',
        variant: 'destructive'
      });
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, status: string) => {
    try {
      await invoiceService.updateInvoiceStatus(invoiceId, status);
      await loadInvoices();
      toast({
        title: 'Success',
        description: 'Invoice status updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update invoice status',
        variant: 'destructive'
      });
    }
  };

  const OverviewTab = () => (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl p-6"
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{mockStats.totalInvoices}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Invoices</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-green-500" />
            <span className="text-green-600 dark:text-green-400 text-sm font-medium">+{mockStats.thisMonthInvoices} this month</span>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl p-6"
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ₹{(mockStats.totalAmount / 100000).toFixed(1)}L
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-green-600 dark:text-green-400 text-sm font-medium">₹{(mockStats.thisMonthAmount / 1000).toFixed(0)}K this month</span>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl p-6"
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ₹{(mockStats.pendingAmount / 100000).toFixed(1)}L
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <span className="text-orange-600 dark:text-orange-400 text-sm font-medium">{100 - mockStats.paymentRate}% unpaid</span>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl p-6"
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ₹{(mockStats.averageInvoiceValue / 1000).toFixed(0)}K
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Average Value</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">{mockStats.paymentRate}% payment rate</span>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl border-gray-200/30 dark:border-gray-700/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Recent Invoices
            </CardTitle>
            <CardDescription>Latest invoice generation activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredInvoices.slice(0, 5).map((invoice) => {
              const StatusIcon = getStatusIcon(invoice.status);
              return (
                <div key={invoice.id} className="flex items-center gap-4 p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${invoiceService.getStatusColor(invoice.status)}`}>
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {invoice.invoice_number}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {invoice.customer?.name} • {invoiceService.formatCurrency(invoice.grand_total)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={`${invoiceService.getStatusColor(invoice.status)} border-none text-xs`}>
                      {invoice.status.toUpperCase()}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">
                      {invoiceService.formatDate(invoice.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl border-gray-200/30 dark:border-gray-700/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Payment Status
            </CardTitle>
            <CardDescription>Invoice payment distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50/50 dark:bg-green-900/20 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Paid</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    ₹{(mockStats.paidAmount / 100000).toFixed(1)}L
                  </p>
                  <p className="text-xs text-gray-500">{mockStats.paymentRate}%</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-orange-50/50 dark:bg-orange-900/20 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Pending</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    ₹{(mockStats.pendingAmount / 100000).toFixed(1)}L
                  </p>
                  <p className="text-xs text-gray-500">{(100 - mockStats.paymentRate).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const InvoiceCard = ({ invoice }: { invoice: Invoice }) => {
    const StatusIcon = getStatusIcon(invoice.status);
    const isSelected = selectedInvoices.includes(invoice.id);
    
    return (
      <motion.div
        className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl overflow-hidden group cursor-pointer transition-all duration-300 ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3 }}
        onClick={() => {
          if (isSelected) {
            setSelectedInvoices(prev => prev.filter(id => id !== invoice.id));
          } else {
            setSelectedInvoices(prev => [...prev, invoice.id]);
          }
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${invoiceService.getStatusColor(invoice.status)}`}>
                <StatusIcon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {invoice.invoice_number}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {invoiceService.formatDate(invoice.created_at)}
                </p>
              </div>
            </div>
            <Badge className={`${invoiceService.getStatusColor(invoice.status)} border-none`}>
              {invoice.status.toUpperCase()}
            </Badge>
          </div>

          {/* Customer Info */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {invoice.customer?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Customer</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {invoice.customer?.mobile}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {invoiceService.formatDate(invoice.from_date)} - {invoiceService.formatDate(invoice.to_date)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Billing Period</p>
              </div>
            </div>
          </div>

          {/* Amount Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {invoice.invoice_items?.[0]?.count || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Items
              </p>
            </div>
            <div className="text-center p-3 bg-green-50/50 dark:bg-green-900/20 rounded-2xl">
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {invoiceService.formatCurrency(invoice.grand_total)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Total
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              onClick={(e) => {
                e.stopPropagation();
                downloadInvoice(invoice.id, invoice.invoice_number);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Hover Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </motion.div>
    );
  };

  const InvoicesTab = () => (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            className="pl-12 pr-12 bg-white/50 dark:bg-gray-700/50 border-gray-200/30 dark:border-gray-600/30 rounded-2xl h-12"
            placeholder="Search by invoice number, customer name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-white/50 dark:bg-gray-700/50 border-gray-200/30 dark:border-gray-600/30 rounded-2xl h-12">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="generated">Generated</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterDateRange} onValueChange={setFilterDateRange}>
          <SelectTrigger className="w-40 bg-white/50 dark:bg-gray-700/50 border-gray-200/30 dark:border-gray-600/30 rounded-2xl h-12">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-xl h-12 px-4"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-xl h-12 px-4"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <Button
          onClick={() => setActiveTab('generator')}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 px-6"
        >
          <Plus className="h-4 w-4 mr-2" />
          Generate Invoice
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedInvoices.length > 0 && (
        <motion.div
          className="bg-blue-50/50 dark:bg-blue-900/20 backdrop-blur-sm rounded-2xl border border-blue-200/30 dark:border-blue-800/30 p-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {selectedInvoices.length} invoice{selectedInvoices.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="rounded-xl">
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl">
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-xl"
                onClick={() => setSelectedInvoices([])}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Invoices Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </motion.div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {filteredInvoices.map((invoice, index) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <InvoiceCard invoice={invoice} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {filteredInvoices.map((invoice, index) => (
                <motion.div
                  key={invoice.id}
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-2xl border border-gray-200/30 dark:border-gray-700/30 shadow-xl p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${invoiceService.getStatusColor(invoice.status)}`}>
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {invoice.invoice_number}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {invoice.customer?.name} • {invoiceService.formatDate(invoice.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {invoice.invoice_items?.[0]?.count || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Items</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {invoiceService.formatCurrency(invoice.grand_total)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                      </div>

                      <Badge className={`${invoiceService.getStatusColor(invoice.status)} border-none`}>
                        {invoice.status.toUpperCase()}
                      </Badge>

                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="rounded-xl"
                          onClick={() => downloadInvoice(invoice.id, invoice.invoice_number)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {filteredInvoices.length === 0 && !loading && (
        <motion.div
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl p-16 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FileText className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            No Invoices Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {searchQuery || filterStatus !== 'all' || filterDateRange !== 'all'
              ? 'Try adjusting your filters to see more results.'
              : 'No invoices have been generated yet. Create your first invoice to get started.'}
          </p>
          <Button 
            onClick={() => setActiveTab('generator')}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 py-3"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate First Invoice
          </Button>
        </motion.div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-black dark:to-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                Invoice Management
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                Generate, manage and track customer invoices with automated GST calculations.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={loadInvoices}
                variant="outline"
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl border-gray-200/30 dark:border-gray-700/30 hover:bg-white dark:hover:bg-gray-800 rounded-2xl px-6 py-3"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div 
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="p-3">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid grid-cols-3 w-full bg-gray-100/50 dark:bg-gray-900/50 rounded-2xl">
                <TabsTrigger 
                  value="overview" 
                  className="py-4 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-xl rounded-2xl transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5" />
                    <span className="font-medium">Overview</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="invoices" 
                  className="py-4 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-xl rounded-2xl transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5" />
                    <span className="font-medium">Invoices</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="generator" 
                  className="py-4 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-xl rounded-2xl transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5" />
                    <span className="font-medium">Generate</span>
                  </div>
                </TabsTrigger>
              </TabsList>

              <div className="p-8">
                <TabsContent value="overview" className="mt-0">
                  <OverviewTab />
                </TabsContent>
                
                <TabsContent value="invoices" className="mt-0">
                  <InvoicesTab />
                </TabsContent>
                
                <TabsContent value="generator" className="mt-0">
                  <InvoiceGenerator onInvoiceGenerated={loadInvoices} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </div>
  );
}