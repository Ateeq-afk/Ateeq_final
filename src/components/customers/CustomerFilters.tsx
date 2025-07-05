import React, { useState } from 'react';
import { Filter, X, Calendar, IndianRupee, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

export interface CustomerFiltersData {
  creditLimitMin?: number;
  creditLimitMax?: number;
  paymentTerms?: string;
  dateRange?: DateRange;
  hasGST?: boolean;
  city?: string;
  state?: string;
  hasEmail?: boolean;
  hasPendingPayments?: boolean;
}

interface Props {
  onApplyFilters: (filters: CustomerFiltersData) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

export default function CustomerFilters({ onApplyFilters, onClearFilters, activeFiltersCount }: Props) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<CustomerFiltersData>({});

  const handleApply = () => {
    onApplyFilters(filters);
    setOpen(false);
  };

  const handleClear = () => {
    setFilters({});
    onClearFilters();
    setOpen(false);
  };

  const handleReset = () => {
    setFilters({});
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Advanced Filters
          {activeFiltersCount > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Advanced Filters</SheetTitle>
          <SheetDescription>
            Apply advanced filters to narrow down your customer search
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Credit Limit Range */}
          <div className="space-y-3">
            <Label>Credit Limit Range</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="Min"
                    className="pl-9"
                    value={filters.creditLimitMin || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      creditLimitMin: e.target.value ? Number(e.target.value) : undefined
                    })}
                  />
                </div>
              </div>
              <div>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="Max"
                    className="pl-9"
                    value={filters.creditLimitMax || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      creditLimitMax: e.target.value ? Number(e.target.value) : undefined
                    })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="space-y-3">
            <Label>Payment Terms</Label>
            <Select
              value={filters.paymentTerms || ''}
              onValueChange={(value) => setFilters({
                ...filters,
                paymentTerms: value || undefined
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All payment terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All payment terms</SelectItem>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="net15">Net 15 Days</SelectItem>
                <SelectItem value="net30">Net 30 Days</SelectItem>
                <SelectItem value="net45">Net 45 Days</SelectItem>
                <SelectItem value="net60">Net 60 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer Since Date Range */}
          <div className="space-y-3">
            <Label>Customer Since</Label>
            <DatePickerWithRange
              date={filters.dateRange}
              onDateChange={(date) => setFilters({ ...filters, dateRange: date })}
            />
          </div>

          {/* Location Filters */}
          <div className="space-y-3">
            <Label>Location</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="City"
                value={filters.city || ''}
                onChange={(e) => setFilters({
                  ...filters,
                  city: e.target.value || undefined
                })}
              />
              <Input
                placeholder="State"
                value={filters.state || ''}
                onChange={(e) => setFilters({
                  ...filters,
                  state: e.target.value || undefined
                })}
              />
            </div>
          </div>

          {/* Boolean Filters */}
          <div className="space-y-3">
            <Label>Additional Filters</Label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.hasGST || false}
                  onChange={(e) => setFilters({
                    ...filters,
                    hasGST: e.target.checked || undefined
                  })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Has GST Number</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.hasEmail || false}
                  onChange={(e) => setFilters({
                    ...filters,
                    hasEmail: e.target.checked || undefined
                  })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Has Email Address</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.hasPendingPayments || false}
                  onChange={(e) => setFilters({
                    ...filters,
                    hasPendingPayments: e.target.checked || undefined
                  })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Has Pending Payments</span>
              </label>
            </div>
          </div>
        </div>

        <SheetFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" onClick={handleClear} className="flex-1">
            Clear All
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}