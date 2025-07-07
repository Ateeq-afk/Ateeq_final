import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { loadingService, OGPL } from '@/services/loading';
import { useBookings } from '@/hooks/useBookings';
import { motion } from 'framer-motion';

interface ManageOGPLBookingsProps {
  isOpen: boolean;
  onClose: () => void;
  ogpl: OGPL;
  onSuccess: () => void;
}

export default function ManageOGPLBookings({ 
  isOpen, 
  onClose, 
  ogpl,
  onSuccess 
}: ManageOGPLBookingsProps) {
  const [activeTab, setActiveTab] = useState<'current' | 'add'>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableBookings, setAvailableBookings] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  
  const { showSuccess, showError } = useNotificationSystem();
  const { getPendingBookings } = useBookings();

  // Load available bookings when "add" tab is selected
  useEffect(() => {
    if (activeTab === 'add' && availableBookings.length === 0) {
      loadAvailableBookings();
    }
  }, [activeTab]);

  const loadAvailableBookings = async () => {
    try {
      setIsLoadingBookings(true);
      const bookings = await getPendingBookings();
      // Filter out bookings that are already in this OGPL
      const currentBookingIds = ogpl.loading_records?.map(r => r.booking_id) || [];
      const filtered = bookings.filter(b => !currentBookingIds.includes(b.id));
      setAvailableBookings(filtered);
    } catch (error) {
      console.error('Failed to load available bookings:', error);
      showError('Loading Failed', 'Failed to load available bookings');
    } finally {
      setIsLoadingBookings(false);
    }
  };

  // Filter current bookings based on search
  const filteredCurrentBookings = ogpl.loading_records?.filter(record => {
    const booking = record.booking;
    if (!booking) return false;
    const searchLower = searchQuery.toLowerCase();
    return (
      booking.lr_number?.toLowerCase().includes(searchLower) ||
      booking.sender?.name?.toLowerCase().includes(searchLower) ||
      booking.receiver?.name?.toLowerCase().includes(searchLower) ||
      booking.article?.name?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Filter available bookings based on search
  const filteredAvailableBookings = availableBookings.filter(booking => {
    const searchLower = searchQuery.toLowerCase();
    return (
      booking.lr_number?.toLowerCase().includes(searchLower) ||
      booking.sender?.name?.toLowerCase().includes(searchLower) ||
      booking.receiver?.name?.toLowerCase().includes(searchLower) ||
      booking.article?.name?.toLowerCase().includes(searchLower)
    );
  });

  // Toggle booking selection
  const toggleBookingSelection = (bookingId: string) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  // Select all bookings
  const selectAllBookings = () => {
    if (activeTab === 'current') {
      const allIds = filteredCurrentBookings.map(r => r.booking_id);
      setSelectedBookings(allIds);
    } else {
      const allIds = filteredAvailableBookings.map(b => b.id);
      setSelectedBookings(allIds);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedBookings([]);
  };

  // Add bookings to OGPL
  const handleAddBookings = async () => {
    if (selectedBookings.length === 0) {
      showError('No Selection', 'Please select bookings to add');
      return;
    }

    try {
      setIsSubmitting(true);
      await loadingService.addBookingsToOGPL(ogpl.id, selectedBookings);
      showSuccess('Bookings Added', `${selectedBookings.length} bookings added to OGPL`);
      clearSelection();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to add bookings:', error);
      showError('Add Failed', error instanceof Error ? error.message : 'Failed to add bookings');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove bookings from OGPL
  const handleRemoveBookings = async () => {
    if (selectedBookings.length === 0) {
      showError('No Selection', 'Please select bookings to remove');
      return;
    }

    try {
      setIsSubmitting(true);
      await loadingService.removeBookingsFromOGPL(ogpl.id, selectedBookings);
      showSuccess('Bookings Removed', `${selectedBookings.length} bookings removed from OGPL`);
      clearSelection();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to remove bookings:', error);
      showError('Remove Failed', error instanceof Error ? error.message : 'Failed to remove bookings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Manage Bookings - {ogpl?.ogpl_number}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'current' | 'add')} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">
                Current Bookings ({ogpl.loading_records?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="add">
                Add New Bookings
              </TabsTrigger>
            </TabsList>

            {/* Search and Actions */}
            <div className="flex items-center gap-4 py-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {selectedBookings.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedBookings.length} selected
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {/* Current Bookings Tab */}
            <TabsContent value="current" className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                {filteredCurrentBookings.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllBookings}
                      >
                        Select All
                      </Button>
                      {selectedBookings.length > 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveBookings}
                          disabled={isSubmitting || ogpl.status !== 'created'}
                          className="flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Remove Selected
                        </Button>
                      )}
                    </div>
                    
                    {ogpl.status !== 'created' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <p className="text-sm text-yellow-700">
                            Cannot modify bookings for OGPL in '{ogpl.status}' status
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3">
                              <input
                                type="checkbox"
                                checked={selectedBookings.length === filteredCurrentBookings.length && filteredCurrentBookings.length > 0}
                                onChange={() => {
                                  if (selectedBookings.length === filteredCurrentBookings.length) {
                                    clearSelection();
                                  } else {
                                    selectAllBookings();
                                  }
                                }}
                                disabled={ogpl.status !== 'created'}
                                className="rounded"
                              />
                            </th>
                            <th className="text-left p-3 text-sm font-medium text-gray-600">LR Number</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-600">Sender</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-600">Receiver</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-600">Article</th>
                            <th className="text-right p-3 text-sm font-medium text-gray-600">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredCurrentBookings.map(record => {
                            const booking = record.booking;
                            if (!booking) return null;
                            
                            return (
                              <motion.tr 
                                key={record.id}
                                className={`hover:bg-gray-50 ${
                                  selectedBookings.includes(booking.id) ? 'bg-blue-50' : ''
                                }`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                <td className="p-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedBookings.includes(booking.id)}
                                    onChange={() => toggleBookingSelection(booking.id)}
                                    disabled={ogpl.status !== 'created'}
                                    className="rounded"
                                  />
                                </td>
                                <td className="p-3 font-medium text-blue-600">{booking.lr_number}</td>
                                <td className="p-3 text-sm">{booking.sender?.name || 'N/A'}</td>
                                <td className="p-3 text-sm">{booking.receiver?.name || 'N/A'}</td>
                                <td className="p-3 text-sm">{booking.article?.name || 'N/A'}</td>
                                <td className="p-3 text-sm text-right font-medium">
                                  ₹{booking.total_amount?.toFixed(2) || '0.00'}
                                </td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Package className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">No bookings in this OGPL</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Add Bookings Tab */}
            <TabsContent value="add" className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                {isLoadingBookings ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : filteredAvailableBookings.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllBookings}
                      >
                        Select All
                      </Button>
                      {selectedBookings.length > 0 && (
                        <Button
                          size="sm"
                          onClick={handleAddBookings}
                          disabled={isSubmitting || ogpl.status !== 'created'}
                          className="flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          Add Selected ({selectedBookings.length})
                        </Button>
                      )}
                    </div>

                    {ogpl.status !== 'created' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <p className="text-sm text-yellow-700">
                            Cannot add bookings to OGPL in '{ogpl.status}' status
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3">
                              <input
                                type="checkbox"
                                checked={selectedBookings.length === filteredAvailableBookings.length && filteredAvailableBookings.length > 0}
                                onChange={() => {
                                  if (selectedBookings.length === filteredAvailableBookings.length) {
                                    clearSelection();
                                  } else {
                                    selectAllBookings();
                                  }
                                }}
                                disabled={ogpl.status !== 'created'}
                                className="rounded"
                              />
                            </th>
                            <th className="text-left p-3 text-sm font-medium text-gray-600">LR Number</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-600">From → To</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-600">Sender</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-600">Receiver</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-600">Article</th>
                            <th className="text-right p-3 text-sm font-medium text-gray-600">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredAvailableBookings.map(booking => (
                            <motion.tr 
                              key={booking.id}
                              className={`hover:bg-gray-50 cursor-pointer ${
                                selectedBookings.includes(booking.id) ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => toggleBookingSelection(booking.id)}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <td className="p-3">
                                <input
                                  type="checkbox"
                                  checked={selectedBookings.includes(booking.id)}
                                  onChange={() => toggleBookingSelection(booking.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  disabled={ogpl.status !== 'created'}
                                  className="rounded"
                                />
                              </td>
                              <td className="p-3 font-medium text-blue-600">{booking.lr_number}</td>
                              <td className="p-3 text-sm">
                                {booking.from_branch_details?.name} → {booking.to_branch_details?.name}
                              </td>
                              <td className="p-3 text-sm">{booking.sender?.name || 'N/A'}</td>
                              <td className="p-3 text-sm">{booking.receiver?.name || 'N/A'}</td>
                              <td className="p-3 text-sm">{booking.article?.name || 'N/A'}</td>
                              <td className="p-3 text-sm text-right font-medium">
                                ₹{booking.total_amount?.toFixed(2) || '0.00'}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Package className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">
                      {searchQuery ? 'No matching bookings found' : 'No available bookings to add'}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}