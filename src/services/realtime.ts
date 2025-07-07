import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type TableName = 'bookings' | 'articles' | 'customers' | 'vehicles' | 'logistics_events' | 'chat_messages';

interface RealtimeSubscription {
  channel: RealtimeChannel;
  table: TableName;
  callbacks: {
    onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
    onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
    onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
  };
}

class RealtimeService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor() {
    this.setupConnectionMonitoring();
  }

  /**
   * Set up connection monitoring and auto-reconnection
   */
  private setupConnectionMonitoring() {
    // Monitor connection status
    supabase.realtime.onopen = () => {
      console.log('✅ Realtime connection established');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    };

    supabase.realtime.onclose = () => {
      console.log('❌ Realtime connection closed');
      this.isConnected = false;
      this.handleReconnection();
    };

    supabase.realtime.onerror = (error) => {
      console.error('🔥 Realtime connection error:', error);
      this.isConnected = false;
    };
  }

  /**
   * Handle automatic reconnection
   */
  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
      
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(() => {
        this.resubscribeAll();
      }, delay);
    } else {
      console.error('💥 Max reconnection attempts reached. Please refresh the page.');
    }
  }

  /**
   * Resubscribe to all active channels
   */
  private resubscribeAll() {
    const currentSubscriptions = Array.from(this.subscriptions.entries());
    this.subscriptions.clear();

    currentSubscriptions.forEach(([id, subscription]) => {
      this.subscribe(
        subscription.table,
        subscription.callbacks,
        id
      );
    });
  }

  /**
   * Subscribe to real-time changes for a specific table
   */
  subscribe(
    table: TableName,
    callbacks: {
      onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
      onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
      onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
    },
    subscriptionId?: string
  ): string {
    const id = subscriptionId || `${table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Remove existing subscription if it exists
    if (this.subscriptions.has(id)) {
      this.unsubscribe(id);
    }

    const channel = supabase
      .channel(`realtime_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => {
          console.log(`📡 Realtime update for ${table}:`, payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              callbacks.onInsert?.(payload);
              break;
            case 'UPDATE':
              callbacks.onUpdate?.(payload);
              break;
            case 'DELETE':
              callbacks.onDelete?.(payload);
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log(`🔔 Subscription status for ${table}:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Successfully subscribed to ${table} changes`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Failed to subscribe to ${table} changes`);
        }
      });

    this.subscriptions.set(id, {
      channel,
      table,
      callbacks
    });

    return id;
  }

  /**
   * Subscribe to booking changes with detailed tracking
   */
  subscribeToBookings(callbacks: {
    onInsert?: (booking: any) => void;
    onUpdate?: (booking: any) => void;
    onDelete?: (booking: any) => void;
    onStatusChange?: (booking: any, oldStatus: string, newStatus: string) => void;
  }): string {
    return this.subscribe('bookings', {
      onInsert: (payload) => {
        callbacks.onInsert?.(payload.new);
      },
      onUpdate: (payload) => {
        const oldData = payload.old;
        const newData = payload.new;
        
        // Check if status changed
        if (oldData?.status !== newData?.status) {
          callbacks.onStatusChange?.(newData, oldData?.status, newData?.status);
        }
        
        callbacks.onUpdate?.(newData);
      },
      onDelete: (payload) => {
        callbacks.onDelete?.(payload.old);
      }
    });
  }

  /**
   * Subscribe to article movements and logistics events
   */
  subscribeToLogisticsEvents(callbacks: {
    onNewEvent?: (event: any) => void;
    onLocationUpdate?: (event: any) => void;
  }): string {
    return this.subscribe('logistics_events', {
      onInsert: (payload) => {
        const event = payload.new;
        
        if (event.event_type === 'location_update') {
          callbacks.onLocationUpdate?.(event);
        }
        
        callbacks.onNewEvent?.(event);
      }
    });
  }

  /**
   * Subscribe to chat messages for real-time communication
   */
  subscribeToChatMessages(channelId: string, callbacks: {
    onNewMessage?: (message: any) => void;
    onMessageUpdate?: (message: any) => void;
    onMessageDelete?: (message: any) => void;
  }): string {
    const channel = supabase
      .channel(`chat_${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              callbacks.onNewMessage?.(payload.new);
              break;
            case 'UPDATE':
              callbacks.onMessageUpdate?.(payload.new);
              break;
            case 'DELETE':
              callbacks.onMessageDelete?.(payload.old);
              break;
          }
        }
      )
      .subscribe();

    const subscriptionId = `chat_${channelId}_${Date.now()}`;
    this.subscriptions.set(subscriptionId, {
      channel,
      table: 'chat_messages',
      callbacks: {}
    });

    return subscriptionId;
  }

  /**
   * Send real-time presence updates (user online status)
   */
  subscribeToPresence(channelName: string, userId: string, metadata: any = {}) {
    const channel = supabase.channel(channelName);
    
    // Track user presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        console.log('👥 Presence sync:', presenceState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Send user presence
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            ...metadata
          });
        }
      });

    return channel;
  }

  /**
   * Broadcast real-time events to other users
   */
  broadcast(channelName: string, event: string, payload: any) {
    const channel = supabase.channel(channelName);
    
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: event,
          payload: payload
        });
      }
    });
  }

  /**
   * Listen for broadcast events
   */
  subscribeToBroadcast(
    channelName: string,
    eventName: string,
    callback: (payload: any) => void
  ): string {
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: eventName }, callback)
      .subscribe();

    const subscriptionId = `broadcast_${channelName}_${eventName}_${Date.now()}`;
    this.subscriptions.set(subscriptionId, {
      channel,
      table: 'chat_messages', // dummy table
      callbacks: {}
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (subscription) {
      subscription.channel.unsubscribe();
      this.subscriptions.delete(subscriptionId);
      console.log(`🔕 Unsubscribed from ${subscriptionId}`);
      return true;
    }
    
    return false;
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((_, id) => {
      this.unsubscribe(id);
    });
    console.log('🔕 Unsubscribed from all realtime channels');
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Force reconnection
   */
  forceReconnect(): void {
    this.reconnectAttempts = 0;
    this.resubscribeAll();
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
export default realtimeService;