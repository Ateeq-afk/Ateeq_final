import React, { useState } from 'react';
import { 
  AlertTriangle, 
  X, 
  Loader2, 
  CheckCircle2, 
  Package, 
  Calendar, 
  MapPin, 
  User, 
  FileText 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBookings } from '@/hooks/useBookings';
import { motion } from 'framer-motion';
import type { Booking } from '@/types';

interface BookingCancellationProps {
  bookingId: string;
  onClose: () => void;
  onSubmit: (bookingId: string, reason: string) => Promise<void>;
}

export default function BookingCancellation({ bookingId, onClose, onSubmit }: BookingCancellationProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { bookings } = useBookings();
  const booking = bookings.find(b => b.id === bookingId);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await onSubmit(bookingId, reason);
      
      setSuccess(true);
      
      // Close after a delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };
  
  if (!booking) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl max-w-lg w-full mx-4 p-8">
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Booking Not Found</h3>
              <p className="text-gray-600 mt-2">The booking you're trying to cancel could not be found.</p>
              <Button onClick={onClose} className="mt-4">Close</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Check if booking can be cancelled
  const canCancel = booking.status === 'booked' || booking.status === 'in_transit';
  
  if (!canCancel) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl max-w-lg w-full mx-4 p-8">
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Cannot Cancel Booking</h3>
              <p className="text-gray-600 mt-2">
                This booking cannot be cancelled because it has been {booking.status}.
              </p>
              <Button onClick={onClose} className="mt-4">Close</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl max-w-lg w-full mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cancel Booking</h2>
              <p className="text-gray-600">LR #{booking.lr_number}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-green-700">Booking cancelled successfully!</p>
            </div>
          )}
          
          {!success && (
            <>
              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Are you sure you want to cancel this booking?</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      This action cannot be undone. The booking will be marked as cancelled and will no longer be processed.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Booking Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Booking Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Article:</span>
                    </div>
                    <p className="font-medium ml-6">{booking.article?.name || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Date:</span>
                    </div>
                    <p className="font-medium ml-6">{new Date(booking.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Route:</span>
                    </div>
                    <p className="font-medium ml-6">{booking.from_branch_details?.name} → {booking.to_branch_details?.name}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Amount:</span>
                    </div>
                    <p className="font-medium ml-6">₹{booking.total_amount} ({booking.payment_type})</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Sender:</span>
                    </div>
                    <p className="font-medium ml-6">{booking.sender?.name || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Receiver:</span>
                    </div>
                    <p className="font-medium ml-6">{booking.receiver?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {/* Cancellation Reason */}
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <Label htmlFor="reason">Reason for Cancellation <span className="text-red-500">*</span></Label>
                  <Input
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please provide a reason for cancellation"
                    className="mt-1"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This information will be recorded for audit purposes.
                  </p>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || !reason.trim()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Confirm Cancellation'
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}