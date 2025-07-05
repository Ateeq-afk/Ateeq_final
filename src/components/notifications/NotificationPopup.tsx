import { useEffect } from 'react';
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

  const getIconAndStyle = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="h-6 w-6 text-white" />,
          bg: 'bg-green-500',
          cardBg: 'bg-green-500/10 border-green-500/20',
          textColor: 'text-green-700 dark:text-green-300'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-white" />,
          bg: 'bg-yellow-500',
          cardBg: 'bg-yellow-500/10 border-yellow-500/20',
          textColor: 'text-yellow-700 dark:text-yellow-300'
        };
      case 'info':
      default:
        return {
          icon: <Info className="h-6 w-6 text-white" />,
          bg: 'bg-blue-500',
          cardBg: 'bg-blue-500/10 border-blue-500/20',
          textColor: 'text-blue-700 dark:text-blue-300'
        };
    }
  };

  const { icon, bg, cardBg, textColor } = getIconAndStyle();

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
      className={`${cardBg} border glass-subtle rounded-2xl shadow-xl p-5 max-w-sm w-full relative overflow-hidden`}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex gap-4">
        <motion.div 
          className={`shrink-0 ${bg} rounded-xl p-2 shadow-lg`}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          {icon}
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <motion.h3 
              className="font-semibold text-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {title}
            </motion.h3>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                aria-label="Close notification"
                className="h-8 w-8 -mr-1 -mt-1 rounded-xl hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                onClick={() => onClose(id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
          <motion.p 
            className={`text-sm ${textColor} mt-2 leading-relaxed`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {message}
          </motion.p>
        </div>
      </div>
      
      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-brand-500 to-brand-600 rounded-b-2xl"
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: duration / 1000, ease: "linear" }}
      />
    </motion.div>
  );
}