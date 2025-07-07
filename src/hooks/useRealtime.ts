import { useEffect, useRef, useState, useCallback } from 'react';
import { realtimeService } from '@/services/realtime';
import { useAuth } from '@/contexts/AuthContext';

// Generic realtime hook for any table
export function useRealtime<T>(
  table: 'bookings' | 'articles' | 'customers' | 'vehicles' | 'logistics_events' | 'chat_messages',
  callbacks: {
    onInsert?: (item: T) => void;
    onUpdate?: (item: T) => void;
    onDelete?: (item: T) => void;
  },
  enabled: boolean = true
) {
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const subscriptionId = realtimeService.subscribe(table, {
      onInsert: callbacks.onInsert ? (payload) => callbacks.onInsert!(payload.new as T) : undefined,
      onUpdate: callbacks.onUpdate ? (payload) => callbacks.onUpdate!(payload.new as T) : undefined,
      onDelete: callbacks.onDelete ? (payload) => callbacks.onDelete!(payload.old as T) : undefined,
    });

    subscriptionRef.current = subscriptionId;
    setIsConnected(true);

    return () => {
      if (subscriptionRef.current) {
        realtimeService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
        setIsConnected(false);
      }
    };
  }, [table, enabled]);

  return { isConnected };
}

// Hook for booking real-time updates
export function useRealtimeBookings(callbacks: {
  onInsert?: (booking: any) => void;
  onUpdate?: (booking: any) => void;
  onDelete?: (booking: any) => void;
  onStatusChange?: (booking: any, oldStatus: string, newStatus: string) => void;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionRef = useRef<string | null>(null);

  useEffect(() => {
    const subscriptionId = realtimeService.subscribeToBookings(callbacks);
    subscriptionRef.current = subscriptionId;
    setIsConnected(true);

    return () => {
      if (subscriptionRef.current) {
        realtimeService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
        setIsConnected(false);
      }
    };
  }, []);

  return { isConnected };
}

// Hook for logistics events (tracking)
export function useRealtimeTracking(callbacks: {
  onNewEvent?: (event: any) => void;
  onLocationUpdate?: (event: any) => void;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionRef = useRef<string | null>(null);

  useEffect(() => {
    const subscriptionId = realtimeService.subscribeToLogisticsEvents(callbacks);
    subscriptionRef.current = subscriptionId;
    setIsConnected(true);

    return () => {
      if (subscriptionRef.current) {
        realtimeService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
        setIsConnected(false);
      }
    };
  }, []);

  return { isConnected };
}

// Hook for chat messages
export function useRealtimeChat(channelId: string, callbacks: {
  onNewMessage?: (message: any) => void;
  onMessageUpdate?: (message: any) => void;
  onMessageDelete?: (message: any) => void;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!channelId) return;

    const subscriptionId = realtimeService.subscribeToChatMessages(channelId, callbacks);
    subscriptionRef.current = subscriptionId;
    setIsConnected(true);

    return () => {
      if (subscriptionRef.current) {
        realtimeService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
        setIsConnected(false);
      }
    };
  }, [channelId]);

  return { isConnected };
}

// Hook for user presence
export function usePresence(channelName: string, metadata?: any) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user?.id || !channelName) return;

    const channel = realtimeService.subscribeToPresence(
      channelName,
      user.id,
      {
        name: user.name,
        email: user.email,
        ...metadata
      }
    );

    channelRef.current = channel;

    // Listen for presence changes
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const users = Object.values(presenceState).flat();
      setOnlineUsers(users);
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [user?.id, channelName]);

  return { onlineUsers };
}

// Hook for broadcasting events
export function useBroadcast() {
  const broadcast = useCallback((channelName: string, event: string, payload: any) => {
    realtimeService.broadcast(channelName, event, payload);
  }, []);

  const subscribe = useCallback((
    channelName: string,
    eventName: string,
    callback: (payload: any) => void
  ) => {
    return realtimeService.subscribeToBroadcast(channelName, eventName, callback);
  }, []);

  return { broadcast, subscribe };
}

// Hook for connection monitoring
export function useRealtimeStatus() {
  const [status, setStatus] = useState({
    isConnected: false,
    subscriptionsCount: 0,
    lastUpdate: null as Date | null
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus({
        isConnected: realtimeService.getConnectionStatus(),
        subscriptionsCount: realtimeService.getActiveSubscriptionsCount(),
        lastUpdate: new Date()
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const forceReconnect = useCallback(() => {
    realtimeService.forceReconnect();
  }, []);

  return { status, forceReconnect };
}