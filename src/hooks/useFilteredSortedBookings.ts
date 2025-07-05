import { useMemo } from 'react';
import type { Booking } from '../types';

// Local type definitions for this hook
interface LocalFilters {
  search: string;
  status: string;
  paymentType: string;
  branch: string;
  dateRange: string;
}

type LocalSortField = 'lr_number' | 'created_at' | 'total_amount';
type LocalSortDirection = 'asc' | 'desc';

export function useFilteredSortedBookings(
  bookings: Booking[],
  filters: LocalFilters,
  sortField: LocalSortField,
  sortDirection: LocalSortDirection
) {
  return useMemo(() => {
    const { search, status, paymentType, branch, dateRange } = filters;
    let result = bookings.filter(b => {
      const matchesSearch = [
        b.lr_number,
        b.sender?.name,
        b.receiver?.name
      ].some(field => field?.toLowerCase().includes(search.toLowerCase()));
      if (!matchesSearch) return false;
      if (status !== 'all' && b.status !== status) return false;
      if (paymentType !== 'all' && b.payment_type !== paymentType) return false;
      if (branch !== 'all' && b.from_branch !== branch && b.to_branch !== branch) return false;
      if (dateRange !== 'all') {
        const date = new Date(b.created_at);
        const now = new Date();
        if (dateRange === 'today' && date.toDateString() !== now.toDateString()) return false;
        if (dateRange === 'last_week' && date < new Date(now.setDate(now.getDate() - 7))) return false;
        if (dateRange === 'last_month' && date < new Date(now.setMonth(now.getMonth() - 1))) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortField === 'lr_number') {
        return sortDirection === 'asc'
          ? a.lr_number.localeCompare(b.lr_number)
          : b.lr_number.localeCompare(a.lr_number);
      }
      if (sortField === 'created_at') {
        return sortDirection === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortField === 'total_amount') {
        return sortDirection === 'asc'
          ? a.total_amount - b.total_amount
          : b.total_amount - a.total_amount;
      }
      return 0;
    });

    return result;
  }, [bookings, filters, sortField, sortDirection]);
}