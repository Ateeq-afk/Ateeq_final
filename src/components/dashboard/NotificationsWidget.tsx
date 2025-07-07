import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, Info, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationsWidgetProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  className?: string;
}

export function NotificationsWidget({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  className
}: NotificationsWidgetProps) {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return AlertTriangle;
      case 'success':
        return CheckCircle;
      case 'error':
        return XCircle;
      default:
        return Info;
    }
  };

  const getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20';
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("card-premium p-6", className)}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
              <Bell className="h-6 w-6 text-white" />
            </div>
            {unreadCount > 0 && (
              <div className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xl font-heading font-semibold text-foreground">Notifications</h3>
            <p className="text-sm text-muted-foreground">Stay updated with alerts</p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllAsRead}
            className="text-xs"
          >
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-muted-foreground">No notifications</p>
            </div>
          ) : (
            notifications.map((notification, index) => {
              const Icon = getIcon(notification.type);
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={cn(
                    "relative p-4 rounded-xl transition-all duration-200",
                    notification.isRead
                      ? "bg-gray-50/50 dark:bg-gray-800/50"
                      : getBgColor(notification.type),
                    "hover:shadow-md cursor-pointer"
                  )}
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", getIconColor(notification.type))} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={cn(
                          "text-sm font-medium",
                          notification.isRead ? "text-muted-foreground" : "text-foreground"
                        )}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(notification.timestamp)}</span>
                        </div>
                      </div>
                      
                      <p className={cn(
                        "text-sm",
                        notification.isRead ? "text-muted-foreground" : "text-foreground/80"
                      )}>
                        {notification.message}
                      </p>
                      
                      {notification.action && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 mt-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            notification.action!.onClick();
                          }}
                        >
                          {notification.action.label} →
                        </Button>
                      )}
                    </div>

                    {!notification.isRead && (
                      <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}