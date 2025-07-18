import { useState } from 'react';
import {
  Search,
  MoreVertical,
  Download,
  Printer,
  Eye,
  X,
  Plus,
  RefreshCw,
  Package,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import StatusBadge from '../ui/StatusBadge';
import { ResponsiveTable, MobileCard, MobileCardRow, useIsMobile } from '../ui/responsive-table';

import { useBookings } from '@/hooks/useBookings';
import { useBranches } from '../../hooks/useBranches';
import { useFilteredSortedBookings } from '../../hooks/useFilteredSortedBookings';
import { printBookings, downloadBookingLR } from '../../utils/printUtils';
import { usePOD } from '@/hooks/usePOD';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import type { Booking, SortDirection } from '../../types';

// Define types locally since the ones in types have different structure
interface Filters {
  search: string;
  dateRange: string;
  status: string;
  paymentType: string;
  branch: string;
}

type SortField = 'lr_number' | 'created_at' | 'total_amount';

// If these modals live elsewhere, adjust paths accordingly:
import BookingModification from './BookingModification';
import BookingCancellation from './BookingCancellation';
import ProofOfDelivery from './ProofOfDelivery';

const DEFAULT_FILTERS: Filters = {
  search: '',
  dateRange: 'all',
  status: 'all',
  paymentType: 'all',
  branch: 'all',
};

export default function BookingList() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // UI State
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showModifyId, setShowModifyId] = useState<string | null>(null);
  const [showCancelId, setShowCancelId] = useState<string | null>(null);
  const [showPODId, setShowPODId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Data Fetching
  const { bookings, loading: isLoading, error, refresh, updateBookingStatus } = useBookings();
  const { branches } = useBranches();
  const { submitPOD } = usePOD();
  const { showSuccess, showError } = useNotificationSystem();

  // Filter & Sort
  const filtered = useFilteredSortedBookings(
    bookings,
    filters,
    sortField,
    sortDirection
  );

  // Handlers
  const handleFilterChange = (key: keyof Filters, value: string) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  const toggleSelect = (id: string) =>
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const toggleSelectAll = () =>
    setSelectedIds(prev =>
      prev.length === filtered.length ? [] : filtered.map(b => b.id)
    );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleRefresh = () => refresh();
  const handlePrint = () =>
    printBookings(
      selectedIds.length
        ? filtered.filter(b => selectedIds.includes(b.id))
        : filtered
    );
  const handleDownload = (booking: Booking) => downloadBookingLR(booking);

  // POD submission handler
  const handlePODSubmit = async (data: any) => {
    try {
      await submitPOD(data);
      setShowPODId(null);
      showSuccess('POD Submitted', 'Proof of delivery has been recorded successfully');
      refresh(); // Refresh the booking list to update statuses
    } catch (err) {
      console.error('Failed to submit POD:', err);
      showError('POD Submission Failed', err instanceof Error ? err.message : 'Failed to submit proof of delivery');
    }
  };

  // Booking click handler
  const handleBookingClick = (booking: Booking) => {
    // If booking is delivered, show POD form
    if (booking.status === 'delivered') {
      setShowPODId(booking.id);
    } else {
      // Otherwise navigate to booking details
      navigate(`/dashboard/bookings/${booking.id}`);
    }
  };

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div>Error loading bookings.</div>;

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="bg-gradient-to-r from-brand-50 to-brand-100 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Bookings</h2>
          <p className="text-muted-foreground">{filtered.length} found</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="border-border text-foreground hover:bg-accent"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Paginated' : 'Show All'}
          </Button>
          <Button
            variant="outline"
            className="border-border text-foreground hover:bg-accent"
            onClick={handlePrint}
          >
            <Printer className="mr-1 h-4 w-4" />
            Print
          </Button>
          <Button
            variant="outline"
            className="border-border text-foreground hover:bg-accent"
            onClick={handleRefresh}
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => navigate('/dashboard/new-booking')}
          >
            <Plus className="mr-1 h-4 w-4" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-2xl shadow-sm border border-border grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={filters.dateRange}
          onValueChange={v => handleFilterChange('dateRange', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="last_week">Last Week</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.status}
          onValueChange={v => handleFilterChange('status', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="unloaded">Unloaded</SelectItem>
            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="pod_received">POD Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.paymentType}
          onValueChange={v => handleFilterChange('paymentType', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="To Pay">To Pay</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.branch}
          onValueChange={v => handleFilterChange('branch', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {branches.map(b => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        {/* Mobile view */}
        {isMobile ? (
          <div className="p-4 space-y-3">
            {(showAll ? filtered : filtered.slice(0, 100)).map((booking) => (
              <MobileCard key={booking.id}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-primary font-medium">{booking.lr_number}</span>
                    <div className="text-xs text-muted-foreground">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
                <MobileCardRow label="Route" value={`${booking.from_branch_details?.name || 'N/A'} → ${booking.to_branch_details?.name || 'N/A'}`} />
                <MobileCardRow label="Sender" value={booking.sender?.name || 'N/A'} />
                <MobileCardRow label="Receiver" value={booking.receiver?.name || 'N/A'} />
                <MobileCardRow label="Articles" value={`${booking.booking_articles?.length || 1} ${(booking.booking_articles?.length || 1) === 1 ? 'item' : 'items'}`} />
                <MobileCardRow label="Amount" value={`₹${booking.total_amount.toFixed(2)}`} />
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/dashboard/bookings/${booking.id}`)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => downloadBookingLR(booking)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download LR
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/dashboard/bookings/${booking.id}/print`)}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </MobileCard>
            ))}
          </div>
        ) : (
          <ResponsiveTable>
            <table className="w-full text-sm">
          <thead className="bg-muted/50 text-foreground">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filtered.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer"
                onClick={() => handleSort('lr_number')}
              >
                LR Number
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer"
                onClick={() => handleSort('created_at')}
              >
                Date
              </th>
              <th className="px-4 py-3 text-left">From</th>
              <th className="px-4 py-3 text-left">To</th>
              <th className="px-4 py-3 text-left">Sender</th>
              <th className="px-4 py-3 text-left">Receiver</th>
              <th className="px-4 py-3 text-left">Articles</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th
                className="px-4 py-3 text-left cursor-pointer"
                onClick={() => handleSort('total_amount')}
              >
                Amount
              </th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(showAll ? filtered : filtered.slice(0, 100)).map((booking) => (
              <tr key={booking.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(booking.id)}
                    onChange={() => toggleSelect(booking.id)}
                  />
                </td>
                <td
                  className="px-4 py-3 text-primary font-medium cursor-pointer hover:underline"
                  onClick={() => handleBookingClick(booking)}
                >
                  {booking.lr_number}
                </td>
                <td className="px-4 py-3">
                  <div>{new Date(booking.created_at).toLocaleDateString()}</div>
                  <div className="text-muted-foreground text-xs">
                    {new Date(booking.created_at).toLocaleTimeString()}
                  </div>
                </td>
                <td className="px-4 py-3">{booking.from_branch_details?.name}</td>
                <td className="px-4 py-3">{booking.to_branch_details?.name}</td>
                <td className="px-4 py-3">{booking.sender?.name}</td>
                <td className="px-4 py-3">{booking.receiver?.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {booking.booking_articles?.length || 1} {(booking.booking_articles?.length || 1) === 1 ? 'item' : 'items'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={booking.status} />
                </td>
                <td className="px-4 py-3">₹{booking.total_amount}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleBookingClick(booking)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDownload(booking)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download LR
                        </DropdownMenuItem>
                        {booking.status === 'delivered' && (
                          <DropdownMenuItem
                            onClick={() => setShowPODId(booking.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Enter POD
                          </DropdownMenuItem>
                        )}
                        {(['booked', 'in_transit'] as Booking['status'][]).includes(
                          booking.status
                        ) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setShowCancelId(booking.id)}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Cancel Booking
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center py-8 text-muted-foreground">
                  <Package className="mx-auto mb-2" />
                  No bookings found
                </td>
              </tr>
            )}
          </tbody>
            </table>
          </ResponsiveTable>
        )}
      </div>

      {/* Modals */}
      {showModifyId && (
        <BookingModification
          bookingId={showModifyId}
          onClose={() => setShowModifyId(null)}
          onSubmit={() => refresh()}
        />
      )}
      {showCancelId && (
        <BookingCancellation
          bookingId={showCancelId}
          onClose={() => setShowCancelId(null)}
          onSubmit={() => refresh()}
        />
      )}
      {showPODId && (
        <ProofOfDelivery
          bookingId={showPODId}
          onClose={() => setShowPODId(null)}
          onSubmit={handlePODSubmit}
        />
      )}
    </div>
  );
}