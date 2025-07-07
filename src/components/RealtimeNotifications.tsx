import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Package, Users, Truck, DollarSign, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRealtimeBookings, useRealtimeTracking } from '@/hooks/useRealtime';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  type: 'booking_created' | 'booking_updated' | 'status_changed' | 'location_update' | 'payment_received';
  title: string;
  message: string;
  timestamp: Date;
  data?: any;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface RealtimeNotificationsProps {
  className?: string;
}

export default function RealtimeNotifications({ className }: RealtimeNotificationsProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Real-time subscriptions
  useRealtimeBookings({
    onInsert: (booking) => {
      addNotification({
        type: 'booking_created',
        title: 'New Booking Created',
        message: `Booking ${booking.lr_number} has been created`,
        data: booking,
        priority: 'medium'
      });
    },
    onStatusChange: (booking, oldStatus, newStatus) => {
      let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
      
      if (newStatus === 'delivered') priority = 'high';
      if (newStatus === 'cancelled') priority = 'urgent';

      addNotification({
        type: 'status_changed',
        title: 'Booking Status Updated',
        message: `${booking.lr_number} changed from ${oldStatus} to ${newStatus}`,
        data: { booking, oldStatus, newStatus },
        priority
      });
    }
  });

  useRealtimeTracking({
    onLocationUpdate: (event) => {
      addNotification({
        type: 'location_update',
        title: 'Location Update',
        message: `Vehicle ${event.vehicle_number} location updated`,
        data: event,
        priority: 'low'
      });
    }
  });

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
      ...notificationData
    };

    setNotifications(prev => [notification, ...prev.slice(0, 99)]); // Keep max 100 notifications
    setUnreadCount(prev => prev + 1);

    // Auto-remove low priority notifications after 10 seconds
    if (notification.priority === 'low') {
      setTimeout(() => {
        removeNotification(notification.id);
      }, 10000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => {
      if (n.id === id && !n.read) {
        setUnreadCount(count => Math.max(0, count - 1));
        return { ...n, read: true };
      }
      return n;
    }));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'booking_created':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'booking_updated':
        return <Package className="h-4 w-4 text-green-500" />;
      case 'status_changed':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'location_update':
        return <MapPin className="h-4 w-4 text-purple-500" />;
      case 'payment_received':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-300 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className={cn("relative", className)}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
      >
        <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shadow-sm"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </Button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Notifications Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-96 max-h-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Notifications
                </h3>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs"
                      >
                        Mark all read
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAll}
                        className="text-xs"
                      >
                        Clear all
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <Bell className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border-l-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700",
                          getPriorityColor(notification.priority),
                          !notification.read && "ring-1 ring-blue-200 dark:ring-blue-800"
                        )}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                              {notification.title}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            
                            {!notification.read && (
                              <Badge variant="secondary" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}