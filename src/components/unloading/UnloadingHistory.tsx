import React, { useState } from 'react';
import { Truck, Search, Filter, Calendar, Eye, Download, Printer, Package, User, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUnloading } from '@/hooks/useUnloading';
import UnloadingDetails from './UnloadingDetails';

interface Props {
  organizationId: string;
}

export default function UnloadingHistory({ organizationId }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [selectedOGPL, setSelectedOGPL] = useState<string | null>(null);
  
  const { getCompletedUnloadings, loading, error } = useUnloading(organizationId);
  const [unloadings, setUnloadings] = useState<any[]>([]);
  
  React.useEffect(() => {
    const loadUnloadings = async () => {
      try {
        const data = await getCompletedUnloadings();
        setUnloadings(data || []);
      } catch (err) {
        console.error('Failed to load unloading history:', err);
      }
    };
    
    loadUnloadings();
  }, [getCompletedUnloadings]);
  
  // Filter unloadings based on search and filters
  const filteredUnloadings = React.useMemo(() => {
    return unloadings.filter(unloading => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchLower === '' || 
        unloading.ogpl.ogpl_number.toLowerCase().includes(searchLower) ||
        unloading.ogpl.vehicle?.vehicle_number.toLowerCase().includes(searchLower) ||
        unloading.ogpl.from_station?.name.toLowerCase().includes(searchLower) ||
        unloading.ogpl.to_station?.name.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Vehicle filter
      const matchesVehicle = vehicleFilter === 'all' || unloading.ogpl.vehicle?.id === vehicleFilter;

      // Date filter
      if (dateFilter !== 'all') {
        const unloadingDate = new Date(unloading.unloadedAt);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        switch (dateFilter) {
          case 'today':
            if (unloadingDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'yesterday':
            if (unloadingDate.toDateString() !== yesterday.toDateString()) return false;
            break;
          case 'last_week':
            if (unloadingDate < lastWeek) return false;
            break;
          case 'last_month':
            if (unloadingDate < lastMonth) return false;
            break;
        }
      }

      return matchesVehicle;
    });
  }, [unloadings, searchQuery, dateFilter, vehicleFilter]);

  // Get all unique vehicles for the filter
  const vehicles = React.useMemo(() => {
    const uniqueVehicles = new Map();
    unloadings.forEach(unloading => {
      if (unloading.ogpl.vehicle) {
        uniqueVehicles.set(unloading.ogpl.vehicle.id, unloading.ogpl.vehicle);
      }
    });
    return Array.from(uniqueVehicles.values());
  }, [unloadings]);

  // Get selected unloading details
  const selectedUnloading = selectedOGPL 
    ? unloadings.find(u => u.ogpl.id === selectedOGPL)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Unloading History</h2>
          <p className="text-gray-600 mt-1">
            View past unloading operations
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search by OGPL number or vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last_week">Last Week</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
            </SelectContent>
          </Select>

          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Vehicle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.vehicle_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">OGPL No</th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Date</th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Vehicle</th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">From</th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">To</th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Items</th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Status</th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUnloadings.map((unloading) => {
                const ogpl = unloading.ogpl;
                
                // Count items by status
                const conditions = unloading.conditions || {};
                const goodCount = Object.values(conditions).filter((c: any) => c.status === 'good').length;
                const damagedCount = Object.values(conditions).filter((c: any) => c.status === 'damaged').length;
                const missingCount = Object.values(conditions).filter((c: any) => c.status === 'missing').length;
                
                return (
                  <tr key={ogpl.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 font-medium">{ogpl.ogpl_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{new Date(unloading.unloadedAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{ogpl.vehicle?.vehicle_number}</div>
                          <div className="text-sm text-gray-500 capitalize">{ogpl.vehicle?.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{ogpl.from_station?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{ogpl.to_station?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span>{ogpl.loading_records?.length || 0} LRs</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {goodCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3" />
                            {goodCount} Good
                          </span>
                        )}
                        {damagedCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle className="h-3 w-3" />
                            {damagedCount} Damaged
                          </span>
                        )}
                        {missingCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            <AlertCircle className="h-3 w-3" />
                            {missingCount} Missing
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOGPL(ogpl.id)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {filteredUnloadings.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No unloading records found</h3>
                    <p className="text-gray-500 mt-1">
                      {searchQuery || dateFilter !== 'all' || vehicleFilter !== 'all'
                        ? 'Try adjusting your filters to see more results'
                        : 'No unloading operations have been completed yet'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unloading Details Dialog */}
      <Dialog 
        open={!!selectedOGPL} 
        onOpenChange={(open) => {
          if (!open) setSelectedOGPL(null);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Unloading Details</DialogTitle>
          </DialogHeader>
          {selectedUnloading && (
            <UnloadingDetails
              ogpl={selectedUnloading.ogpl}
              unloadingData={{
                unloadedAt: selectedUnloading.unloadedAt,
                unloadedBy: selectedUnloading.unloadedBy,
                conditions: selectedUnloading.conditions
              }}
              onClose={() => setSelectedOGPL(null)}
              onPrint={() => window.print()}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}