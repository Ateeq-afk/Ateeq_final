import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useArticleBookings } from '@/hooks/useArticleBookings';
import { useArticles } from '@/hooks/useArticles';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import type { Article } from '@/types';
import ArticleForm from './ArticleForm';

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
}

const TIME_RANGES: TimeRange[] = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
  { label: 'Last 6 months', value: 180 },
  { label: 'Last year', value: 365 },
  { label: 'All time', value: 0 },
];

export default function ArticleDetails({ article, onClose, onEdit }: Props) {
  const { getArticle, updateArticle, getArticleRates } = useArticles();
  const { showSuccess } = useNotificationSystem();

  const [current, setCurrent] = useState(article);
  const [isEditing, setIsEditing] = useState(false);
  const [customerRates, setCustomerRates] = useState<CustomerRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'rates' | 'analytics'>('overview');
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
    const avgRate = totalBookings ? totalRevenue / totalQuantity : 0;
    
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
        acc[month] = { bookings: 0, revenue: 0 };
      }
      acc[month].bookings += 1;
      acc[month].revenue += b.total_amount || 0;
      return acc;
    }, {} as Record<string, { bookings: number; revenue: number }>);
    
    return {
      totalBookings,
      totalQuantity,
      totalRevenue,
      avgRate,
      trend,
      statusCounts,
      monthlyData,
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
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{current.name}</h2>
              {current.description && (
                <p className="text-gray-600 mt-1 max-w-2xl">{current.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="font-mono">
                  ID: {current.id.slice(0, 8)}
                </Badge>
                <Badge variant="outline">
                  {formatCurrency(current.base_rate)}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyDetails}
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy details</p>
              </TooltipContent>
            </Tooltip>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => onEdit ? onEdit(current) : setIsEditing(true)}>
              <Edit className="mr-1 h-4 w-4" /> Edit
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{stats.totalBookings}</p>
                {stats.trend !== 0 && (
                  <Badge
                    variant={stats.trend > 0 ? 'default' : 'destructive'}
                    className="flex items-center gap-1"
                  >
                    {stats.trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(stats.trend).toFixed(1)}%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Quantity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalQuantity}</p>
              <p className="text-xs text-gray-500 mt-1">{current.unit_of_measure || 'units'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">Avg: {formatCurrency(stats.avgRate)}/unit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.statusCounts).slice(0, 3).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-gray-600">{status}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'bookings' | 'rates' | 'analytics')} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="grid grid-cols-4 w-[400px]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="rates">Rates</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            {(activeTab === 'bookings' || activeTab === 'analytics') && (
              <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(Number(v))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGES.map(range => (
                    <SelectItem key={range.value} value={range.value.toString()}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Article Information</CardTitle>
                <CardDescription>Complete details about this article</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoRow
                    icon={<IndianRupee className="h-4 w-4" />}
                    label="Base Rate"
                    value={formatCurrency(current.base_rate)}
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
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Special Attributes</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={current.is_fragile ? 'destructive' : 'outline'}
                      className="flex items-center gap-1"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Fragile: {current.is_fragile ? 'Yes' : 'No'}
                    </Badge>
                    <Badge
                      variant={current.requires_special_handling ? 'secondary' : 'outline'}
                      className="flex items-center gap-1"
                    >
                      <ShieldCheck className="h-3 w-3" />
                      Special Handling: {current.requires_special_handling ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>

                {current.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Notes</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-wrap">{current.notes}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Booking History</CardTitle>
                    <CardDescription>
                      {filteredBookings.length} bookings found
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportBookings}
                    disabled={filteredBookings.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredBookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">LR Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parties</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredBookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <span className="font-medium text-blue-600">{booking.lr_number}</span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {formatDate(booking.created_at)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-1">
                                <span>{booking.from_branch_details?.name}</span>
                                <ArrowUpRight className="h-3 w-3 text-gray-400" />
                                <span>{booking.to_branch_details?.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div>
                                <p className="font-medium">{booking.sender?.name || 'N/A'}</p>
                                <p className="text-gray-500">{booking.receiver?.name || 'N/A'}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              {booking.quantity} {booking.uom}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={booking.status} />
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {formatCurrency(booking.total_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No bookings found for this period</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rates Tab */}
          <TabsContent value="rates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Specific Rates</CardTitle>
                <CardDescription>
                  Custom pricing for different customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ratesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : customerRates.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Base Rate</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Custom Rate</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {customerRates.map((rate) => {
                          const discount = ((current.base_rate - rate.rate) / current.base_rate) * 100;
                          return (
                            <tr key={rate.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className={`
                                    h-8 w-8 rounded-full flex items-center justify-center
                                    ${rate.customer_type === 'individual' ? 'bg-blue-100' : 'bg-purple-100'}
                                  `}>
                                    {rate.customer_type === 'individual' ? (
                                      <Users className="h-4 w-4 text-blue-600" />
                                    ) : (
                                      <Building2 className="h-4 w-4 text-purple-600" />
                                    )}
                                  </div>
                                  <span className="font-medium">{rate.customer_name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={rate.customer_type === 'individual' ? 'default' : 'secondary'}>
                                  {rate.customer_type}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right">{formatCurrency(current.base_rate)}</td>
                              <td className="px-4 py-3 text-right font-medium">{formatCurrency(rate.rate)}</td>
                              <td className="px-4 py-3 text-right">
                                <Badge
                                  variant={discount > 0 ? 'default' : discount < 0 ? 'destructive' : 'outline'}
                                  className={`
                                    ${discount > 0 ? 'bg-green-100 text-green-800' : ''}
                                    ${discount < 0 ? 'bg-red-100 text-red-800' : ''}
                                  `}
                                >
                                  {discount > 0 && '↓'} {Math.abs(discount).toFixed(1)}%
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No custom rates configured</p>
                    <p className="text-sm text-gray-400 mt-1">All customers use the base rate</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Trends</CardTitle>
                  <CardDescription>Monthly booking volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.monthlyData).slice(-6).map(([month, data]) => (
                      <div key={month}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{month}</span>
                          <span className="text-sm text-gray-600">{data.bookings} bookings</span>
                        </div>
                        <Progress
                          value={(data.bookings / Math.max(...Object.values(stats.monthlyData).map(d => d.bookings))) * 100}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Distribution</CardTitle>
                  <CardDescription>Monthly revenue breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.monthlyData).slice(-6).map(([month, data]) => (
                      <div key={month}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{month}</span>
                          <span className="text-sm text-gray-600">{formatCurrency(data.revenue)}</span>
                        </div>
                        <Progress
                          value={(data.revenue / Math.max(...Object.values(stats.monthlyData).map(d => d.revenue))) * 100}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                      <Activity className="h-10 w-10 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold">{stats.totalBookings}</p>
                    <p className="text-sm text-gray-600">Total Orders</p>
                  </div>
                  <div className="text-center">
                    <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="h-10 w-10 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(stats.avgRate)}</p>
                    <p className="text-sm text-gray-600">Average Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="h-10 w-10 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

// Helper Components
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-600">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    'in-transit': 'bg-blue-100 text-blue-800',
    booked: 'bg-yellow-100 text-yellow-800',
  };

  const icons: Record<string, React.ReactNode> = {
    delivered: <CheckCircle2 className="h-3 w-3" />,
    cancelled: <XCircle className="h-3 w-3" />,
    'in-transit': <Truck className="h-3 w-3" />,
    booked: <Clock className="h-3 w-3" />,
  };

  return (
    <Badge className={`${variants[status] || 'bg-gray-100 text-gray-800'} flex items-center gap-1`}>
      {icons[status]}
      {status.replace(/[-_]/g, ' ')}
    </Badge>
  );
}