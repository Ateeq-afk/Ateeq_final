import { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Edit,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Truck,
  IndianRupee,
  Calendar,
  Users,
  Building2,
  TrendingUp,
  Clock,
  Hash,
  Percent,
  Box,
  Download,
  Copy,
  CheckCircle2,
  XCircle,
  Activity,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  FileText,
  Eye,
  Share2,
  Printer,
  Mail,
  MessageSquare,
  Star,
  Shield,
  AlertCircle,
  Info,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Target,
  Zap,
  Plus,
  Filter,
} from 'lucide-react';

// Enterprise UI Components
import { Button, IconButton, ButtonGroup } from '@/components/ui/button-enterprise';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, MetricCard } from '@/components/ui/card-enterprise';
import { StatsCard, StatsGrid, MiniStats, AnimatedCounter } from '@/components/ui/stats-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Hooks and types
import { useArticleBookings } from '@/hooks/useArticleBookings';
import { useArticles } from '@/hooks/useArticles';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import type { Article } from '@/types';
import ArticleForm from './ArticleForm';

// Design tokens
import { designTokens } from '@/lib/design-tokens';

interface Props {
  article: Article;
  onClose: () => void;
  onEdit?: (article: Article) => void;
}

interface CustomerRate {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_type: 'individual' | 'corporate';
  rate: number;
}

interface TimeRange {
  label: string;
  value: number; // days
  icon: React.ReactNode;
}

const TIME_RANGES: TimeRange[] = [
  { label: 'Last 7 days', value: 7, icon: <Calendar className="h-4 w-4" /> },
  { label: 'Last 30 days', value: 30, icon: <Calendar className="h-4 w-4" /> },
  { label: 'Last 90 days', value: 90, icon: <Calendar className="h-4 w-4" /> },
  { label: 'Last 6 months', value: 180, icon: <Calendar className="h-4 w-4" /> },
  { label: 'Last year', value: 365, icon: <Calendar className="h-4 w-4" /> },
  { label: 'All time', value: 0, icon: <Clock className="h-4 w-4" /> },
];

