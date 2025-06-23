import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

import { fetchBookings } from '../../services/bookings';
import { useBranches } from '../../hooks/useBranches';
import { useFilteredSortedBookings } from '../../hooks/useFilteredSortedBookings';
import { printBookings, downloadBookingLR } from '../../utils/printUtils';
import type { Booking, Filters, SortField, SortDirection } from '../../types';

const DEFAULT_FILTERS: Filters = {
  search: '',
  dateRange: 'all',
  status: 'all',
  paymentType: 'all',
  branch: 'all',
};

export default function BookingList() {
  const navigate = useNavigate();

  // UI State
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showModifyId, setShowModifyId] = useState<string | null>(null);
  const [showCancelId, setShowCancelId] = useState<string | null>(null);
  const [showPODId, setShowPODId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Data Fetching via React Query
  const { data: bookings = [], isLoading, isError, refetch } = useQuery({
  queryKey: ['bookings'],
  queryFn: fetchBookings,
  staleTime: 300_000,
});

  const { branches } = useBranches();

  // Filter & Sort
  const filtered = useFilteredSortedBookings(bookings, filters, sortField, sortDirection);

  // Handlers
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => (prev.length === filtered.length ? [] : filtered.map(b => b.id)));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleRefresh = () => refetch();
  const handlePrint = () => printBookings(selectedIds.length ? filtered.filter(b => selectedIds.includes(b.id)) : filtered);
  const handleDownload = (booking: Booking) => downloadBookingLR(booking);

  if (isLoading) return <div>Loading…</div>;
  if (isError) return <div>Error loading bookings.</div>;

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Bookings</h2>
          <p className="text-gray-600">{filtered.length} found</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Paginated' : 'Show All'}
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer /><span>Print</span>
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw /><span>Refresh</span>
          </Button>
          <Button onClick={() => navigate('/dashboard/new-booking')}>
            <Plus /><span>New Booking</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search..."
            value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filters.dateRange} onValueChange={v => handleFilterChange('dateRange', v)}>
          <SelectTrigger><SelectValue placeholder="Date" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="last_week">Last Week</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={v => handleFilterChange('status', v)}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.paymentType} onValueChange={v => handleFilterChange('paymentType', v)}>
          <SelectTrigger><SelectValue placeholder="Payment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="To Pay">To Pay</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.branch} onValueChange={v => handleFilterChange('branch', v)}>
          <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th><input type="checkbox" checked={selectedIds.length === filtered.length} onChange={toggleSelectAll} /></th>
              <th onClick={() => handleSort('lr_number')}>LR Number</th>
              <th onClick={() => handleSort('created_at')}>Date</th>
              <th>From</th>
              <th>To</th>
              <th>Sender</th>
              <th>Receiver</th>
              <th>Status</th>
              <th onClick={() => handleSort('total_amount')}>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(showAll ? filtered : filtered.slice(0, 100)).map(booking => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td><input type="checkbox" checked={selectedIds.includes(booking.id)} onChange={() => toggleSelect(booking.id)} /></td>
                <td className="text-blue-600 font-medium cursor-pointer" onClick={() => navigate(`/dashboard/bookings/${booking.id}`)}>{booking.lr_number}</td>
                <td>
                  <div>{new Date(booking.created_at).toLocaleDateString()}</div>
                  <div className="text-gray-500 text-xs">{new Date(booking.created_at).toLocaleTimeString()}</div>
                </td>
                <td>{booking.from_branch_details?.name}</td>
                <td>{booking.to_branch_details?.name}</td>
                <td>{booking.sender?.name}</td>
                <td>{booking.receiver?.name}</td>
                <td><StatusBadge status={booking.status} /></td>
                <td>₹{booking.total_amount}</td>
                <td>
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/bookings/${booking.id}`)}><Eye /></Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* No status-change actions since SMS and status props removed */}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDownload(booking)}><Download />Download LR</DropdownMenuItem>
                        {(['booked','in_transit'] as Booking['status'][]).includes(booking.status) && <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => setShowCancelId(booking.id)}><X />Cancel Booking</DropdownMenuItem>
                        </>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-500">
                  <Package className="mx-auto mb-2" />
                  No bookings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showModifyId && <BookingModification bookingId={showModifyId} onClose={() => setShowModifyId(null)} onSubmit={() => refetch()} />}
      {showCancelId && <BookingCancellation bookingId={showCancelId} onClose={() => setShowCancelId(null)} onSubmit={() => refetch()} />}
      {showPODId && <ProofOfDelivery bookingId={showPODId} onClose={() => setShowPODId(null)} onSubmit={() => refetch()} />}
    </div>
  );
}