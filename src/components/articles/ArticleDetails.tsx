import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  IndianRupee,
  FileText,
  Calendar,
  Tag,
  Edit,
  Users,
  Building2,
  AlertTriangle,
  ShieldCheck,
  Truck,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBookings } from '@/hooks/useBookings';
import { useCustomers } from '@/hooks/useCustomers';
import { useArticles } from '@/hooks/useArticles';
import { Badge } from '@/components/ui/badge';

interface Props {
  article: Article;
  onClose: () => void;
  onEdit: () => void;
}

interface Booking {
  id: string;
  lr_number: string;
  article_id: string;
  quantity?: number;
  total_amount?: number;
  uom: string;
  status: 'delivered' | 'in_transit' | 'cancelled' | string;
  created_at: string;
  sender?: { name: string };
  receiver?: { name: string };
  from_branch_details?: { name: string };
  to_branch_details?: { name: string };
  payment_type?: string;
}

interface CustomerRate {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_type: 'individual' | 'corporate';
  rate: number;
}

export default function ArticleDetails({ article, onClose, onEdit }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'rates'>('overview');
  const [customerRates, setCustomerRates] = useState<CustomerRate[] | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);

  const { bookings } = useBookings<Booking>();
  const { customers } = useCustomers();
  const { getCustomerRates } = useArticles();

  // 1. Filter bookings for this article
  const articleBookings = useMemo(
    () => bookings.filter(b => b.article_id === article.id),
    [bookings, article.id]
  );

  // 2. Fetch real customer rates when "Rates" tab is activated
  useEffect(() => {
    if (activeTab !== 'rates') return;

    let isMounted = true;
    setRatesLoading(true);

    getCustomerRates(article.id)
      .then((rates) => {
        if (isMounted) setCustomerRates(rates);
      })
      .catch((err) => {
        console.error('Error fetching customer rates:', err);
        if (isMounted) setCustomerRates([]);
      })
      .finally(() => {
        if (isMounted) setRatesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab, article.id, getCustomerRates]);

  // 3. Compute stats
  const stats = useMemo(() => {
    const totalBookings = articleBookings.length;
    const totalQuantity = articleBookings.reduce((sum, b) => sum + (b.quantity || 0), 0);
    const totalRevenue = articleBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const avgRatePerBooking = totalBookings ? totalRevenue / totalBookings : 0;
    return { totalBookings, totalQuantity, totalRevenue, avgRatePerBooking };
  }, [articleBookings]);

  // 4. Date formatting helper
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{article.name}</h2>
            {article.description && <p className="text-gray-600 mt-1">{article.description}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onEdit}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="rates">Customer Rates</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          {/* Article Info */}
          <div className="bg-white rounded-xl border p-6 grid md:grid-cols-2 gap-6">
            {/* Left */}
            <div className="space-y-4">
              <InfoLine icon={<IndianRupee />} label="Base Rate" value={`₹${article.base_rate.toFixed(2)}`} />
              {article.hsn_code && <InfoLine icon={<FileText />} label="HSN Code" value={article.hsn_code} />}
              {article.tax_rate !== undefined && <InfoLine icon={<Tag />} label="Tax Rate" value={`${article.tax_rate}%`} />}
              {article.unit_of_measure && <InfoLine icon={<Package />} label="Unit" value={article.unit_of_measure} />}
            </div>
            {/* Right */}
            <div className="space-y-4">
              <InfoLine icon={<Building2 />} label="Branch" value={article.branch_name || 'N/A'} />
              <InfoLine icon={<Calendar />} label="Created On" value={formatDate(article.created_at)} />
              <div className="flex flex-wrap gap-2">
                {article.is_fragile && <Badge variant="warning" icon={<AlertTriangle />} text="Fragile" />}
                {article.requires_special_handling && <Badge variant="secondary" icon={<ShieldCheck />} text="Special Handling" />}
                {article.min_quantity > 1 && <Badge variant="info" icon={<Package />} text={`Min Qty: ${article.min_quantity}`} />}
              </div>
            </div>
            {article.notes && (
              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">Notes</p>
                <p className="text-gray-600">{article.notes}</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard icon={<BarChart3 />} label="Total Bookings" value={stats.totalBookings} />
            <StatCard icon={<Truck />} label="Total Quantity" value={stats.totalQuantity} />
            <StatCard icon={<IndianRupee />} label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} />
            <StatCard icon={<BarChart3 />} label="Avg. Rate" value={`₹${stats.avgRatePerBooking.toFixed(2)}`} />
          </div>

          {/* Recent Bookings */}
          <SectionWithFallback
            title="Recent Bookings"
            items={articleBookings}
            fallbackMessage="No bookings yet"
            renderItem={(b: Booking) => (
              <BookingCard booking={b} formatDate={formatDate} />
            )}
            onViewAll={() => setActiveTab('bookings')}
          />
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <Table
            data={articleBookings}
            columns={[
              { header: 'LR Number', accessor: 'lr_number', render: v => <span className="text-blue-600 font-medium">{v}</span> },
              { header: 'Date', accessor: 'created_at', render: v => formatDate(v) },
              { header: 'Route', accessor: row => `${row.from_branch_details?.name} → ${row.to_branch_details?.name}` },
              { header: 'Sender', accessor: row => row.sender?.name || 'N/A' },
              { header: 'Receiver', accessor: row => row.receiver?.name || 'N/A' },
              { header: 'Qty', accessor: row => `${row.quantity} ${row.uom}` },
              {
                header: 'Status',
                accessor: 'status',
                render: status => (
                  <Badge
                    variant={status === 'delivered' ? 'success' : status === 'cancelled' ? 'destructive' : 'secondary'}
                    text={status.replace('_', ' ')}
                  />
                )
              },
              { header: 'Amount', accessor: row => `₹${row.total_amount}` },
            ]}
          />
        </TabsContent>

        {/* Rates Tab */}
        <TabsContent value="rates" className="space-y-4">
          {ratesLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6" /></div>
          ) : (
            <Table
              data={customerRates || []}
              columns={[
                { header: 'Customer', accessor: row => <CustomerCell rate={row} /> },
                { header: 'Type', accessor: 'customer_type', render: t => <Badge text={t} variant={t === 'individual' ? 'primary' : 'secondary'} /> },
                { header: 'Base Rate', accessor: () => `₹${article.base_rate.toFixed(2)}`, className: 'text-right' },
                { header: 'Custom Rate', accessor: row => `₹${row.rate.toFixed(2)}`, className: 'text-right' },
                {
                  header: 'Discount',
                  accessor: row => {
                    const disc = ((article.base_rate - row.rate) / article.base_rate) * 100;
                    return <Badge text={`${disc.toFixed(1)}%`} variant={disc > 0 ? 'success' : disc < 0 ? 'destructive' : 'neutral'} />;
                  },
                  className: 'text-right'
                },
              ]}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ——— Helper Components ———

function InfoLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <div className="flex items-center gap-2 mt-1">
        {icon}
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 border">
      <div className="flex items-center gap-2 mb-2">{icon}<p className="text-sm font-medium">{label}</p></div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function SectionWithFallback<T>({
  title,
  items,
  fallbackMessage,
  renderItem,
  onViewAll,
}: {
  title: string;
  items: T[];
  fallbackMessage: string;
  renderItem: (item: T) => React.ReactNode;
  onViewAll: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">{title}</h3>
        {items.length > 3 && (
          <Button variant="outline" size="sm" onClick={onViewAll}>View All</Button>
        )}
      </div>
      {items.length ? (
        <div className="space-y-4">
          {items.slice(0, 3).map(renderItem)}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">{fallbackMessage}</div>
      )}
    </div>
  );
}

function BookingCard({ booking, formatDate }: { booking: Booking; formatDate: (iso: string) => string }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
        <Truck className="h-5 w-5 text-blue-600" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between">
          <p className="font-medium">{booking.lr_number}</p>
          <Badge variant={booking.status === 'delivered' ? 'success' : booking.status === 'cancelled' ? 'destructive' : 'secondary'} text={booking.status.replace('_', ' ')} />
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {booking.quantity} {booking.uom} • ₹{booking.total_amount}
        </p>
        <div className="flex text-xs text-gray-500 gap-4 mt-2">
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5"/> {formatDate(booking.created_at)}</span>
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5"/> {booking.sender?.name} → {booking.receiver?.name}</span>
        </div>
      </div>
    </div>
  );
}

function CustomerCell({ rate }: { rate: CustomerRate }) {
  const Icon = rate.customer_type === 'individual' ? Users : Building2;
  const bg = rate.customer_type === 'individual' ? 'bg-blue-100' : 'bg-purple-100';
  const fg = rate.customer_type === 'individual' ? 'text-blue-600' : 'text-purple-600';
  return (
    <div className="flex items-center gap-3">
      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${bg} ${fg}`}>
        <Icon className="h-4 w-4"/>
      </div>
      <span className="font-medium">{rate.customer_name}</span>
    </div>
  );
}
