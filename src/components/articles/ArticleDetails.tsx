// src/components/articles/ArticleDetails.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Package as PackageIcon,
  Edit,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Truck,
  BarChart3,
  IndianRupee,
  Calendar,
  Users,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import ArticleForm from './ArticleForm';
import { useArticleBookings } from '@/hooks/useArticleBookings';
import { useArticles } from '@/hooks/useArticles';
import type { Article } from '@/types';
import type { Booking as BookingType } from '@/hooks/useArticleBookings';

interface Props {
  article: Article;
  onClose: () => void;
}

interface CustomerRate {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_type: 'individual' | 'corporate';
  rate: number;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export default function ArticleDetails({ article, onClose }: Props) {
  const { getArticle, updateArticle, getArticleRates } = useArticles();

  // local copy of article so we can re-fetch after editing
  const [current, setCurrent] = useState(article);
  const [isEditing, setIsEditing] = useState(false);

  // 1) load bookings for this article
  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
  } = useArticleBookings(current.id);

  // 2) load customer‐rates on demand
  const [customerRates, setCustomerRates] = useState<CustomerRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'rates'>('overview');

  // after saving an edit, re-fetch the article
  useEffect(() => {
    if (!isEditing) {
      getArticle(current.id).then(setCurrent);
    }
  }, [isEditing, current.id, getArticle]);

  // load rates when you switch to the "rates" tab
  useEffect(() => {
    let mounted = true;
    if (activeTab === 'rates') {
      setRatesLoading(true);
      getArticleRates(current.id)
        .then((r) => mounted && setCustomerRates(r))
        .catch(() => mounted && setCustomerRates([]))
        .finally(() => mounted && setRatesLoading(false));
    }
    return () => {
      mounted = false;
    };
  }, [activeTab, current.id, getArticleRates]);

