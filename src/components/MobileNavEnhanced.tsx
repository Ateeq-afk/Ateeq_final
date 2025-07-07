import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Home, 
  Package, 
  Truck, 
  Users, 
  BarChart3, 
  Settings,
  ChevronRight,
  Search,
  Bell,
  User,
  Plus,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MobileNavEnhancedProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

// Quick action items for mobile
const QUICK_ACTIONS = [
  {
    id: 'new-booking',
    label: 'New Booking',
    icon: Plus,
    color: 'bg-blue-500',
    path: '/dashboard/new-booking'
  },
  {
    id: 'new-booking-wizard',
    label: 'Quick Book',
    icon: Zap,
    color: 'bg-green-500',
    path: '/dashboard/new-booking?wizard=true'
  },
  {
    id: 'search',
    label: 'Search',
    icon: Search,
    color: 'bg-purple-500',
    action: 'search'
  },
  {
    id: 'notifications',
    label: 'Alerts',
    icon: Bell,
    color: 'bg-orange-500',
    badge: '3',
    path: '/dashboard/notifications'
  },
];

// Main navigation items optimized for mobile
const MOBILE_NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    path: '/dashboard',
    description: 'Overview & stats'
  },
  {
    id: 'bookings',
    label: 'Bookings',
    icon: Package,
    path: '/dashboard/bookings',
    description: 'Manage shipments'
  },
  {
    id: 'loading',
    label: 'Loading',
    icon: Truck,
    path: '/dashboard/loading',
    description: 'OGPL & vehicles'
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    path: '/dashboard/customers',
    description: 'Customer management'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    path: '/dashboard/reports',
    description: 'Analytics & insights'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/dashboard/settings',
    description: 'App preferences'
  },
];

export default function MobileNavEnhanced({ currentPage, onNavigate }: MobileNavEnhancedProps) {
  const [open, setOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setOpen(false);
  };

  const handleQuickAction = (action: any) => {
    if (action.action === 'search') {
      setShowSearch(true);
      return;
    }
    
    if (action.path) {
      handleNavigate(action.path);
    }
  };

  const getCurrentPageInfo = () => {
    return MOBILE_NAV_ITEMS.find(item => 
      currentPage.includes(item.id) || item.path === currentPage
    ) || MOBILE_NAV_ITEMS[0];
  };

  const currentPageInfo = getCurrentPageInfo();

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </Sheet>
          
          <div className="flex items-center gap-2">
            <currentPageInfo.icon className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-900">{currentPageInfo.label}</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(true)}
            className="p-2"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-80">
          <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* User Profile Section */}
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">John Doe</div>
                  <div className="text-sm text-gray-500">Branch Manager</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuickAction(action)}
                      className="relative flex flex-col items-center gap-2 p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-white",
                        action.color
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{action.label}</span>
                      {action.badge && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 px-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Menu</h3>
              <div className="space-y-2">
                {MOBILE_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage.includes(item.id) || item.path === currentPage;
                  
                  return (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNavigate(item.path)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
                        isActive 
                          ? "bg-blue-50 border border-blue-100 text-blue-700" 
                          : "hover:bg-gray-50 text-gray-700"
                      )}
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center",
                        isActive ? "bg-blue-100" : "bg-gray-100"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center">
                DesiCargo v2.0 • Mobile
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Search Overlay */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 pt-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-gray-400" />
                  <Input
                    autoFocus
                    placeholder="Search bookings, customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 text-base"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSearch(false)}
                    className="p-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {searchQuery && (
                <div className="p-4 max-h-60 overflow-y-auto">
                  <div className="text-sm text-gray-500 mb-2">
                    Search results for "{searchQuery}"
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <div className="font-medium text-sm">LR123456</div>
                      <div className="text-xs text-gray-500">Delhi → Mumbai</div>
                    </div>
                    <div className="p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <div className="font-medium text-sm">ABC Traders</div>
                      <div className="text-xs text-gray-500">Customer</div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Safe Area for Mobile */}
      <div className="md:hidden h-6 bg-white"></div>
    </>
  );
}