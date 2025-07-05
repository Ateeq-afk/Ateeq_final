import { useState, useMemo, useCallback } from 'react';
import {
  Users,
  Package,
  X,
  Loader2,
  Calculator,
  Percent,
  IndianRupee,
  Building2,
  User,
  Save,
  Eye,
  EyeOff,
  Info,
  Target,
  Copy,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TooltipProvider,
} from '@/components/ui/tooltip';
import { useArticles } from '@/hooks/useArticles';
import { useCustomers } from '@/hooks/useCustomers';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import type { Article, CustomerArticleRate } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  articles: Article[];
  onClose: () => void;
  onSuccess: () => void;
}

type BulkOperation = 'percentage' | 'fixed_amount' | 'set_rate' | 'copy_from';
type FilterType = 'all' | 'with_rates' | 'without_rates';

interface RateChange {
  articleId: string;
  customerId: string;
  oldRate?: number;
  newRate: number;
  operation: BulkOperation;
  value: number;
}

interface BulkConfig {
  operation: BulkOperation;
  value: number;
  applyToBase: boolean;
  sourceArticleId?: string;
  minRate?: number;
  maxRate?: number;
  roundTo?: number;
}

export default function ArticleBulkRates({ articles, onClose, onSuccess }: Props) {
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [bulkConfig, setBulkConfig] = useState<BulkConfig>({
    operation: 'percentage',
    value: 0,
    applyToBase: true,
    roundTo: 2,
  });
  const [pendingChanges, setPendingChanges] = useState<RateChange[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [activeTab, setActiveTab] = useState('selection');
  const [ratesData, setRatesData] = useState<Record<string, CustomerArticleRate[]>>({});

  const { getArticleRates, updateCustomerRate } = useArticles();
  const { customers } = useCustomers();
  const { showSuccess, showError, showInfo } = useNotificationSystem();
  const showWarning = showInfo; // Use showInfo for warnings

  // Filter articles based on search and selection
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch = article.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           article.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           article.hsn_code?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (filterType === 'all') return true;
      
      const articleRates = ratesData[article.id] || [];
      
      if (filterType === 'with_rates') {
        return articleRates.length > 0;
      } else {
        return articleRates.length === 0;
      }
    });
  }, [articles, searchQuery, filterType, ratesData]);

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      customer.mobile?.includes(customerSearchQuery) ||
      customer.email?.toLowerCase().includes(customerSearchQuery.toLowerCase())
    );
  }, [customers, customerSearchQuery]);

  // Load rates for selected articles
  const loadRatesForArticles = useCallback(async (articleIds: string[]) => {
    const newRatesData = { ...ratesData };
    
    try {
      for (const articleId of articleIds) {
        if (!newRatesData[articleId]) {
          const rates = await getArticleRates(articleId);
          newRatesData[articleId] = rates;
        }
      }
      setRatesData(newRatesData);
    } catch (error) {
      console.error('Failed to load rates:', error);
      showError('Load Failed', 'Failed to load customer rates');
    }
  }, [ratesData, getArticleRates, showError]);

  // Update article selection
  const toggleArticleSelection = useCallback((articleId: string) => {
    setSelectedArticles(prev => {
      const newSelection = prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId];
      
      // Load rates for newly selected articles
      const newlySelected = newSelection.filter(id => !prev.includes(id));
      if (newlySelected.length > 0) {
        loadRatesForArticles(newlySelected);
      }
      
      return newSelection;
    });
  }, [loadRatesForArticles]);

  // Update customer selection
  const toggleCustomerSelection = useCallback((customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  }, []);

  // Select all filtered items
  const selectAllArticles = useCallback(() => {
    const allArticleIds = filteredArticles.map(a => a.id);
    setSelectedArticles(allArticleIds);
    loadRatesForArticles(allArticleIds);
  }, [filteredArticles, loadRatesForArticles]);

  const selectAllCustomers = useCallback(() => {
    setSelectedCustomers(filteredCustomers.map(c => c.id));
  }, [filteredCustomers]);

  // Calculate new rate based on operation
  const calculateNewRate = useCallback((baseRate: number, currentRate: number | undefined, config: BulkConfig): number => {
    const startingRate = config.applyToBase ? baseRate : (currentRate || baseRate);
    let newRate: number;

    switch (config.operation) {
      case 'percentage':
        newRate = startingRate * (1 + config.value / 100);
        break;
      case 'fixed_amount':
        newRate = startingRate + config.value;
        break;
      case 'set_rate':
        newRate = config.value;
        break;
      case 'copy_from':
        if (config.sourceArticleId) {
          const sourceArticle = articles.find(a => a.id === config.sourceArticleId);
          newRate = sourceArticle?.base_rate || startingRate;
        } else {
          newRate = startingRate;
        }
        break;
      default:
        newRate = startingRate;
    }

    // Apply constraints
    if (config.minRate !== undefined && newRate < config.minRate) {
      newRate = config.minRate;
    }
    if (config.maxRate !== undefined && newRate > config.maxRate) {
      newRate = config.maxRate;
    }

    // Round if specified
    if (config.roundTo !== undefined) {
      newRate = Math.round(newRate * Math.pow(10, config.roundTo)) / Math.pow(10, config.roundTo);
    }

    return Math.max(0, newRate); // Ensure non-negative
  }, [articles]);

  // Preview bulk changes
  const previewBulkChanges = useCallback(() => {
    const changes: RateChange[] = [];
    
    selectedArticles.forEach(articleId => {
      const article = articles.find(a => a.id === articleId);
      if (!article) return;
      
      const articleRates = ratesData[articleId] || [];
      
      selectedCustomers.forEach(customerId => {
        const existingRate = articleRates.find(r => r.customer_id === customerId);
        const newRate = calculateNewRate(article.base_rate, existingRate?.rate, bulkConfig);
        
        changes.push({
          articleId,
          customerId,
          oldRate: existingRate?.rate,
          newRate,
          operation: bulkConfig.operation,
          value: bulkConfig.value,
        });
      });
    });
    
    setPendingChanges(changes);
    setShowPreview(true);
    setActiveTab('preview');
  }, [selectedArticles, selectedCustomers, articles, ratesData, bulkConfig, calculateNewRate]);

  // Apply bulk changes
  const applyBulkChanges = useCallback(async () => {
    if (pendingChanges.length === 0) return;
    
    setIsApplying(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (const change of pendingChanges) {
        try {
          await updateCustomerRate(change.customerId, change.articleId, change.newRate);
          successCount++;
        } catch (error) {
          console.error(`Failed to update rate for customer ${change.customerId}:`, error);
          errorCount++;
        }
      }
      
      if (errorCount === 0) {
        showSuccess(
          'Bulk Update Complete',
          `Successfully updated ${successCount} customer rates`
        );
      } else {
        showWarning(
          'Partial Success',
          `Updated ${successCount} rates, ${errorCount} failed`
        );
      }
      
      // Refresh rates data
      await loadRatesForArticles(selectedArticles);
      
      if (successCount > 0) {
        onSuccess();
      }
    } catch (error) {
      showError('Update Failed', 'Failed to apply bulk rate changes');
    } finally {
      setIsApplying(false);
      setPendingChanges([]);
      setShowPreview(false);
    }
  }, [pendingChanges, updateCustomerRate, showSuccess, showWarning, showError, loadRatesForArticles, selectedArticles, onSuccess]);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  }, []);

  // Get statistics
  const stats = useMemo(() => {
    const totalArticles = articles.length;
    const selectedArticleCount = selectedArticles.length;
    const selectedCustomerCount = selectedCustomers.length;
    const totalCombinations = selectedArticleCount * selectedCustomerCount;
    
    const existingRates = selectedArticles.reduce((count, articleId) => {
      const articleRates = ratesData[articleId] || [];
      return count + selectedCustomers.filter(customerId => 
        articleRates.some(r => r.customer_id === customerId)
      ).length;
    }, 0);
    
    return {
      totalArticles,
      selectedArticleCount,
      selectedCustomerCount,
      totalCombinations,
      existingRates,
      newRates: totalCombinations - existingRates,
    };
  }, [articles.length, selectedArticles, selectedCustomers, ratesData]);

  return (
    <TooltipProvider>
      <div className="space-y-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bulk Rate Management</h2>
            <p className="text-gray-600 mt-1">
              Update customer rates for multiple articles at once
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 flex-shrink-0">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.selectedArticleCount}</p>
                <p className="text-xs text-gray-500">Articles Selected</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.selectedCustomerCount}</p>
                <p className="text-xs text-gray-500">Customers Selected</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.totalCombinations}</p>
                <p className="text-xs text-gray-500">Total Combinations</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.existingRates}</p>
                <p className="text-xs text-gray-500">Existing Rates</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.newRates}</p>
                <p className="text-xs text-gray-500">New Rates</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid grid-cols-3 w-full flex-shrink-0">
              <TabsTrigger value="selection">Selection</TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="preview" disabled={pendingChanges.length === 0}>
                Preview {pendingChanges.length > 0 && `(${pendingChanges.length})`}
              </TabsTrigger>
            </TabsList>

            {/* Selection Tab */}
            <TabsContent value="selection" className="flex-1 space-y-6 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {/* Articles Selection */}
                <Card className="flex flex-col">
                  <CardHeader className="flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Articles
                      </CardTitle>
                      <Badge variant="secondary">
                        {selectedArticles.length} of {filteredArticles.length}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1"
                      />
                      <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="with_rates">With Rates</SelectItem>
                          <SelectItem value="without_rates">Without Rates</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllArticles}
                        disabled={filteredArticles.length === 0}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedArticles([])}
                        disabled={selectedArticles.length === 0}
                      >
                        Clear
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto">
                    <div className="space-y-2">
                      {filteredArticles.map(article => {
                        const isSelected = selectedArticles.includes(article.id);
                        const articleRates = ratesData[article.id] || [];
                        
                        return (
                          <div
                            key={article.id}
                            className={cn(
                              "p-3 border rounded-lg cursor-pointer transition-colors",
                              isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                            )}
                            onClick={() => toggleArticleSelection(article.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onChange={() => {}} // Handled by div click
                                />
                                <div>
                                  <p className="font-medium">{article.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {formatCurrency(article.base_rate)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className="text-xs">
                                  {articleRates.length} rates
                                </Badge>
                                {article.hsn_code && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    HSN: {article.hsn_code}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Customers Selection */}
                <Card className="flex flex-col">
                  <CardHeader className="flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Customers
                      </CardTitle>
                      <Badge variant="secondary">
                        {selectedCustomers.length} of {filteredCustomers.length}
                      </Badge>
                    </div>
                    <Input
                      placeholder="Search customers..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    />
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllCustomers}
                        disabled={filteredCustomers.length === 0}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCustomers([])}
                        disabled={selectedCustomers.length === 0}
                      >
                        Clear
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto">
                    <div className="space-y-2">
                      {filteredCustomers.map(customer => {
                        const isSelected = selectedCustomers.includes(customer.id);
                        
                        return (
                          <div
                            key={customer.id}
                            className={cn(
                              "p-3 border rounded-lg cursor-pointer transition-colors",
                              isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                            )}
                            onClick={() => toggleCustomerSelection(customer.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onChange={() => {}} // Handled by div click
                                />
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center",
                                    customer.type === 'individual' ? 'bg-blue-100' : 'bg-purple-100'
                                  )}>
                                    {customer.type === 'individual' ? (
                                      <User className="h-4 w-4 text-blue-600" />
                                    ) : (
                                      <Building2 className="h-4 w-4 text-purple-600" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium">{customer.name}</p>
                                    <p className="text-sm text-gray-500">{customer.mobile}</p>
                                  </div>
                                </div>
                              </div>
                              <Badge variant={customer.type === 'individual' ? 'default' : 'secondary'}>
                                {customer.type}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Configuration Tab */}
            <TabsContent value="configuration" className="flex-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Rate Calculation
                  </CardTitle>
                  <CardDescription>
                    Configure how new rates should be calculated
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Operation Type */}
                  <div className="space-y-3">
                    <Label>Operation Type</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { value: 'percentage', label: 'Percentage Change', icon: <Percent className="h-4 w-4" />, desc: 'Increase/decrease by percentage' },
                        { value: 'fixed_amount', label: 'Fixed Amount', icon: <IndianRupee className="h-4 w-4" />, desc: 'Add/subtract fixed amount' },
                        { value: 'set_rate', label: 'Set Rate', icon: <Target className="h-4 w-4" />, desc: 'Set to specific rate' },
                        { value: 'copy_from', label: 'Copy From Article', icon: <Copy className="h-4 w-4" />, desc: 'Copy base rate from another article' },
                      ].map(operation => (
                        <Label
                          key={operation.value}
                          htmlFor={operation.value}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-lg border cursor-pointer",
                            bulkConfig.operation === operation.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <input
                            type="radio"
                            id={operation.value}
                            name="operation"
                            value={operation.value}
                            checked={bulkConfig.operation === operation.value}
                            onChange={(e) => setBulkConfig(prev => ({ ...prev, operation: e.target.value as BulkOperation }))}
                            className="sr-only"
                          />
                          <div className="text-gray-600">{operation.icon}</div>
                          <div className="flex-1">
                            <p className="font-medium">{operation.label}</p>
                            <p className="text-xs text-gray-500">{operation.desc}</p>
                          </div>
                        </Label>
                      ))}
                    </div>
                  </div>

                  {/* Value Input */}
                  {bulkConfig.operation !== 'copy_from' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="value">
                          {bulkConfig.operation === 'percentage' && 'Percentage (%)'}
                          {bulkConfig.operation === 'fixed_amount' && 'Amount (₹)'}
                          {bulkConfig.operation === 'set_rate' && 'Rate (₹)'}
                        </Label>
                        <Input
                          id="value"
                          type="number"
                          step="0.01"
                          value={bulkConfig.value}
                          onChange={(e) => setBulkConfig(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                          placeholder="Enter value..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="roundTo">Round To (decimal places)</Label>
                        <Select 
                          value={bulkConfig.roundTo?.toString() || '2'} 
                          onValueChange={(v) => setBulkConfig(prev => ({ ...prev, roundTo: parseInt(v) }))}
                        >
                          <SelectTrigger id="roundTo">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Whole number</SelectItem>
                            <SelectItem value="1">1 decimal</SelectItem>
                            <SelectItem value="2">2 decimals</SelectItem>
                            <SelectItem value="3">3 decimals</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Copy From Article */}
                  {bulkConfig.operation === 'copy_from' && (
                    <div>
                      <Label htmlFor="sourceArticle">Source Article</Label>
                      <Select 
                        value={bulkConfig.sourceArticleId || ''} 
                        onValueChange={(v) => setBulkConfig(prev => ({ ...prev, sourceArticleId: v }))}
                      >
                        <SelectTrigger id="sourceArticle">
                          <SelectValue placeholder="Select article to copy rate from..." />
                        </SelectTrigger>
                        <SelectContent>
                          {articles.map(article => (
                            <SelectItem key={article.id} value={article.id}>
                              {article.name} - {formatCurrency(article.base_rate)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Apply To Base Rate Switch */}
                  {bulkConfig.operation !== 'set_rate' && bulkConfig.operation !== 'copy_from' && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Apply to Base Rate</p>
                        <p className="text-sm text-gray-500">
                          If enabled, calculations use article base rate. If disabled, uses existing customer rate.
                        </p>
                      </div>
                      <Switch
                        checked={bulkConfig.applyToBase}
                        onCheckedChange={(checked) => setBulkConfig(prev => ({ ...prev, applyToBase: checked }))}
                      />
                    </div>
                  )}

                  {/* Constraints */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Rate Constraints (Optional)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minRate">Minimum Rate (₹)</Label>
                        <Input
                          id="minRate"
                          type="number"
                          step="0.01"
                          min="0"
                          value={bulkConfig.minRate || ''}
                          onChange={(e) => setBulkConfig(prev => ({ 
                            ...prev, 
                            minRate: e.target.value ? parseFloat(e.target.value) : undefined 
                          }))}
                          placeholder="No minimum"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxRate">Maximum Rate (₹)</Label>
                        <Input
                          id="maxRate"
                          type="number"
                          step="0.01"
                          min="0"
                          value={bulkConfig.maxRate || ''}
                          onChange={(e) => setBulkConfig(prev => ({ 
                            ...prev, 
                            maxRate: e.target.value ? parseFloat(e.target.value) : undefined 
                          }))}
                          placeholder="No maximum"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="flex-1 space-y-6 overflow-hidden">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Preview Changes</AlertTitle>
                <AlertDescription>
                  Review {pendingChanges.length} rate changes before applying them.
                </AlertDescription>
              </Alert>

              <Card className="flex-1 flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle>Rate Changes</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {showPreview ? 'Hide' : 'Show'} Details
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  {showPreview && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Article</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead className="text-right">Current Rate</TableHead>
                          <TableHead className="text-right">New Rate</TableHead>
                          <TableHead className="text-right">Change</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingChanges.map((change, index) => {
                          const article = articles.find(a => a.id === change.articleId);
                          const customer = customers.find(c => c.id === change.customerId);
                          const currentRate = change.oldRate || article?.base_rate || 0;
                          const changeAmount = change.newRate - currentRate;
                          const changePercent = currentRate > 0 ? (changeAmount / currentRate) * 100 : 0;
                          const isNew = !change.oldRate;
                          
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{article?.name}</p>
                                  <p className="text-xs text-gray-500">
                                    Base: {formatCurrency(article?.base_rate || 0)}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center",
                                    customer?.type === 'individual' ? 'bg-blue-100' : 'bg-purple-100'
                                  )}>
                                    {customer?.type === 'individual' ? (
                                      <User className="h-3 w-3 text-blue-600" />
                                    ) : (
                                      <Building2 className="h-3 w-3 text-purple-600" />
                                    )}
                                  </div>
                                  <span className="text-sm">{customer?.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {change.oldRate ? formatCurrency(change.oldRate) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(change.newRate)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className={cn(
                                  "text-sm",
                                  changeAmount > 0 ? "text-green-600" : changeAmount < 0 ? "text-red-600" : "text-gray-600"
                                )}>
                                  {changeAmount > 0 ? '+' : ''}{formatCurrency(changeAmount)}
                                  <br />
                                  <span className="text-xs">
                                    ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={isNew ? 'default' : 'secondary'}>
                                  {isNew ? 'New' : 'Update'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between gap-3 pt-6 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          <div className="flex gap-3">
            {activeTab === 'selection' && (
              <Button
                onClick={() => setActiveTab('configuration')}
                disabled={selectedArticles.length === 0 || selectedCustomers.length === 0}
              >
                Configure Rates
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            
            {activeTab === 'configuration' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('selection')}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={previewBulkChanges}
                  disabled={
                    selectedArticles.length === 0 || 
                    selectedCustomers.length === 0 ||
                    (bulkConfig.operation === 'copy_from' && !bulkConfig.sourceArticleId)
                  }
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Changes
                </Button>
              </>
            )}
            
            {activeTab === 'preview' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('configuration')}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Config
                </Button>
                <Button
                  onClick={applyBulkChanges}
                  disabled={isApplying || pendingChanges.length === 0}
                  className="flex items-center gap-2"
                >
                  {isApplying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isApplying ? 'Applying...' : `Apply ${pendingChanges.length} Changes`}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}