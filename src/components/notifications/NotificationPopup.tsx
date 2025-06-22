import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationPopupProps {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
  onClose: (id: string) => void;
  duration?: number;
}

export default function NotificationPopup({ 
  id, 
  type, 
  title, 
  message, 
  onClose,
  duration = 5000
}: NotificationPopupProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`${getBgColor()} border rounded-lg shadow-lg p-4 max-w-sm w-full`}
    >
      <div className="flex gap-3">
        <div className="shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-gray-900">{title}</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 -mr-1 -mt-1 rounded-full"
              onClick={() => onClose(id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{message}</p>
        </div>
      </div>
    </motion.div>
  );
}