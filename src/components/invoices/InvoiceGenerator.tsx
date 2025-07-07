import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Calendar,
  FileText,
  Calculator,
  Send,
  Download,
  Search,
  Phone,
  Mail,
  MapPin,
  Building2,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  RefreshCw,
  X,
  Eye,
  Zap,
  Settings,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { invoiceService, InvoiceFilters, InvoicePreview } from '@/services/invoices';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
}

// Mock customer data
const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Acme Electronics Pvt Ltd',
    mobile: '+91 98765 43210',
    email: 'billing@acmeelectronics.com',
    address: '123 Industrial Area, Sector 15',
    city: 'Mumbai',
    state: 'Maharashtra',
    gstin: '27AAAAA0000A1Z5'
  },
  {
    id: 'cust-2',
    name: 'Global Textiles Ltd',
    mobile: '+91 97654 32109',
    email: 'accounts@globaltextiles.com',
    address: '456 Textile Park, Phase 2',
    city: 'Chennai',
    state: 'Tamil Nadu',
    gstin: '33BBBBB1111B2Z6'
  },
  {
    id: 'cust-3',
    name: 'Industrial Components Co',
    mobile: '+91 96543 21098',
    email: 'finance@industrialcomp.com',
    address: '789 Component Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    gstin: '27CCCCC2222C3Z7'
  },
  {
    id: 'cust-4',
    name: 'Tech Solutions Inc',
    mobile: '+91 95432 10987',
    email: 'payments@techsolutions.com',
    address: '321 Software Complex',
    city: 'Bangalore',
    state: 'Karnataka',
    gstin: '29DDDDD3333D4Z8'
  }
];

interface InvoiceGeneratorProps {
  onInvoiceGenerated: () => void;
}

