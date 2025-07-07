import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { realtimeService } from '@/services/realtime';
import { useAuth } from './AuthContext';
import { useBranchSelection } from './BranchSelectionContext';
import { toast } from 'react-hot-toast';

interface RealtimeContextType {
  isConnected: boolean;
  subscriptionsCount: number;
  lastUpdate: Date | null;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'unknown';
  forceReconnect: () => void;
  onlineUsers: any[];
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { user } = useAuth();
  const { selectedBranch } = useBranchSelection();
  const [isConnected, setIsConnected] = useState(false);
  const [subscriptionsCount, setSubscriptionsCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'unknown'>('unknown');
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  // Monitor connection status
  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(realtimeService.getConnectionStatus());
      setSubscriptionsCount(realtimeService.getActiveSubscriptionsCount());
      setLastUpdate(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Set up presence tracking when user and branch are available
  useEffect(() => {
    if (!user?.id || !selectedBranch?.id) return;

    const channelName = `branch_${selectedBranch.id}`;
    
    const presenceChannel = realtimeService.subscribeToPresence(
      channelName,
      user.id,
      {
        name: user.name,
        email: user.email,
        role: user.role,
        branch_id: selectedBranch.id,
        branch_name: selectedBranch.name,
        last_seen: new Date().toISOString()
      }
    );

    // Listen for presence updates
    presenceChannel.on('presence', { event: 'sync' }, () => {
      const presenceState = presenceChannel.presenceState();
      const users = Object.values(presenceState).flat();
      setOnlineUsers(users);
    });

    presenceChannel.on('presence', { event: 'join' }, ({ newPresences }) => {
      newPresences.forEach((presence: any) => {
        if (presence.user_id !== user.id) {
          toast.success(`${presence.name} joined`, {
            duration: 2000,
            position: 'bottom-right'
          });
        }
      });
    });

    presenceChannel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      leftPresences.forEach((presence: any) => {
        if (presence.user_id !== user.id) {
          toast(`${presence.name} left`, {
            duration: 2000,
            position: 'bottom-right',
            icon: '👋'
          });
        }
      });
    });

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [user?.id, selectedBranch?.id]);

  // Set up global real-time subscriptions
  useEffect(() => {
    if (!user?.id || !selectedBranch?.id) return;

    // Subscribe to bookings for current branch
    const bookingSubscription = realtimeService.subscribeToBookings({
      onInsert: (booking) => {
        if (booking.branch_id === selectedBranch.id) {
          toast.success(`New booking ${booking.lr_number} created`, {
            duration: 4000,
            position: 'top-right'
          });
        }
      },
      onUpdate: (booking) => {
        if (booking.branch_id === selectedBranch.id) {
          toast(`Booking ${booking.lr_number} updated`, {
            duration: 3000,
            position: 'top-right',
            icon: '📝'
          });
        }
      },
      onStatusChange: (booking, oldStatus, newStatus) => {
        if (booking.branch_id === selectedBranch.id) {
          const getStatusEmoji = (status: string) => {
            switch (status) {
              case 'delivered': return '✅';
              case 'in-transit': return '🚛';
              case 'cancelled': return '❌';
              default: return '📦';
            }
          };

          toast.success(
            `${booking.lr_number} ${getStatusEmoji(newStatus)} ${newStatus.replace('-', ' ')}`,
            {
              duration: 4000,
              position: 'top-right'
            }
          );
        }
      }
    });

    // Subscribe to logistics events for tracking
    const trackingSubscription = realtimeService.subscribeToLogisticsEvents({
      onLocationUpdate: (event) => {
        // Only show location updates for high-priority shipments
        if (event.priority === 'high' || event.priority === 'urgent') {
          toast(`📍 ${event.vehicle_number} location updated`, {
            duration: 2000,
            position: 'bottom-right'
          });
        }
      },
      onNewEvent: (event) => {
        if (event.event_type === 'delivery_attempt_failed') {
          toast.error(`Delivery attempt failed for ${event.lr_number}`, {
            duration: 5000,
            position: 'top-center'
          });
        }
      }
    });

    return () => {
      realtimeService.unsubscribe(bookingSubscription);
      realtimeService.unsubscribe(trackingSubscription);
    };
  }, [user?.id, selectedBranch?.id]);

  // Monitor connection quality
  useEffect(() => {
    if (!isConnected) {
      setConnectionQuality('unknown');
      return;
    }

    const measureConnectionQuality = async () => {
      const start = Date.now();
      try {
        // Simple ping test
        await fetch('/api/health', { method: 'HEAD' });
        const latency = Date.now() - start;
        
        if (latency < 100) {
          setConnectionQuality('excellent');
        } else if (latency < 300) {
          setConnectionQuality('good');
        } else {
          setConnectionQuality('poor');
        }
      } catch {
        setConnectionQuality('poor');
      }
    };

    measureConnectionQuality();
    const interval = setInterval(measureConnectionQuality, 10000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Show connection status changes
  useEffect(() => {
    if (isConnected) {
      toast.success('🟢 Real-time connection established', {
        duration: 2000,
        position: 'bottom-left'
      });
    } else {
      toast.error('🔴 Real-time connection lost', {
        duration: 3000,
        position: 'bottom-left'
      });
    }
  }, [isConnected]);

  const forceReconnect = () => {
    realtimeService.forceReconnect();
    toast.loading('Reconnecting...', {
      duration: 2000,
      position: 'bottom-left'
    });
  };

  const value: RealtimeContextType = {
    isConnected,
    subscriptionsCount,
    lastUpdate,
    connectionQuality,
    forceReconnect,
    onlineUsers
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeContext() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  return context;
}

export default RealtimeContext;