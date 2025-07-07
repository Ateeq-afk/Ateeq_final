import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsTouchDevice } from '@/hooks/useIsMobile';

interface GestureNavigatorProps {
  children: React.ReactNode;
  enableSwipeBack?: boolean;
  enableSwipeForward?: boolean;
  swipeThreshold?: number;
  className?: string;
}

interface NavigationGesture {
  type: 'back' | 'forward' | 'home';
  direction: 'left' | 'right';
  icon: React.ElementType;
  color: string;
  action: () => void;
}

export const GestureNavigator: React.FC<GestureNavigatorProps> = ({
  children,
  enableSwipeBack = true,
  enableSwipeForward = false,
  swipeThreshold = 100,
  className = ''
}) => {
  const [gestureState, setGestureState] = useState<'idle' | 'active' | 'triggered'>('idle');
  const [activeGesture, setActiveGesture] = useState<NavigationGesture | null>(null);
  const [showHint, setShowHint] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const isTouch = useIsTouchDevice();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-swipeThreshold, 0, swipeThreshold], [1, 0, 1]);
  const scale = useTransform(x, [-swipeThreshold, 0, swipeThreshold], [1.1, 0.8, 1.1]);

  // Define available gestures
  const gestures: NavigationGesture[] = [
    ...(enableSwipeBack ? [{
      type: 'back' as const,
      direction: 'left' as const,
      icon: ArrowLeft,
      color: 'text-blue-500',
      action: () => navigate(-1)
    }] : []),
    ...(enableSwipeForward ? [{
      type: 'forward' as const,
      direction: 'right' as const,
      icon: ChevronRight,
      color: 'text-green-500',
      action: () => navigate(1)
    }] : []),
    {
      type: 'home' as const,
      direction: 'right' as const,
      icon: Home,
      color: 'text-purple-500',
      action: () => navigate('/dashboard')
    }
  ];

  // Show gesture hints on first interaction
  useEffect(() => {
    const hasSeenHints = localStorage.getItem('gesture-hints-seen');
    if (!hasSeenHints && isTouch) {
      setTimeout(() => setShowHint(true), 2000);
      setTimeout(() => {
        setShowHint(false);
        localStorage.setItem('gesture-hints-seen', 'true');
      }, 5000);
    }
  }, [isTouch]);

  const handleDragStart = useCallback(() => {
    setGestureState('active');
    
    // Light haptic feedback on drag start
    if (isTouch && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [isTouch]);

  const handleDrag = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const dragDistance = Math.abs(info.offset.x);
    const direction = info.offset.x > 0 ? 'right' : 'left';
    
    // Find matching gesture
    let matchedGesture: NavigationGesture | null = null;
    
    if (direction === 'left' && dragDistance > swipeThreshold / 2) {
      matchedGesture = gestures.find(g => g.direction === 'left') || null;
    } else if (direction === 'right' && dragDistance > swipeThreshold / 2) {
      // For right swipe, prioritize back gesture if available, otherwise home
      if (dragDistance > swipeThreshold) {
        matchedGesture = gestures.find(g => g.type === 'home') || null;
      } else {
        matchedGesture = gestures.find(g => g.type === 'back') || null;
      }
    }
    
    if (matchedGesture !== activeGesture) {
      setActiveGesture(matchedGesture);
      
      // Haptic feedback when entering gesture zone
      if (matchedGesture && isTouch && 'vibrate' in navigator) {
        navigator.vibrate(25);
      }
    }
  }, [gestures, activeGesture, swipeThreshold, isTouch]);

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const dragDistance = Math.abs(info.offset.x);
    
    if (activeGesture && dragDistance >= swipeThreshold) {
      setGestureState('triggered');
      
      // Strong haptic feedback on gesture trigger
      if (isTouch && 'vibrate' in navigator) {
        navigator.vibrate([50, 30, 50]);
      }
      
      // Execute gesture action after animation
      setTimeout(() => {
        activeGesture.action();
        setGestureState('idle');
        setActiveGesture(null);
      }, 200);
    } else {
      // Reset state
      setGestureState('idle');
      setActiveGesture(null);
      x.set(0);
    }
  }, [activeGesture, swipeThreshold, isTouch, x]);

  const renderGestureIndicator = () => {
    if (!activeGesture) return null;
    
    const Icon = activeGesture.icon;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
      >
        <motion.div
          style={{ opacity, scale }}
          className={cn(
            "flex flex-col items-center gap-2 p-6 rounded-3xl",
            "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl",
            "shadow-2xl border border-gray-200/50 dark:border-gray-700/50"
          )}
        >
          <motion.div
            animate={{ 
              rotate: gestureState === 'triggered' ? 360 : 0,
              scale: gestureState === 'triggered' ? 1.2 : 1
            }}
            transition={{ duration: 0.3 }}
          >
            <Icon className={cn("h-8 w-8", activeGesture.color)} strokeWidth={2} />
          </motion.div>
          
          <div className="text-center">
            <p className={cn("text-sm font-semibold", activeGesture.color)}>
              {activeGesture.type === 'back' ? 'Go Back' :
               activeGesture.type === 'forward' ? 'Go Forward' :
               activeGesture.type === 'home' ? 'Go Home' : ''}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {gestureState === 'triggered' ? 'Navigating...' : 'Release to navigate'}
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const renderGestureHints = () => {
    if (!showHint) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-24 left-4 right-4 z-50 pointer-events-none"
      >
        <div className={cn(
          "bg-gradient-to-r from-blue-500 to-purple-600 text-white",
          "rounded-2xl p-4 shadow-2xl"
        )}>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">Gesture Navigation</span>
          </div>
          <div className="space-y-1 text-sm opacity-90">
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              <span>Swipe right to go back</span>
            </div>
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 rotate-180" />
              <span>Long swipe right to go home</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div ref={containerRef} className={cn("relative min-h-screen overflow-hidden", className)}>
      {/* Gesture hints */}
      <AnimatePresence>
        {renderGestureHints()}
      </AnimatePresence>
      
      {/* Main content with gesture detection */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -swipeThreshold - 50, right: swipeThreshold + 50 }}
        dragElastic={0.2}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={cn(
          "min-h-screen",
          gestureState === 'active' && "cursor-grabbing"
        )}
      >
        {children}
        
        {/* Gesture indicator overlay */}
        <AnimatePresence>
          {renderGestureIndicator()}
        </AnimatePresence>
        
        {/* Edge glow effects */}
        {gestureState === 'active' && (
          <>
            {/* Left edge glow */}
            <motion.div
              className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-blue-500 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: activeGesture?.direction === 'left' ? 1 : 0 }}
            />
            
            {/* Right edge glow */}
            <motion.div
              className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-purple-500 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: activeGesture?.direction === 'right' ? 1 : 0 }}
            />
          </>
        )}
      </motion.div>
    </div>
  );
};

// Hook for gesture navigation
export const useGestureNavigation = () => {
  const navigate = useNavigate();
  const isTouch = useIsTouchDevice();
  
  const goBack = useCallback(() => {
    if (isTouch && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
    navigate(-1);
  }, [navigate, isTouch]);
  
  const goHome = useCallback(() => {
    if (isTouch && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
    navigate('/dashboard');
  }, [navigate, isTouch]);
  
  const goForward = useCallback(() => {
    if (isTouch && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
    navigate(1);
  }, [navigate, isTouch]);
  
  return {
    goBack,
    goHome,
    goForward,
    isTouch
  };
};

export default GestureNavigator;