export default function InvoiceGenerator({ onInvoiceGenerated }: InvoiceGeneratorProps) {
  const [step, setStep] = useState<'selection' | 'preview' | 'generated'>('selection');
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(mockCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [includeDeliveredOnly, setIncludeDeliveredOnly] = useState(false);
  const [includePaidBookings, setIncludePaidBookings] = useState(false);
  const [preview, setPreview] = useState<InvoicePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);

  const { toast } = useToast();
  const { getCurrentUserBranch } = useAuth();
  const { selectedBranch } = useBranchSelection();

  const effectiveBranchId = selectedBranch?.id || selectedBranch || getCurrentUserBranch()?.id;

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setToDate(today.toISOString().split('T')[0]);
    setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // Filter customers based on search
  useEffect(() => {
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.mobile.includes(searchQuery) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [searchQuery, customers]);

  const handlePreview = async () => {
    if (!selectedCustomer) {
      toast({
        title: 'Error',
        description: 'Please select a customer',
        variant: 'destructive'
      });
      return;
    }

    if (!fromDate || !toDate) {
      toast({
        title: 'Error',
        description: 'Please select date range',
        variant: 'destructive'
      });
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      toast({
        title: 'Error',
        description: 'From date cannot be later than To date',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const filters: InvoiceFilters = {
        customer_id: selectedCustomer.id,
        from_date: fromDate,
        to_date: toDate,
        include_delivered_only: includeDeliveredOnly,
        include_paid_bookings: includePaidBookings
      };

      const previewData = await invoiceService.previewInvoice(filters);
      setPreview(previewData);
      setStep('preview');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate preview',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!preview) return;

    setGenerating(true);
    try {
      const filters: InvoiceFilters = {
        customer_id: selectedCustomer!.id,
        from_date: fromDate,
        to_date: toDate,
        include_delivered_only: includeDeliveredOnly,
        include_paid_bookings: includePaidBookings
      };

      const result = await invoiceService.generateInvoice(filters);
      setGeneratedInvoice(result);
      setStep('generated');
      onInvoiceGenerated();
      
      toast({
        title: 'Success',
        description: 'Invoice generated and sent successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate invoice',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setStep('selection');
    setSelectedCustomer(null);
    setPreview(null);
    setGeneratedInvoice(null);
    setSearchQuery('');
  };

  const CustomerCard = ({ customer }: { customer: Customer }) => (
    <motion.div
      className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
        selectedCustomer?.id === customer.id
          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
          : 'border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-600 bg-white/50 dark:bg-gray-800/50'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setSelectedCustomer(customer)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {customer.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {customer.city}, {customer.state}
            </p>
          </div>
        </div>
        {selectedCustomer?.id === customer.id && (
          <CheckCircle2 className="h-5 w-5 text-blue-600" />
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Phone className="h-3 w-3" />
          <span>{customer.mobile}</span>
        </div>
        {customer.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Mail className="h-3 w-3" />
            <span>{customer.email}</span>
          </div>
        )}
        {customer.gstin && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Building2 className="h-3 w-3" />
            <span>GSTIN: {customer.gstin}</span>
          </div>
        )}
      </div>
    </motion.div>
  );

  const SelectionStep = () => (
    <div className="space-y-8">
      {/* Customer Selection */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl border-gray-200/30 dark:border-gray-700/30 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Select Customer
          </CardTitle>
          <CardDescription>
            Choose the customer to generate invoice for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              className="pl-12 pr-12 bg-white/50 dark:bg-gray-700/50 border-gray-200/30 dark:border-gray-600/30 rounded-xl h-12"
              placeholder="Search customers by name, phone, email, or city..."
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

          {/* Customer List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {filteredCustomers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No customers found matching your search</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date Range Selection */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl border-gray-200/30 dark:border-gray-700/30 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Billing Period
          </CardTitle>
          <CardDescription>
            Select the date range for invoice generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="from-date">From Date</Label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-white/50 dark:bg-gray-700/50 border-gray-200/30 dark:border-gray-600/30 rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date">To Date</Label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-white/50 dark:bg-gray-700/50 border-gray-200/30 dark:border-gray-600/30 rounded-xl h-12"
              />
            </div>
          </div>

          {/* Quick Date Ranges */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                const today = new Date();
                const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                setFromDate(lastWeek.toISOString().split('T')[0]);
                setToDate(today.toISOString().split('T')[0]);
              }}
            >
              Last 7 Days
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                setFromDate(lastMonth.toISOString().split('T')[0]);
                setToDate(today.toISOString().split('T')[0]);
              }}
            >
              Last 30 Days
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                const today = new Date();
                const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                setFromDate(firstDayOfMonth.toISOString().split('T')[0]);
                setToDate(today.toISOString().split('T')[0]);
              }}
            >
              This Month
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Options */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl border-gray-200/30 dark:border-gray-700/30 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-green-600 dark:text-green-400" />
            Invoice Options
          </CardTitle>
          <CardDescription>
            Configure invoice generation settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="delivered-only"
              checked={includeDeliveredOnly}
              onCheckedChange={setIncludeDeliveredOnly}
            />
            <Label htmlFor="delivered-only" className="text-sm font-medium">
              Include only delivered bookings
            </Label>
          </div>
          
          <div className="flex items-center space-x-3">
            <Checkbox
              id="include-paid"
              checked={includePaidBookings}
              onCheckedChange={setIncludePaidBookings}
            />
            <Label htmlFor="include-paid" className="text-sm font-medium">
              Include already paid bookings
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Preview Button */}
      <div className="flex justify-center">
        <Button
          onClick={handlePreview}
          disabled={!selectedCustomer || !fromDate || !toDate || loading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl px-8 py-3 text-lg"
        >
          {loading ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Generating Preview...
            </>
          ) : (
            <>
              <Eye className="h-5 w-5 mr-2" />
              Preview Invoice
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const PreviewStep = () => {
    if (!preview) return null;

    return (
      <div className="space-y-8">
        {/* Preview Header */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl border-gray-200/30 dark:border-gray-700/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Invoice Preview
            </CardTitle>
            <CardDescription>
              Review the invoice details before generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer</Label>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {preview.customer.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {preview.customer.mobile}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Period</Label>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {new Date(preview.summary.date_range.from).toLocaleDateString('en-IN')} - {new Date(preview.summary.date_range.to).toLocaleDateString('en-IN')}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {preview.summary.total_bookings} booking{preview.summary.total_bookings !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</Label>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {invoiceService.formatCurrency(preview.summary.amounts.grand_total)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {preview.summary.interstate ? 'Interstate (IGST)' : 'Intrastate (CGST + SGST)'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amount Breakdown */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl border-gray-200/30 dark:border-gray-700/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Calculator className="h-5 w-5 text-green-600 dark:text-green-400" />
              Amount Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700 dark:text-gray-300">Subtotal</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {invoiceService.formatCurrency(preview.summary.amounts.subtotal)}
                </span>
              </div>
              
              {preview.summary.amounts.cgst > 0 && (
                <>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 dark:text-gray-300">CGST (9%)</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {invoiceService.formatCurrency(preview.summary.amounts.cgst)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 dark:text-gray-300">SGST (9%)</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {invoiceService.formatCurrency(preview.summary.amounts.sgst)}
                    </span>
                  </div>
                </>
              )}
              
              {preview.summary.amounts.igst > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700 dark:text-gray-300">IGST (18%)</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {invoiceService.formatCurrency(preview.summary.amounts.igst)}
                  </span>
                </div>
              )}
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Grand Total</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {invoiceService.formatCurrency(preview.summary.amounts.grand_total)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Items */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl border-gray-200/30 dark:border-gray-700/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Booking Items ({preview.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {preview.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {item.lr_number}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.from_station} → {item.to_station}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(item.booking_date).toLocaleDateString('en-IN')} • {item.articles} articles • {item.weight.toFixed(1)} kg
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {invoiceService.formatCurrency(item.total_amount)}
                    </p>
                    <Badge className={`text-xs ${item.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => setStep('selection')}
            variant="outline"
            className="rounded-2xl px-6 py-3"
          >
            <X className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl px-8 py-3"
          >
            {generating ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Generating Invoice...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Generate & Send Invoice
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  const GeneratedStep = () => {
    if (!generatedInvoice) return null;

    return (
      <div className="space-y-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Invoice Generated Successfully!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">
            Invoice {generatedInvoice.invoice_number} has been created and sent to the customer.
          </p>
        </motion.div>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl border-gray-200/30 dark:border-gray-700/30 shadow-2xl">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Invoice Number</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {generatedInvoice.invoice_number}
                </p>
              </div>
              
              <div>
                <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {invoiceService.formatCurrency(generatedInvoice.grand_total)}
                </p>
              </div>
              
              <div>
                <Send className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Sent via SMS
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button
            onClick={resetForm}
            variant="outline"
            className="rounded-2xl px-6 py-3"
          >
            Generate Another Invoice
          </Button>
          <Button
            onClick={() => {
              // TODO: Implement download functionality
              toast({
                title: 'Download',
                description: 'PDF download will be available soon'
              });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-3"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'selection' ? 'bg-blue-600 text-white' : 
            ['preview', 'generated'].includes(step) ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
          }`}>
            1
          </div>
          <div className={`w-16 h-1 ${
            ['preview', 'generated'].includes(step) ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
          }`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'preview' ? 'bg-blue-600 text-white' : 
            step === 'generated' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
          }`}>
            2
          </div>
          <div className={`w-16 h-1 ${
            step === 'generated' ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
          }`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'generated' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
          }`}>
            3
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {step === 'selection' && <SelectionStep />}
          {step === 'preview' && <PreviewStep />}
          {step === 'generated' && <GeneratedStep />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}