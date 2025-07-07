import React, { useState, useRef, useCallback } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  MessageCircle, 
  Edit, 
  Trash2, 
  Eye, 
  MapPin, 
  Star,
  MoreHorizontal,
  ChevronRight,
  Navigation,
  Archive,
  Share,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsTouchDevice } from '@/hooks/useIsMobile';

interface SwipeAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  action: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipe?: (direction: 'left' | 'right', actionId?: string) => void;
  disabled?: boolean;
  threshold?: number;
  className?: string;
}

const actionColors = {
  primary: {
    bg: 'bg-blue-500',
    text: 'text-blue-700',
    light: 'bg-blue-100'
  },
  secondary: {
    bg: 'bg-gray-500',
    text: 'text-gray-700',
    light: 'bg-gray-100'
  },
  success: {
    bg: 'bg-green-500',
    text: 'text-green-700',
    light: 'bg-green-100'
  },
  warning: {
    bg: 'bg-orange-500',
    text: 'text-orange-700',
    light: 'bg-orange-100'
  },
  danger: {
    bg: 'bg-red-500',
    text: 'text-red-700',
    light: 'bg-red-100'
  }
};

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  onSwipe,
  disabled = false,
  threshold = 80,
  className = ""
}) => {
  const [dragState, setDragState] = useState<'idle' | 'dragging' | 'triggered'>('idle');
  const [triggeredAction, setTriggeredAction] = useState<SwipeAction | null>(null);
  const [activeDirection, setActiveDirection] = useState<'left' | 'right' | null>(null);
  const isTouch = useIsTouchDevice();
  
  const x = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Calculate action reveal based on drag distance
  const leftReveal = useTransform(x, [0, threshold * leftActions.length], [0, 100]);
  const rightReveal = useTransform(x, [-threshold * rightActions.length, 0], [100, 0]);
  
  // Calculate individual action scales
  const getActionScale = (index: number, direction: 'left' | 'right') => {
    const totalActions = direction === 'left' ? leftActions.length : rightActions.length;
    const actionThreshold = threshold * (index + 1);
    
    if (direction === 'left') {
      return useTransform(x, [actionThreshold - 20, actionThreshold], [0.8, 1]);
    } else {
      return useTransform(x, [-actionThreshold, -actionThreshold + 20], [1, 0.8]);
    }
  };

  const handleDragStart = useCallback(() => {
    if (disabled) return;
    setDragState('dragging');
    
    // Haptic feedback on drag start
    if (isTouch && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [disabled, isTouch]);

  const handleDrag = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;
    
    const dragDistance = Math.abs(info.offset.x);
    const direction = info.offset.x > 0 ? 'left' : 'right';
    const actions = direction === 'left' ? leftActions : rightActions;
    
    // Update active direction
    if (dragDistance > 20) {
      setActiveDirection(direction);
    } else {
      setActiveDirection(null);
    }
    
    // Check if we've crossed any action thresholds
    const actionIndex = Math.floor(dragDistance / threshold) - 1;
    const validAction = actions[actionIndex];
    
    if (validAction && validAction !== triggeredAction) {
      setTriggeredAction(validAction);
      
      // Haptic feedback when crossing threshold
      if (isTouch && 'vibrate' in navigator) {
        navigator.vibrate(25);
      }
    } else if (!validAction && triggeredAction) {
      setTriggeredAction(null);
    }
  }, [disabled, leftActions, rightActions, threshold, triggeredAction, isTouch]);

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;
    
    const dragDistance = Math.abs(info.offset.x);
    const direction = info.offset.x > 0 ? 'left' : 'right';
    const actions = direction === 'left' ? leftActions : rightActions;
    
    // Check if we should trigger an action
    if (dragDistance >= threshold && actions.length > 0) {
      const actionIndex = Math.min(Math.floor(dragDistance / threshold) - 1, actions.length - 1);
      const action = actions[actionIndex];
      
      if (action) {
        setDragState('triggered');
        
        // Strong haptic feedback on action trigger
        if (isTouch && 'vibrate' in navigator) {
          navigator.vibrate([50, 30, 50]);
        }
        
        // Execute action after animation
        setTimeout(() => {
          action.action();
          onSwipe?.(direction, action.id);
          setDragState('idle');
          setTriggeredAction(null);
          setActiveDirection(null);
        }, 200);
        
        return;
      }
    }
    
    // Reset state
    setDragState('idle');
    setTriggeredAction(null);
    setActiveDirection(null);
    x.set(0);
  }, [disabled, leftActions, rightActions, threshold, onSwipe, x, isTouch]);

  const renderActions = (actions: SwipeAction[], side: 'left' | 'right') => {
    if (actions.length === 0) return null;
    
    return (
      <div className={cn(
        "absolute top-0 bottom-0 flex items-center",
        side === 'left' ? 'left-0' : 'right-0'
      )}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          const colors = actionColors[action.color];
          const scale = getActionScale(index, side);
          const isTriggered = triggeredAction?.id === action.id;
          
          return (
            <motion.div
              key={action.id}
              style={{ 
                scale,
                x: side === 'left' ? 
                  useTransform(x, [0, threshold * (index + 1)], [-50, 0]) :
                  useTransform(x, [-threshold * (index + 1), 0], [0, 50])
              }}
              className={cn(
                "w-16 h-full flex flex-col items-center justify-center",
                "transition-all duration-200",
                colors.bg,
                isTriggered && "scale-110"
              )}
            >
              <motion.div
                animate={{
                  scale: isTriggered ? 1.2 : 1,
                  rotate: isTriggered ? [0, -10, 10, 0] : 0
                }}
                transition={{ duration: 0.3 }}
                className="mb-1"
              >
                <Icon className="h-5 w-5 text-white" strokeWidth={2} />
              </motion.div>
              <span className="text-xs font-medium text-white text-center leading-tight">
                {action.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Left Actions */}
      <AnimatePresence>
        {activeDirection === 'left' && renderActions(leftActions, 'left')}
      </AnimatePresence>
      
      {/* Right Actions */}
      <AnimatePresence>
        {activeDirection === 'right' && renderActions(rightActions, 'right')}
      </AnimatePresence>
      
      {/* Main Card */}
      <motion.div
        ref={cardRef}
        drag={disabled ? false : "x"}
        dragConstraints={{ left: -threshold * rightActions.length - 20, right: threshold * leftActions.length + 20 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        animate={{
          scale: dragState === 'triggered' ? 0.95 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30
        }}
        className={cn(
          "relative z-10 bg-white dark:bg-gray-900",
          dragState === 'dragging' && "shadow-xl",
          "transition-shadow duration-200"
        )}
      >
        {children}
        
        {/* Visual feedback overlay */}
        {dragState === 'dragging' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent pointer-events-none" />
        )}
        
        {/* Triggered action feedback */}
        {triggeredAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              "bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm",
              "pointer-events-none"
            )}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl",
                actionColors[triggeredAction.color].light
              )}
            >
              <triggeredAction.icon className={cn(
                "h-8 w-8",
                actionColors[triggeredAction.color].text
              )} />
              <span className={cn(
                "text-sm font-semibold",
                actionColors[triggeredAction.color].text
              )}>
                {triggeredAction.label}
              </span>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// Predefined action sets for common use cases
export const commonActions = {
  booking: {
    left: [
      {
        id: 'call',
        label: 'Call',
        icon: Phone,
        color: 'success' as const,
        action: () => console.log('Call action')
      },
      {
        id: 'message',
        label: 'Message',
        icon: MessageCircle,
        color: 'primary' as const,
        action: () => console.log('Message action')
      }
    ],
    right: [
      {
        id: 'edit',
        label: 'Edit',
        icon: Edit,
        color: 'warning' as const,
        action: () => console.log('Edit action')
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: Trash2,
        color: 'danger' as const,
        action: () => console.log('Delete action')
      }
    ]
  },
  
  customer: {
    left: [
      {
        id: 'call',
        label: 'Call',
        icon: Phone,
        color: 'success' as const,
        action: () => console.log('Call customer')
      },
      {
        id: 'booking',
        label: 'Book',
        icon: Plus,
        color: 'primary' as const,
        action: () => console.log('New booking')
      }
    ],
    right: [
      {
        id: 'edit',
        label: 'Edit',
        icon: Edit,
        color: 'warning' as const,
        action: () => console.log('Edit customer')
      },
      {
        id: 'archive',
        label: 'Archive',
        icon: Archive,
        color: 'secondary' as const,
        action: () => console.log('Archive customer')
      }
    ]
  },
  
  tracking: {
    left: [
      {
        id: 'navigate',
        label: 'Navigate',
        icon: Navigation,
        color: 'primary' as const,
        action: () => console.log('Navigate')
      },
      {
        id: 'call',
        label: 'Call Driver',
        icon: Phone,
        color: 'success' as const,
        action: () => console.log('Call driver')
      }
    ],
    right: [
      {
        id: 'details',
        label: 'Details',
        icon: Eye,
        color: 'secondary' as const,
        action: () => console.log('View details')
      },
      {
        id: 'share',
        label: 'Share',
        icon: Share,
        color: 'primary' as const,
        action: () => console.log('Share tracking')
      }
    ]
  }
};

export default SwipeableCard;