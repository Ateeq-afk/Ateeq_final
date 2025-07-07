import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, BatteryLow, Battery, Signal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsTouchDevice, useDeviceType } from '@/hooks/useIsMobile';
import GestureNavigator from './GestureNavigator';
import MobileBottomNav from './MobileBottomNav';
import { TouchRipple } from './TouchRipple';

interface EnhancedMobileWrapperProps {
  children: React.ReactNode;
  enableGestures?: boolean;
  showStatusBar?: boolean;
  showBottomNav?: boolean;
}

// Status bar component
const MobileStatusBar: React.FC = () => {
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Update online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Battery API (if supported)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }

    return () => {
      clearInterval(timeInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-black text-white text-sm font-medium">
      {/* Left side - Time */}
      <div className="flex items-center gap-2">
        <span className="font-semibold tabular-nums">
          {currentTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: false 
          })}
        </span>
      </div>

      {/* Center - Dynamic island/notch simulation */}
      <div className="flex-1 flex justify-center">
        <div className="w-24 h-6 bg-black rounded-full" />
      </div>

      {/* Right side - Status indicators */}
      <div className="flex items-center gap-1">
        {/* Network status */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="flex items-center"
        >
          {isOnline ? (
            <Signal className="h-4 w-4" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400" />
          )}
        </motion.div>

        {/* Wifi status */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="flex items-center"
        >
          {isOnline ? (
            <Wifi className="h-4 w-4" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400" />
          )}
        </motion.div>

        {/* Battery */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="flex items-center gap-1"
        >
          {batteryLevel < 20 ? (
            <BatteryLow className="h-4 w-4 text-red-400" />
          ) : (
            <Battery className="h-4 w-4" />
          )}
          <span className="text-xs tabular-nums">{batteryLevel}%</span>
        </motion.div>
      </div>
    </div>
  );
};

// Screen edge indicators for gesture hints
const GestureIndicators: React.FC<{ showHints: boolean }> = ({ showHints }) => {
  if (!showHints) return null;

  return (
    <>
      {/* Left edge - Back gesture */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-30 pointer-events-none"
      >
        <div className="w-1 h-20 bg-gradient-to-b from-transparent via-blue-500 to-transparent rounded-r-full opacity-50" />
      </motion.div>

      {/* Right edge - Home gesture */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 pointer-events-none"
      >
        <div className="w-1 h-20 bg-gradient-to-b from-transparent via-purple-500 to-transparent rounded-l-full opacity-50" />
      </motion.div>
    </>
  );
};

// Enhanced mobile wrapper with gesture navigation
export const EnhancedMobileWrapper: React.FC<EnhancedMobileWrapperProps> = ({
  children,
  enableGestures = true,
  showStatusBar = true,
  showBottomNav = true
}) => {
  const [showGestureHints, setShowGestureHints] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isTouch = useIsTouchDevice();
  const deviceType = useDeviceType();

  // Show gesture hints on first load
  useEffect(() => {
    const hasSeenHints = localStorage.getItem('mobile-gesture-hints-seen');
    if (!hasSeenHints && isTouch && deviceType === 'mobile') {
      setTimeout(() => setShowGestureHints(true), 1000);
      setTimeout(() => {
        setShowGestureHints(false);
        localStorage.setItem('mobile-gesture-hints-seen', 'true');
      }, 4000);
    }
  }, [isTouch, deviceType]);

  // Only show on actual mobile devices
  if (deviceType !== 'mobile') {
    return <>{children}</>;
  }

  const content = enableGestures ? (
    <GestureNavigator
      enableSwipeBack={true}
      enableSwipeForward={false}
      swipeThreshold={100}
      className="min-h-screen"
    >
      {children}
    </GestureNavigator>
  ) : (
    <div className="min-h-screen">{children}</div>
  );

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Mobile status bar */}
      {showStatusBar && <MobileStatusBar />}

      {/* Gesture indicators */}
      <AnimatePresence>
        <GestureIndicators showHints={showGestureHints} />
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden">
        {content}
      </div>

      {/* Bottom navigation */}
      {showBottomNav && (
        <MobileBottomNav 
          onOpenMenu={() => setIsMenuOpen(true)} 
        />
      )}

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                {/* Handle */}
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto" />
                
                {/* Menu items */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Quick Actions
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Settings', icon: '⚙️', path: '/settings' },
                      { label: 'Profile', icon: '👤', path: '/profile' },
                      { label: 'Help', icon: '❓', path: '/help' },
                      { label: 'Feedback', icon: '💬', path: '/feedback' }
                    ].map((item, index) => (
                      <TouchRipple key={index}>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-2xl",
                            "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                            "transition-colors duration-200"
                          )}
                          onClick={() => {
                            setIsMenuOpen(false);
                            // Navigate to item.path
                          }}
                        >
                          <span className="text-2xl">{item.icon}</span>
                          <span className="text-sm font-medium">{item.label}</span>
                        </motion.button>
                      </TouchRipple>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Home indicator (iOS style) */}
      <div className="fixed bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white rounded-full opacity-30" />
    </div>
  );
};

export default EnhancedMobileWrapper;