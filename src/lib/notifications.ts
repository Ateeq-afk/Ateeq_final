import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type NotificationType = 'success' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon?: string;
}

// In-memory notification storage for demo purposes
const notificationsStore: Record<string, Notification[]> = {};

export function useNotifications() {
  const { user } = useAuth();
  const userId = user?.id || 'demo-user';
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications
  useEffect(() => {
    if (!notificationsStore[userId]) {
      notificationsStore[userId] = [];
    }
    setNotifications(notificationsStore[userId]);
    updateUnreadCount();
  }, [userId]);

  // Update unread count
  const updateUnreadCount = () => {
    const count = (notificationsStore[userId] || []).filter(n => !n.read).length;
    setUnreadCount(count);
  };

  // Add a new notification
  const addNotification = (type: NotificationType, title: string, message: string, icon?: string) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      icon
    };
    
    notificationsStore[userId] = [newNotification, ...(notificationsStore[userId] || [])];
    setNotifications([...notificationsStore[userId]]);
    updateUnreadCount();
    
    return newNotification;
  };

  // Mark a notification as read
  const markAsRead = (id: string) => {
    if (!notificationsStore[userId]) return;
    
    notificationsStore[userId] = notificationsStore[userId].map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    
    setNotifications([...notificationsStore[userId]]);
    updateUnreadCount();
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    if (!notificationsStore[userId]) return;
    
    notificationsStore[userId] = notificationsStore[userId].map(notification => 
      ({ ...notification, read: true })
    );
    
    setNotifications([...notificationsStore[userId]]);
    updateUnreadCount();
  };

  // Remove a notification
  const removeNotification = (id: string) => {
    if (!notificationsStore[userId]) return;
    
    notificationsStore[userId] = notificationsStore[userId].filter(
      notification => notification.id !== id
    );
    
    setNotifications([...notificationsStore[userId]]);
    updateUnreadCount();
  };

  // Clear all notifications
  const clearAll = () => {
    notificationsStore[userId] = [];
    setNotifications([]);
    updateUnreadCount();
  };

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  };
}

// Create a notification
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  smsNumber?: string
): Promise<Notification> {
  // In a real implementation, this would create a notification in the database
  // For demo purposes, we'll just return a mock notification
  const notification: Notification = {
    id: Date.now().toString(),
    type,
    title,
    message,
    timestamp: new Date(),
    read: false
  };
  
  // If smsNumber is provided, send an SMS
  if (smsNumber) {
    try {
      // In a real implementation, this would call an SMS API
      console.log(`Sending SMS to ${smsNumber}: ${title} - ${message}`);
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  }
  
  return notification;
}

// Get user notifications
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  // In a real implementation, this would fetch notifications from the database
  // For demo purposes, we'll return mock notifications
  return [
    {
      id: '1',
      type: 'success',
      title: 'Booking Confirmed',
      message: 'Booking #LR-20250101-0001 has been successfully created',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: false
    },
    {
      id: '2',
      type: 'info',
      title: 'Vehicle Assigned',
      message: 'Vehicle MH01AB1234 has been assigned to your booking',
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      read: false
    },
    {
      id: '3',
      type: 'warning',
      title: 'Delivery Delayed',
      message: 'Delivery for booking #LR-20250101-0002 has been delayed',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      read: true
    }
  ];
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  // In a real implementation, this would update the notification in the database
  console.log(`Marking notification ${notificationId} as read`);
}