export default function ArticleDetailsEnterprise({ article, onClose, onEdit }: Props) {
  const { getArticle, updateArticle, getArticleRates } = useArticles();
  const { showSuccess, showInfo } = useNotificationSystem();

  const [current, setCurrent] = useState(article);
  const [isEditing, setIsEditing] = useState(false);
  const [customerRates, setCustomerRates] = useState<CustomerRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'rates' | 'analytics' | 'insights'>('overview');
  const [timeRange, setTimeRange] = useState<number>(30);
  const [copied, setCopied] = useState(false);

  // Load bookings for this article
  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
  } = useArticleBookings(current.id);

  // Refresh article after editing
  useEffect(() => {
    if (!isEditing) {
      getArticle(current.id).then(setCurrent).catch(console.error);
    }
  }, [isEditing, current.id, getArticle]);

  // Load rates when rates tab is active
  useEffect(() => {
    let mounted = true;
    if (activeTab === 'rates' && customerRates.length === 0) {
      setRatesLoading(true);
      getArticleRates(current.id)
        .then((r) => mounted && setCustomerRates(r.map(rate => ({
          ...rate,
          customer_name: rate.customer_name || '',
          customer_type: rate.customer_type || 'individual'
        }))))
        .catch(() => mounted && setCustomerRates([]))
        .finally(() => mounted && setRatesLoading(false));
    }
    return () => {
      mounted = false;
    };
  }, [activeTab, current.id, getArticleRates, customerRates.length]);

  // Filter bookings by time range
  const filteredBookings = useMemo(() => {
    if (timeRange === 0) return bookings;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);
    
    return bookings.filter(b => new Date(b.created_at) >= cutoffDate);
  }, [bookings, timeRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalBookings = filteredBookings.length;
    const totalQuantity = filteredBookings.reduce((sum, b) => sum + (b.quantity || 0), 0);
    const totalRevenue = filteredBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const avgRate = totalQuantity > 0 ? totalRevenue / totalQuantity : 0;
    
    // Calculate trend (compare to previous period)
    const midPoint = new Date();
    midPoint.setDate(midPoint.getDate() - (timeRange || 30) / 2);
    
    const recentBookings = filteredBookings.filter(b => new Date(b.created_at) >= midPoint);
    const olderBookings = filteredBookings.filter(b => new Date(b.created_at) < midPoint);
    
    const recentRevenue = recentBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const olderRevenue = olderBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    
    const trend = olderRevenue > 0 ? ((recentRevenue - olderRevenue) / olderRevenue) * 100 : 0;
    
    // Status breakdown
    const statusCounts = filteredBookings.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Monthly breakdown for chart
    const monthlyData = filteredBookings.reduce((acc, b) => {
      const month = new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!acc[month]) {
        acc[month] = { bookings: 0, revenue: 0, quantity: 0 };
      }
      acc[month].bookings += 1;
      acc[month].revenue += b.total_amount || 0;
      acc[month].quantity += b.quantity || 0;
      return acc;
    }, {} as Record<string, { bookings: number; revenue: number; quantity: number }>);
    
    // Calculate delivery performance
    const deliveredBookings = filteredBookings.filter(b => b.status === 'delivered');
    const deliveryRate = totalBookings > 0 ? (deliveredBookings.length / totalBookings) * 100 : 0;
    
    // Popular routes
    const routeCounts = filteredBookings.reduce((acc, b) => {
      const route = `${b.from_branch_details?.name || 'Unknown'} → ${b.to_branch_details?.name || 'Unknown'}`;
      acc[route] = (acc[route] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const popularRoutes = Object.entries(routeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([route, count]) => ({ route, count }));
    
    return {
      totalBookings,
      totalQuantity,
      totalRevenue,
      avgRate,
      trend,
      statusCounts,
      monthlyData,
      deliveryRate,
      popularRoutes,
    };
  }, [filteredBookings, timeRange]);

  // Copy article details
  const copyDetails = async () => {
    const text = `
Article: ${current.name}
Description: ${current.description || 'N/A'}
Base Rate: ₹${current.base_rate.toFixed(2)}
HSN Code: ${current.hsn_code || 'N/A'}
Tax Rate: ${current.tax_rate || 0}%
Unit: ${current.unit_of_measure || 'N/A'}
Min Quantity: ${current.min_quantity || 1}
Fragile: ${current.is_fragile ? 'Yes' : 'No'}
Special Handling: ${current.requires_special_handling ? 'Yes' : 'No'}
    `.trim();
    
    await navigator.clipboard.writeText(text);
    setCopied(true);
    showSuccess('Copied!', 'Article details copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Export bookings
  const exportBookings = () => {
    const csv = [
      ['LR Number', 'Date', 'From', 'To', 'Sender', 'Receiver', 'Quantity', 'Status', 'Amount'],
      ...filteredBookings.map(b => [
        b.lr_number,
        new Date(b.created_at).toLocaleDateString(),
        b.from_branch_details?.name || '',
        b.to_branch_details?.name || '',
        b.sender?.name || '',
        b.receiver?.name || '',
        `${b.quantity} ${b.uom}`,
        b.status,
        b.total_amount,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${current.name.replace(/\s+/g, '-')}-bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showSuccess('Export Complete', 'Bookings exported to CSV');
  };

  // Share article
  const shareArticle = () => {
    const url = `${window.location.origin}/articles/${current.id}`;
    navigator.clipboard.writeText(url);
    showInfo('Link Copied', 'Article link copied to clipboard');
  };

  // Format helpers
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);

  // Show edit form
  if (isEditing) {
    return (
      <ArticleForm
        initialData={current}
        onCancel={() => setIsEditing(false)}
        onSubmit={async (data) => {
          await updateArticle(current.id, data);
          showSuccess('Article Updated', 'Changes have been saved successfully');
          setIsEditing(false);
        }}
      />
    );
  }

  // Error state
  if (bookingsError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading article data: {bookingsError.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-950 dark:to-secondary-950 -m-6 p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{current.name}</h2>
                {current.description && (
                  <p className="text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">{current.description}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="outline" className="font-mono bg-white dark:bg-neutral-900">
                    ID: {current.id.slice(0, 8)}
                  </Badge>
                  <Badge variant="secondary" className="font-mono text-lg px-3">
                    {formatCurrency(current.base_rate)}
                  </Badge>
                  {current.hsn_code && (
                    <Badge variant="outline" className="bg-white dark:bg-neutral-900">
                      <Hash className="h-3 w-3 mr-1" />
                      {current.hsn_code}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <ButtonGroup>
                <IconButton
                  variant="outline"
                  icon={copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  onClick={copyDetails}
                  aria-label="Copy details"
                />
                <IconButton
                  variant="outline"
                  icon={<Share2 className="h-4 w-4" />}
                  onClick={shareArticle}
                  aria-label="Share article"
                />
                <IconButton
                  variant="outline"
                  icon={<Printer className="h-4 w-4" />}
                  onClick={() => window.print()}
                  aria-label="Print details"
                />
              </ButtonGroup>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Actions
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Article Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => exportBookings()}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Bookings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Mail className="h-4 w-4 mr-2" />
                    Email Report
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Note
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onEdit ? onEdit(current) : setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Article
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <StatsGrid columns={4}>
          <StatsCard
            title="Total Bookings"
            value={<AnimatedCounter value={stats.totalBookings} />}
            icon={<FileText className="h-5 w-5" />}
            change={stats.trend !== 0 ? { value: Math.abs(stats.trend), type: stats.trend > 0 ? 'increase' : 'decrease' } : undefined}
            variant="gradient"
          />
          
          <StatsCard
            title="Total Quantity"
            value={`${stats.totalQuantity}`}
            subtitle={current.unit_of_measure || 'units'}
            icon={<Box className="h-5 w-5" />}
            iconColor="bg-secondary-100 text-secondary-600 dark:bg-secondary-900/20 dark:text-secondary-400"
          />
          
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            subtitle={`Avg: ${formatCurrency(stats.avgRate)}/unit`}
            icon={<DollarSign className="h-5 w-5" />}
            iconColor="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
          />
          
          <StatsCard
            title="Delivery Rate"
            value={`${stats.deliveryRate.toFixed(1)}%`}
            icon={<Target className="h-5 w-5" />}
            iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
            chart={
              <div className="w-16 h-16">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-purple-100 dark:text-purple-900/20"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - stats.deliveryRate / 100)}`}
                    className="text-purple-600 dark:text-purple-400 transition-all duration-1000"
                  />
                </svg>
              </div>
            }
          />
        </StatsGrid>

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="grid grid-cols-5 w-[500px]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="rates">Rates</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            
            {(activeTab === 'bookings' || activeTab === 'analytics') && (
              <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(Number(v))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGES.map(range => (
                    <SelectItem key={range.value} value={range.value.toString()}>
                      <div className="flex items-center gap-2">
                        {range.icon}
                        {range.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle size="sm">Article Information</CardTitle>
                  <CardDescription>Core details and pricing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoRow
                    icon={<IndianRupee className="h-4 w-4" />}
                    label="Base Rate"
                    value={formatCurrency(current.base_rate)}
                    variant="primary"
                  />
                  <InfoRow
                    icon={<Hash className="h-4 w-4" />}
                    label="HSN Code"
                    value={current.hsn_code || 'Not specified'}
                  />
                  <InfoRow
                    icon={<Percent className="h-4 w-4" />}
                    label="Tax Rate"
                    value={`${current.tax_rate || 0}%`}
                  />
                  <InfoRow
                    icon={<Box className="h-4 w-4" />}
                    label="Unit of Measure"
                    value={current.unit_of_measure || 'Not specified'}
                  />
                  <InfoRow
                    icon={<Package className="h-4 w-4" />}
                    label="Minimum Quantity"
                    value={current.min_quantity || 1}
                  />
                  <InfoRow
                    icon={<Calendar className="h-4 w-4" />}
                    label="Created On"
                    value={formatDate(current.created_at)}
                  />
                </CardContent>
              </Card>

              {/* Special Attributes & Notes */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle size="sm">Special Attributes</CardTitle>
                  <CardDescription>Handling requirements and notes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <div className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors",
                      current.is_fragile 
                        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                        : "border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
                    )}>
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Fragile Item</span>
                      <Badge variant={current.is_fragile ? "destructive" : "outline"}>
                        {current.is_fragile ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    
                    <div className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors",
                      current.requires_special_handling
                        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                        : "border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
                    )}>
                      <ShieldCheck className="h-4 w-4" />
                      <span className="font-medium">Special Handling</span>
                      <Badge variant={current.requires_special_handling ? "secondary" : "outline"}>
                        {current.requires_special_handling ? 'Required' : 'Standard'}
                      </Badge>
                    </div>
                  </div>
                  
                  {current.notes && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-neutral-500" />
                        Additional Notes
                      </h4>
                      <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                        <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{current.notes}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Performance Overview */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Quick Performance Overview</CardTitle>
                <CardDescription>Key metrics for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(stats.statusCounts).map(([status, count]) => (
                    <div key={status} className="text-center p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                      <StatusBadge status={status} size="lg" />
                      <p className="text-2xl font-bold mt-2">{count}</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">bookings</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Booking History</CardTitle>
                    <CardDescription>
                      {filteredBookings.length} bookings found for the selected period
                    </CardDescription>
                  </div>
                  <ButtonGroup>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportBookings}
                      disabled={filteredBookings.length === 0}
                      leftIcon={<Download className="h-4 w-4" />}
                    >
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Filter className="h-4 w-4" />}
                    >
                      Filter
                    </Button>
                  </ButtonGroup>
                </div>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : filteredBookings.length > 0 ? (
                  <div className="space-y-3">
                    {filteredBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="group p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg group-hover:scale-110 transition-transform">
                              <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-primary-600 dark:text-primary-400">
                                  {booking.lr_number}
                                </p>
                                <StatusBadge status={booking.status} />
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(booking.created_at)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {booking.sender?.name || 'N/A'} → {booking.receiver?.name || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-lg">{formatCurrency(booking.total_amount)}</p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {booking.quantity} {booking.uom}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="font-normal">
                              <Truck className="h-3 w-3 mr-1" />
                              {booking.from_branch_details?.name} → {booking.to_branch_details?.name}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            rightIcon={<ExternalLink className="h-3 w-3" />}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="h-10 w-10 text-neutral-400" />
                    </div>
                    <p className="text-lg font-medium text-neutral-600 dark:text-neutral-400">No bookings found</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
                      Try adjusting the time range filter
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rates Tab */}
          <TabsContent value="rates" className="space-y-4">
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Customer Specific Rates</CardTitle>
                    <CardDescription>
                      Custom pricing configurations for different customers
                    </CardDescription>
                  </div>
                  <Button variant="gradient" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                    Add Custom Rate
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {ratesLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                ) : customerRates.length > 0 ? (
                  <div className="space-y-3">
                    {customerRates.map((rate) => {
                      const discount = ((current.base_rate - rate.rate) / current.base_rate) * 100;
                      const isDiscount = discount > 0;
                      const isPremium = discount < 0;
                      
                      return (
                        <div
                          key={rate.id}
                          className="group p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "p-3 rounded-lg",
                                rate.customer_type === 'corporate'
                                  ? "bg-purple-100 dark:bg-purple-900/20"
                                  : "bg-blue-100 dark:bg-blue-900/20"
                              )}>
                                {rate.customer_type === 'corporate' ? (
                                  <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                ) : (
                                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-lg">{rate.customer_name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={rate.customer_type === 'corporate' ? 'secondary' : 'default'}>
                                    {rate.customer_type}
                                  </Badge>
                                  {isDiscount && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      Special Discount
                                    </Badge>
                                  )}
                                  {isPremium && (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                                      <Star className="h-3 w-3 mr-1" />
                                      Premium Rate
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="text-sm text-neutral-600 dark:text-neutral-400 line-through">
                                    {formatCurrency(current.base_rate)}
                                  </p>
                                  <p className="text-xl font-bold">{formatCurrency(rate.rate)}</p>
                                </div>
                                <div className={cn(
                                  "px-3 py-2 rounded-lg font-semibold",
                                  isDiscount && "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
                                  isPremium && "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
                                  !isDiscount && !isPremium && "bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
                                )}>
                                  {isDiscount && '↓'}
                                  {isPremium && '↑'}
                                  {Math.abs(discount).toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-10 w-10 text-neutral-400" />
                    </div>
                    <p className="text-lg font-medium text-neutral-600 dark:text-neutral-400">No custom rates configured</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
                      All customers are using the base rate
                    </p>
                    <Button variant="gradient" className="mt-4" leftIcon={<Plus className="h-4 w-4" />}>
                      Configure First Rate
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Booking Trends */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Booking Trends</CardTitle>
                  <CardDescription>Monthly booking volume and patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.monthlyData).slice(-6).map(([month, data]) => {
                      const maxBookings = Math.max(...Object.values(stats.monthlyData).map(d => d.bookings));
                      const percentage = (data.bookings / maxBookings) * 100;
                      
                      return (
                        <div key={month}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{month}</span>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{data.bookings} bookings</Badge>
                              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                {formatCurrency(data.revenue)}
                              </span>
                            </div>
                          </div>
                          <div className="relative h-3 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-1000"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Popular Routes */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Popular Routes</CardTitle>
                  <CardDescription>Most frequently used shipping routes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.popularRoutes.map((route, index) => (
                      <div
                        key={route.route}
                        className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                            index === 0 && "bg-gold-100 text-gold-700 dark:bg-gold-900/20 dark:text-gold-400",
                            index === 1 && "bg-silver-100 text-silver-700 dark:bg-silver-900/20 dark:text-silver-400",
                            index === 2 && "bg-bronze-100 text-bronze-700 dark:bg-bronze-900/20 dark:text-bronze-400",
                            index > 2 && "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                          )}>
                            {index + 1}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{route.route}</span>
                          </div>
                        </div>
                        <Badge variant="secondary">{route.count} trips</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Overview */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Comprehensive performance analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-3">
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-neutral-200 dark:text-neutral-800"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.deliveryRate / 100)}`}
                          className="text-green-500 transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">{stats.deliveryRate.toFixed(0)}%</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Delivery Success</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-3">
                      <Activity className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold">{stats.totalBookings}</p>
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Orders</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(stats.avgRate)}</p>
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Average Rate</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Alert className="border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-950">
              <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <AlertDescription className="text-primary-700 dark:text-primary-300">
                AI-powered insights and recommendations based on article performance data
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Insights */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle size="sm">Performance Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InsightItem
                    icon={<TrendingUp className="h-5 w-5" />}
                    title="Revenue Trend"
                    description={`This article shows a ${stats.trend > 0 ? 'positive' : 'negative'} trend of ${Math.abs(stats.trend).toFixed(1)}% compared to the previous period.`}
                    type={stats.trend > 0 ? 'positive' : 'warning'}
                  />
                  
                  <InsightItem
                    icon={<Target className="h-5 w-5" />}
                    title="Delivery Performance"
                    description={`With a ${stats.deliveryRate.toFixed(1)}% delivery rate, this article ${stats.deliveryRate > 90 ? 'exceeds' : 'needs improvement in'} performance standards.`}
                    type={stats.deliveryRate > 90 ? 'positive' : 'warning'}
                  />
                  
                  <InsightItem
                    icon={<Users className="h-5 w-5" />}
                    title="Customer Pricing"
                    description={`${customerRates.length} customers have special rates configured. Consider reviewing pricing strategy for optimal margins.`}
                    type="info"
                  />
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle size="sm">Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RecommendationItem
                    icon={<Zap className="h-5 w-5" />}
                    title="Optimize Pricing"
                    description="Based on demand patterns, consider a 5-10% rate adjustment for peak seasons."
                    action="Review Rates"
                  />
                  
                  <RecommendationItem
                    icon={<Shield className="h-5 w-5" />}
                    title="Enhance Protection"
                    description="Given the fragile nature, recommend premium packaging options to reduce damage claims."
                    action="View Options"
                  />
                  
                  <RecommendationItem
                    icon={<BarChart3 className="h-5 w-5" />}
                    title="Expand Markets"
                    description="Strong performance in current routes suggests potential for geographic expansion."
                    action="Analyze Markets"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

// Helper Components
function InfoRow({ 
  icon, 
  label, 
  value, 
  variant = 'default' 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: React.ReactNode;
  variant?: 'default' | 'primary';
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
        <div className={cn(
          "p-1.5 rounded-lg",
          variant === 'primary' && "bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
        )}>
          {icon}
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{value}</span>
    </div>
  );
}

function StatusBadge({ status, size = 'default' }: { status: string; size?: 'default' | 'lg' }) {
  const variants: Record<string, string> = {
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    'in-transit': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    'in_transit': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    booked: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
  };

  const icons: Record<string, React.ReactNode> = {
    delivered: <CheckCircle2 className={size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'} />,
    cancelled: <XCircle className={size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'} />,
    'in-transit': <Truck className={size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'} />,
    'in_transit': <Truck className={size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'} />,
    booked: <Clock className={size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'} />,
  };

  return (
    <Badge 
      className={cn(
        variants[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
        'flex items-center gap-1',
        size === 'lg' && 'text-sm px-3 py-1'
      )}
    >
      {icons[status]}
      {status.replace(/[-_]/g, ' ')}
    </Badge>
  );
}

function InsightItem({
  icon,
  title,
  description,
  type = 'info'
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  type?: 'positive' | 'warning' | 'info';
}) {
  const colors = {
    positive: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
    warning: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20',
    info: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20',
  };

  return (
    <div className="flex gap-3">
      <div className={cn("p-2 rounded-lg", colors[type])}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-neutral-900 dark:text-neutral-100">{title}</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{description}</p>
      </div>
    </div>
  );
}

function RecommendationItem({
  icon,
  title,
  description,
  action
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
}) {
  return (
    <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
          {icon}
        </div>
        <div className="flex-1">
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{title}</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{description}</p>
          <Button variant="link" size="sm" className="mt-2 p-0 h-auto" rightIcon={<ChevronRight className="h-3 w-3" />}>
            {action}
          </Button>
        </div>
      </div>
    </div>
  );
}