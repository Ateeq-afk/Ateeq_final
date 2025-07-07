import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  threshold = 80,
  disabled = false
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  
  // Transform y value to rotation for the refresh icon
  const rotate = useTransform(y, [0, threshold], [0, 180]);
  const scale = useTransform(y, [0, threshold], [0.5, 1]);
  const opacity = useTransform(y, [0, threshold * 0.5], [0, 1]);

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || isRefreshing) return;

    if (info.offset.y >= threshold && canRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setCanRefresh(false);
        y.set(0);
      }
    } else {
      y.set(0);
      setCanRefresh(false);
    }
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || isRefreshing) return;

    // Only allow pulling down when at the top of the container
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    if (scrollTop > 0) {
      y.set(0);
      setCanRefresh(false);
      return;
    }

    // Constrain the drag to positive values (pulling down)
    const newY = Math.max(0, Math.min(info.offset.y, threshold * 1.5));
    y.set(newY);
    
    // Set canRefresh when past threshold
    setCanRefresh(newY >= threshold);
  };

  // Reset when refreshing is done
  useEffect(() => {
    if (!isRefreshing) {
      y.set(0);
    }
  }, [isRefreshing, y]);

  return (
    <div className="relative h-full overflow-hidden">
      {/* Enhanced Pull to refresh indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center"
        style={{ 
          y: useTransform(y, [0, threshold], [-60, 20]),
          opacity 
        }}
      >
        <motion.div
          className={cn(
            "flex items-center gap-3 px-5 py-3 rounded-2xl",
            "bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-xl border border-white/40 dark:border-gray-700/40",
            canRefresh ? "bg-blue-50/95 dark:bg-blue-900/40 border-blue-200/60 dark:border-blue-800/60" : "border-gray-200/60 dark:border-gray-700/60"
          )}
          style={{ scale }}
        >
          {/* Glass morphism background */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent rounded-2xl" />
          
          <motion.div style={{ rotate }} className="relative z-10">
            <RefreshCw 
              className={cn(
                "h-5 w-5 transition-colors",
                isRefreshing && "animate-spin",
                canRefresh ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
              )} 
              strokeWidth={2}
            />
          </motion.div>
          <span className={cn(
            "text-body-sm font-semibold transition-colors relative z-10",
            canRefresh ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300"
          )}>
            {isRefreshing ? 'Refreshing...' : canRefresh ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </motion.div>
      </motion.div>

      {/* Enhanced Content container */}
      <motion.div
        ref={containerRef}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="h-full overflow-y-auto overscroll-none scroll-smooth"
        dragMomentum={false}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;