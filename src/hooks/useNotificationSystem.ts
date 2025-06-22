import { useCallback } from 'react';
import { useNotificationContext } from '@/components/notifications/NotificationProvider';

export function useNotificationSystem() {
  const { showNotification, clearNotifications } = useNotificationContext();

  const showSuccess = useCallback((title: string, message: string) => {
    return showNotification('success', title, message);
  }, [showNotification]);

  const showError = useCallback((title: string, message: string) => {
    return showNotification('warning', title, message);
  }, [showNotification]);

  const showInfo = useCallback((title: string, message: string) => {
    return showNotification('info', title, message);
  }, [showNotification]);

  return {
    showSuccess,
    showError,
    showInfo,
    clearAll: clearNotifications
  };
}