import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, Zap, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRealtimeStatus } from '@/hooks/useRealtime';
import { Badge } from './badge';
import { Button } from './button';

interface RealtimeStatusProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export default function RealtimeStatus({ 
  className, 
  showDetails = false, 
  compact = false 
}: RealtimeStatusProps) {
  const { status, forceReconnect } = useRealtimeStatus();
  const [showTooltip, setShowTooltip] = React.useState(false);

  const getStatusIcon = () => {
    if (!status.isConnected) {
      return <WifiOff className="h-3 w-3 text-red-500" />;
    }
    return <Wifi className="h-3 w-3 text-green-500" />;
  };

  const getStatusColor = () => {
    if (!status.isConnected) return 'text-red-500 bg-red-50 border-red-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusText = () => {
    if (!status.isConnected) return 'Offline';
    return 'Live';
  };

  if (compact) {
    return (
      <motion.div
        className={cn("flex items-center gap-1", className)}
        whileHover={{ scale: 1.05 }}
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => setShowTooltip(false)}
      >
        <div className="relative">
          {getStatusIcon()}
          {status.isConnected && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"
            />
          )}
        </div>
        
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-50"
            >
              {status.isConnected ? 
                `Live • ${status.subscriptionsCount} active` : 
                'Reconnecting...'
              }
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn("inline-flex items-center gap-2", className)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Badge 
        variant="outline" 
        className={cn(
          "gap-1.5 px-2 py-1 text-xs font-medium border transition-all duration-200",
          getStatusColor()
        )}
      >
        <div className="relative">
          {getStatusIcon()}
          {status.isConnected && (
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full"
            />
          )}
        </div>
        {getStatusText()}
      </Badge>

      {showDetails && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{status.subscriptionsCount} active</span>
          {status.lastUpdate && (
            <span>• Updated {status.lastUpdate.toLocaleTimeString()}</span>
          )}
        </div>
      )}

      {!status.isConnected && (
        <Button
          size="sm"
          variant="outline"
          onClick={forceReconnect}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Reconnect
        </Button>
      )}
    </motion.div>
  );
}

// Optimistic updates indicator
export function OptimisticUpdatesIndicator({ 
  pendingCount = 0, 
  className 
}: { 
  pendingCount?: number; 
  className?: string; 
}) {
  if (pendingCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn("flex items-center gap-2", className)}
    >
      <Badge variant="secondary" className="gap-1 text-xs">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <RefreshCw className="h-3 w-3" />
        </motion.div>
        {pendingCount} syncing...
      </Badge>
    </motion.div>
  );
}

// Live update notification
export function LiveUpdateNotification({ 
  type, 
  message, 
  onDismiss 
}: { 
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  onDismiss?: () => void;
}) {
  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Zap className="h-4 w-4 text-blue-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-700';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'error': return 'bg-red-50 border-red-200 text-red-700';
      default: return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium",
        getColors()
      )}
    >
      {getIcon()}
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-current opacity-70 hover:opacity-100">
          <X className="h-3 w-3" />
        </button>
      )}
    </motion.div>
  );
}

// Connection quality indicator
export function ConnectionQuality() {
  const { status } = useRealtimeStatus();
  const [ping, setPing] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!status.isConnected) return;

    const measurePing = async () => {
      const start = Date.now();
      try {
        // Simple ping by making a lightweight request
        await fetch('/api/health', { method: 'HEAD' });
        setPing(Date.now() - start);
      } catch {
        setPing(null);
      }
    };

    measurePing();
    const interval = setInterval(measurePing, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [status.isConnected]);

  const getQualityColor = () => {
    if (!ping) return 'text-gray-400';
    if (ping < 100) return 'text-green-500';
    if (ping < 300) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getQualityText = () => {
    if (!ping) return 'Unknown';
    if (ping < 100) return 'Excellent';
    if (ping < 300) return 'Good';
    return 'Poor';
  };

  return (
    <div className="flex items-center gap-1 text-xs">
      <div className={cn("w-2 h-2 rounded-full", 
        ping ? (ping < 100 ? 'bg-green-500' : ping < 300 ? 'bg-yellow-500' : 'bg-red-500') : 'bg-gray-400'
      )} />
      <span className={getQualityColor()}>
        {ping ? `${ping}ms` : getQualityText()}
      </span>
    </div>
  );
}