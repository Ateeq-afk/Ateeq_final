import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Package, 
  Truck, 
  Users, 
  BarChart3,
  Plus,
  Search,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onQuickAction?: (action: string) => void;
}

const BOTTOM_NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Home',
    icon: Home,
    path: '/dashboard',
  },
  {
    id: 'bookings',
    label: 'Bookings',
    icon: Package,
    path: '/dashboard/bookings',
  },
  {
    id: 'quick-add',
    label: 'Add',
    icon: Plus,
    action: 'quick-add',
    special: true,
  },
  {
    id: 'loading',
    label: 'Loading',
    icon: Truck,
    path: '/dashboard/loading',
  },
  {
    id: 'more',
    label: 'More',
    icon: BarChart3,
    action: 'more',
  },
];

export default function BottomNavigation({ currentPage, onNavigate, onQuickAction }: BottomNavigationProps) {
  const handleItemClick = (item: any) => {
    if (item.action) {
      onQuickAction?.(item.action);
    } else if (item.path) {
      onNavigate(item.path);
    }
  };

  const isActive = (item: any) => {
    if (item.action) return false;
    return currentPage.includes(item.id) || item.path === currentPage;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
      <div className="grid grid-cols-5 h-16">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          if (item.special) {
            return (
              <div key={item.id} className="flex items-center justify-center">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleItemClick(item)}
                  className="h-12 w-12 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Icon className="h-6 w-6 text-white" />
                </motion.button>
              </div>
            );
          }

          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleItemClick(item)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 transition-colors",
                active 
                  ? "text-blue-600" 
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.id === 'bookings' && (
                  <Badge className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
                    3
                  </Badge>
                )}
              </div>
              <span className={cn(
                "text-xs font-medium transition-colors",
                active ? "text-blue-600" : "text-gray-500"
              )}>
                {item.label}
              </span>
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 h-0.5 bg-blue-600 rounded-full"
                  style={{ width: '24px' }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Safe area for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-white"></div>
    </div>
  );
}