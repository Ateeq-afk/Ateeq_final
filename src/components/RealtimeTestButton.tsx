import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Package, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Temporarily disable optimistic updates import
// import { bookingUpdates, createOptimisticId } from '@/services/optimisticUpdates';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function RealtimeTestButton() {
  const [isCreating, setIsCreating] = useState(false);
  const [lastCreated, setLastCreated] = useState<any>(null);

  const simulateBookingCreation = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    
    // Create mock booking data
    const mockBooking = {
      id: `MOCK-${Date.now()}`,
      lr_number: `TEST-${Date.now().toString().slice(-6)}`,
      from_location: 'Mumbai',
      to_location: 'Delhi',
      status: 'booked',
      customer_name: 'Test Customer',
      amount: Math.floor(Math.random() * 50000) + 5000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Simulate API call without optimistic updates
    setTimeout(() => {
      setLastCreated(mockBooking);
      setIsCreating(false);
      toast.success(`📦 Mock booking ${mockBooking.lr_number} created!`, {
        duration: 3000
      });
    }, 1000 + Math.random() * 2000);
    
    toast.loading(`Creating booking...`, {
      duration: 1000
    });
  };

  const simulateStatusUpdate = async () => {
    if (!lastCreated) {
      toast.error('Create a booking first!');
      return;
    }

    const statuses = ['loaded', 'in-transit', 'delivered'];
    const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    const updatedBooking = {
      ...lastCreated,
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    // Simulate status update without optimistic updates
    setTimeout(() => {
      setLastCreated(updatedBooking);
      toast.success(`📝 ${lastCreated.lr_number} status updated to ${newStatus}!`, {
        duration: 3000
      });
    }, 500 + Math.random() * 1000);
    
    toast.loading(`Updating status...`, {
      duration: 500
    });
  };

  const triggerRealtimeNotification = () => {
    // Simulate a real-time event
    const events = [
      { type: 'vehicle_update', message: '🚛 Vehicle MH-01-AB-1234 reached checkpoint' },
      { type: 'delivery_update', message: '📦 Delivery attempt scheduled for tomorrow' },
      { type: 'payment_received', message: '💰 Payment received for booking BK123456' },
      { type: 'customer_inquiry', message: '❓ New customer inquiry received' }
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    
    toast(event.message, {
      duration: 4000,
      icon: event.type === 'payment_received' ? '💰' : 
            event.type === 'vehicle_update' ? '🚛' : 
            event.type === 'delivery_update' ? '📦' : '❓',
      position: 'top-right'
    });
  };

  return (
    <Card className="p-6 border-dashed border-2 border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Real-time System Test
          </h3>
          <Badge variant="secondary" className="text-xs">
            Demo
          </Badge>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Test optimistic updates and real-time notifications
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={simulateBookingCreation}
            disabled={isCreating}
            className="gap-2 haptic-medium"
            variant="outline"
          >
            <Package className="h-4 w-4" />
            {isCreating ? 'Creating...' : 'Create Booking'}
          </Button>

          <Button
            onClick={simulateStatusUpdate}
            disabled={!lastCreated}
            className="gap-2 haptic-medium"
            variant="outline"
          >
            <Clock className="h-4 w-4" />
            Update Status
          </Button>

          <Button
            onClick={triggerRealtimeNotification}
            className="gap-2 haptic-medium"
            variant="outline"
          >
            <Zap className="h-4 w-4" />
            Send Notification
          </Button>
        </div>

        {lastCreated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">Last Test Booking</span>
              <Badge variant={lastCreated.status === 'delivered' ? 'default' : 'secondary'}>
                {lastCreated.status}
              </Badge>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>LR: {lastCreated.lr_number}</div>
              <div>Route: {lastCreated.from_location} → {lastCreated.to_location}</div>
              <div>Amount: ₹{lastCreated.amount?.toLocaleString()}</div>
            </div>
          </motion.div>
        )}

        <div className="text-xs text-gray-500 mt-4">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Real-time Active</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-blue-500" />
              <span>Optimistic Updates</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}