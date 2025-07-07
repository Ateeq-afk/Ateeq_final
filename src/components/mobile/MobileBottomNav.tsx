import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home,
  Package,
  MapPin,
  BarChart3,
  Menu,
  Plus,
  Search,
  Bell,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useIsTouchDevice } from '@/hooks/useIsMobile';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, path: '/dashboard' },
  { id: 'bookings', label: 'Bookings', icon: Package, path: '/dashboard/bookings', badge: 3 },
  { id: 'tracking', label: 'Track', icon: MapPin, path: '/dashboard/tracking' },
  { id: 'financial', label: 'Finance', icon: BarChart3, path: '/dashboard/financial' },
  { id: 'more', label: 'More', icon: Menu, path: '#' }
];

export default function MobileBottomNav({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isTouch = useIsTouchDevice();
  const [showFab, setShowFab] = React.useState(true);
  const [lastTap, setLastTap] = React.useState(0);

  // Hide FAB on scroll
  React.useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowFab(currentScrollY <= lastScrollY || currentScrollY < 50);
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (item: NavItem) => {
    // Add haptic feedback for touch devices
    if (isTouch && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
    
    if (item.id === 'more') {
      onOpenMenu?.();
    } else {
      navigate(item.path);
    }
  };
  
  const handleFabClick = () => {
    // Add haptic feedback
    if (isTouch && 'vibrate' in navigator) {
      navigator.vibrate([25, 50, 25]);
    }
    navigate('/dashboard/new-booking');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Enhanced Floating Action Button */}
      <AnimatePresence>
        {showFab && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-20 right-4 z-40"
          >
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleFabClick}
              className={cn(
                "group relative w-16 h-16 rounded-2xl overflow-hidden",
                "bg-gradient-to-br from-blue-500 to-blue-600",
                "text-white shadow-xl hover:shadow-2xl",
                "flex items-center justify-center",
                "transition-all duration-300",
                "border border-blue-400/30",
                "haptic-medium hover-lift-strong"
              )}
            >
              {/* Glass morphism background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent" />
              
              {/* Noise texture */}
              <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay">
                <div className="w-full h-full" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`
                }} />
              </div>
              
              <motion.div
                className="relative z-10 flex items-center justify-center"
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.3 }}
              >
                <Plus className="h-7 w-7" strokeWidth={2.5} />
              </motion.div>
              
              {/* Sparkle effect on hover */}
              <motion.div
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                initial={{ scale: 0 }}
                whileHover={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Sparkles className="h-3 w-3 text-white/70" />
              </motion.div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Bottom Navigation */}
      <motion.div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40",
          "bg-white/90 dark:bg-black/90",
          "backdrop-blur-2xl backdrop-saturate-200",
          "border-t border-gray-200/30 dark:border-gray-800/30",
          "shadow-lg shadow-gray-900/5 dark:shadow-gray-900/20",
          "safe-bottom" // For iOS safe area
        )}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <nav className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavClick(item)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex flex-col items-center justify-center",
                  "flex-1 h-full py-2 px-1",
                  "transition-all duration-300",
                  "relative group haptic-light"
                )}
              >
                {/* Enhanced Active indicator */}
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-px left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                
                {/* Background glow for active state */}
                {active && (
                  <motion.div
                    layoutId="activeGlow"
                    className="absolute inset-1 rounded-xl bg-blue-500/10 dark:bg-blue-400/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Enhanced Icon container */}
                <div className="relative z-10">
                  <motion.div
                    animate={{
                      scale: active ? 1.1 : 1,
                      rotate: active ? [0, -5, 5, 0] : 0
                    }}
                    transition={{
                      scale: { duration: 0.2 },
                      rotate: { duration: 0.3, times: [0, 0.2, 0.8, 1] }
                    }}
                  >
                    <Icon 
                      className={cn(
                        "h-5 w-5 mb-1 transition-all duration-300",
                        active 
                          ? "text-blue-600 dark:text-blue-400" 
                          : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                      )} 
                      strokeWidth={active ? 2.5 : 1.5}
                    />
                  </motion.div>
                  {item.badge && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.2 }}
                      className="absolute -top-1 -right-2"
                    >
                      <Badge 
                        variant="destructive" 
                        className="h-5 w-5 p-0 flex items-center justify-center text-[10px] shadow-sm border border-white/50 dark:border-gray-800/50"
                      >
                        {item.badge}
                      </Badge>
                    </motion.div>
                  )}
                </div>

                {/* Enhanced Label */}
                <motion.span 
                  className={cn(
                    "text-[10px] font-medium transition-all duration-300 relative z-10",
                    active 
                      ? "text-blue-600 dark:text-blue-400 font-semibold" 
                      : "text-gray-600 dark:text-gray-400"
                  )}
                  animate={{
                    scale: active ? 1.05 : 1
                  }}
                >
                  {item.label}
                </motion.span>

                {/* Enhanced Touch ripple effect */}
                <div className="absolute inset-0 overflow-hidden rounded-xl">
                  <motion.div 
                    className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 opacity-0 group-active:opacity-100 transition-opacity duration-150" 
                    whileTap={{ scale: 1.5, opacity: 0.3 }}
                  />
                </div>
              </motion.button>
            );
          })}
        </nav>
      </motion.div>
    </>
  );
}