  // compute quick‐stats
  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const totalQuantity = bookings.reduce((sum, b) => sum + (b.quantity || 0), 0);
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const avgRate = totalBookings ? totalRevenue / totalBookings : 0;
    return { totalBookings, totalQuantity, totalRevenue, avgRate };
  }, [bookings]);

  // 3) show the edit form when editing
  if (isEditing) {
    return (
      <ArticleForm
        initialData={current}
        onCancel={() => setIsEditing(false)}
        onSubmit={async (data) => {
          await updateArticle(current.id, data);
          setIsEditing(false);
        }}
      />
    );
  }

  // 4) error loading bookings?
  if (bookingsError) {
    return <div className="p-6 text-red-600 text-center">Error: {bookingsError.message}</div>;
  }

  // 5) normal render
  return (
    <div className="space-y-6">
      {/* === Header with Close/Edit */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <PackageIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{current.name}</h2>
            {current.description && <p className="text-gray-600 mt-1">{current.description}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="mr-1 h-4 w-4" /> Edit
          </Button>
        </div>
      </div>

      {/* === Tabs for Overview / Bookings / Rates */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="rates">Customer Rates</TabsTrigger>
        </TabsList>

        {/* -- Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="bg-white rounded-xl border p-6 grid md:grid-cols-2 gap-6">
            <InfoLine
              icon={<Calendar />}
              label="Created On"
              value={formatDate(current.created_at)}
            />
            <div className="flex flex-wrap gap-2">
              {current.is_fragile && (
                <Badge variant="warning" icon={<AlertTriangle />} text="Fragile" />
              )}
              {current.requires_special_handling && (
                <Badge variant="secondary" icon={<ShieldCheck />} text="Special Handling" />
              )}
              {current.min_quantity > 1 && (
                <Badge variant="info" icon={<Truck />} text={`Min Qty: ${current.min_quantity}`} />
              )}
            </div>
            {current.notes && (
              <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">Notes</p>
                <p className="text-gray-600">{current.notes}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard icon={<BarChart3 />} label="Total Bookings" value={stats.totalBookings} />
            <StatCard icon={<Truck />} label="Total Quantity" value={stats.totalQuantity} />
            <StatCard
              icon={<IndianRupee />}
              label="Total Revenue"
              value={`₹${stats.totalRevenue.toLocaleString()}`}
            />
            <StatCard
              icon={<BarChart3 />}
              label="Avg Rate"
              value={`₹${stats.avgRate.toFixed(2)}`}
            />
          </div>
        </TabsContent>

        {/* -- Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
          {bookingsLoading ? (
            <CenterLoader />
          ) : bookings.length ? (
            <BookingsTable data={bookings} />
          ) : (
            <EmptyState message="No bookings yet" />
          )}
        </TabsContent>

        {/* -- Rates Tab */}
        <TabsContent value="rates" className="space-y-4">
          {ratesLoading ? (
            <CenterLoader />
          ) : customerRates.length ? (
            <RatesTable rates={customerRates} baseRate={current.base_rate} />
          ) : (
            <EmptyState message="No customer rates available" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ——— Support components below ———

function CenterLoader() {
  return (
    <div className="py-12 flex justify-center">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="text-center py-12 text-gray-500">{message}</div>;
}

function BookingsTable({ data }: { data: BookingType[] }) {
  return (
    <div className="overflow-x-auto bg-white border rounded-lg">
      <table className="w-full">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-4 py-2 text-left">LR Number</th>
            <th className="px-4 py-2 text-left">Date</th>
            <th className="px-4 py-2 text-left">Route</th>
            <th className="px-4 py-2 text-left">Sender</th>
            <th className="px-4 py-2 text-left">Receiver</th>
            <th className="px-4 py-2 text-right">Qty</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((b) => (
            <tr key={b.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-blue-600 font-medium">{b.lr_number}</td>
              <td className="px-4 py-2">{formatDate(b.created_at)}</td>
              <td className="px-4 py-2">
                {b.from_branch_details?.name} → {b.to_branch_details?.name}
              </td>
              <td className="px-4 py-2">{b.sender?.name || 'N/A'}</td>
              <td className="px-4 py-2">{b.receiver?.name || 'N/A'}</td>
              <td className="px-4 py-2 text-right">
                {b.quantity} {b.uom}
              </td>
              <td className="px-4 py-2">
                <Badge
                  variant={
                    b.status === 'delivered'
                      ? 'success'
                      : b.status === 'cancelled'
                      ? 'destructive'
                      : 'secondary'
                  }
                  text={b.status.replace('_', ' ')}
                />
              </td>
              <td className="px-4 py-2 text-right">₹{b.total_amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RatesTable({
  rates,
  baseRate,
}: {
  rates: CustomerRate[];
  baseRate: number;
}) {
  return (
    <div className="overflow-x-auto bg-white border rounded-lg">
      <table className="w-full">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-4 py-2 text-left">Customer</th>
            <th className="px-4 py-2 text-left">Type</th>
            <th className="px-4 py-2 text-right">Base Rate</th>
            <th className="px-4 py-2 text-right">Custom Rate</th>
            <th className="px-4 py-2 text-right">Discount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rates.map((r) => {
            const disc = ((baseRate - r.rate) / baseRate) * 100;
            return (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <CustomerCell rate={r} />
                </td>
                <td className="px-4 py-2">
                  <Badge
                    text={r.customer_type}
                    variant={r.customer_type === 'individual' ? 'primary' : 'secondary'}
                  />
                </td>
                <td className="px-4 py-2 text-right">₹{baseRate.toFixed(2)}</td>
                <td className="px-4 py-2 text-right">₹{r.rate.toFixed(2)}</td>
                <td className="px-4 py-2 text-right">
                  <Badge
                    text={`${disc.toFixed(1)}%`}
                    variant={disc > 0 ? 'success' : disc < 0 ? 'destructive' : 'neutral'}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
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

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 border">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function CustomerCell({ rate }: { rate: CustomerRate }) {
  const IconComp = rate.customer_type === 'individual' ? Users : Building2;
  const bg = rate.customer_type === 'individual' ? 'bg-blue-100' : 'bg-purple-100';
  const fg = rate.customer_type === 'individual' ? 'text-blue-600' : 'text-purple-600';

  return (
    <div className="flex items-center gap-3">
      <div className={`${bg} ${fg} h-8 w-8 rounded-full flex items-center justify-center`}>
        <IconComp className="h-4 w-4" />
      </div>
      <span className="font-medium">{rate.customer_name}</span>
    </div>
  );
}
