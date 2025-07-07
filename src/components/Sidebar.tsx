import React from 'react';
import { 
  Truck, 
  Package, 
  BarChart3, 
  Users,
  Home,
  IndianRupee,
  Building2,
  Upload,
  Download,
  Settings,
  Layers2,
  MapPin,
  Wallet,
  Receipt,
  CreditCard,
  FileText,
  Plus,
  ChevronLeft,
  Activity,
  Scan
} from 'lucide-react';
import { Logo, LogoIcon } from '@/components/ui/logo';
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItemProps {
  icon: React.ElementType;
  text: string;
  active?: boolean;
  onClick: () => void;
  badge?: number;
  sidebarCollapsed?: boolean;
}

interface SidebarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onOpenChat?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

function Sidebar({ onNavigate, currentPage, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.user_metadata?.role === 'admin' || user?.role === 'admin';
  const { bookings } = useBookings();

  const handleNavigate = (path: string) => {
    navigate(`/dashboard/${path}`);
    onNavigate(path);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside 
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className={cn(
          "flex flex-col h-full relative",
          "bg-gray-50/80 dark:bg-gray-900/80",
          "backdrop-blur-xl backdrop-saturate-150",
          "border-r border-gray-200/50 dark:border-gray-800/50",
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[60px]" : "w-[240px]"
        )}
      >
        {/* Logo Section */}
        <div className={cn(
          "h-14 flex items-center",
          "border-b border-gray-200/50 dark:border-gray-800/50",
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          {!isCollapsed ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Logo className="h-7" />
            </motion.div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-pointer">
                  <LogoIcon className="h-8 w-8" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                DesiCargo
              </TooltipContent>
            </Tooltip>
          )}
          
          {onToggleCollapse && !isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav 
          className={cn(
            "flex-1 overflow-y-auto scrollbar-thin",
            isCollapsed ? "px-1.5 py-2" : "px-3 py-3"
          )} 
        >
          {/* Quick Action */}
          <motion.button
            onClick={() => handleNavigate('new-booking')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full mb-4 rounded-xl shadow-sm",
              "bg-gradient-to-r from-blue-500 to-blue-600",
              "hover:from-blue-600 hover:to-blue-700",
              "text-white font-medium",
              "transition-all duration-300",
              isCollapsed ? "p-3" : "px-4 py-2.5 flex items-center gap-2"
            )}
          >
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Plus className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  New Booking
                </TooltipContent>
              </Tooltip>
            ) : (
              <>
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                <span className="text-sm font-semibold">New Booking</span>
              </>
            )}
          </motion.button>

          {/* Main Navigation */}
          <div className="space-y-1">
            {/* Dashboard */}
            <NavItem 
              icon={Home} 
              text="Dashboard" 
              active={currentPage === '' || currentPage === 'dashboard'}
              onClick={() => handleNavigate('')}
              sidebarCollapsed={isCollapsed}
            />
            <NavItem 
              icon={Activity} 
              text="Operations" 
              active={currentPage === 'operational'}
              onClick={() => handleNavigate('operational')}
              sidebarCollapsed={isCollapsed}
            />

            {/* Spacer */}
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-6 mb-3 px-3"
              >
                <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tracking-wider uppercase">Operations</div>
              </motion.div>
            )}
            {isCollapsed && <div className="mt-4 mb-2 mx-auto w-8 h-[1px] bg-gray-200 dark:bg-gray-800" />}
            
            {/* Operations Items */}
            <NavItem 
              icon={Package} 
              text="Bookings" 
              active={currentPage === 'bookings'}
              onClick={() => handleNavigate('bookings')}
              badge={bookings.filter(b => b.status === 'booked').length || 0}
              sidebarCollapsed={isCollapsed}
            />
            <NavItem 
              icon={Upload} 
              text="Loading" 
              active={currentPage === 'loading'}
              onClick={() => handleNavigate('loading')}
              sidebarCollapsed={isCollapsed}
            />
            <NavItem 
              icon={Download} 
              text="Unloading" 
              active={currentPage === 'unloading'}
              onClick={() => handleNavigate('unloading')}
              sidebarCollapsed={isCollapsed}
            />
            <NavItem 
              icon={MapPin} 
              text="Tracking" 
              active={currentPage === 'tracking'}
              onClick={() => handleNavigate('tracking')}
              sidebarCollapsed={isCollapsed}
            />
            <NavItem 
              icon={Layers2} 
              text="Articles" 
              active={currentPage === 'articles'}
              onClick={() => handleNavigate('articles')}
              sidebarCollapsed={isCollapsed}
            />
            <NavItem 
              icon={Scan} 
              text="Mobile Scanner" 
              active={currentPage === 'scanner'}
              onClick={() => handleNavigate('scanner')}
              sidebarCollapsed={isCollapsed}
            />
            <NavItem 
              icon={BarChart3} 
              text="Analytics" 
              active={currentPage === 'analytics'}
              onClick={() => handleNavigate('analytics')}
              sidebarCollapsed={isCollapsed}
            />

            {/* Management */}
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 mb-3 px-3"
              >
                <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tracking-wider uppercase">Management</div>
              </motion.div>
            )}
            {isCollapsed && <div className="mt-4 mb-2 mx-auto w-8 h-[1px] bg-gray-200 dark:bg-gray-800" />}
            
            <NavItem 
              icon={Users} 
              text="Customers"
              active={currentPage === 'customers'}
              onClick={() => handleNavigate('customers')}
              sidebarCollapsed={isCollapsed}
            />
            <NavItem
              icon={Truck}
              text="Vehicles"
              active={currentPage === 'vehicles'}
              onClick={() => handleNavigate('vehicles')}
              sidebarCollapsed={isCollapsed}
            />
            <NavItem
              icon={Building2}
              text="Warehouse"
              active={currentPage === 'warehouse'}
              onClick={() => handleNavigate('warehouse')}
              sidebarCollapsed={isCollapsed}
            />
            <NavItem
              icon={Building2}
              text="Branches"
              active={currentPage === 'branches'}
              onClick={() => handleNavigate('branches')}
              sidebarCollapsed={isCollapsed}
            />
            {isAdmin && (
              <NavItem
                icon={Building2}
                text="Organizations"
                active={currentPage === 'organizations'}
                onClick={() => handleNavigate('organizations')}
                sidebarCollapsed={isCollapsed}
              />
            )}

            {/* Finance */}
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-6 mb-3 px-3"
              >
                <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tracking-wider uppercase">Finance</div>
              </motion.div>
            )}
            {isCollapsed && <div className="mt-4 mb-2 mx-auto w-8 h-[1px] bg-gray-200 dark:bg-gray-800" />}
            
            <NavItem 
              icon={Wallet} 
              text="Payments"
              active={currentPage === 'payments'}
              onClick={() => handleNavigate('payments')}
              sidebarCollapsed={isCollapsed}
            />
            <NavItem 
              icon={Receipt} 
              text="Payment List"
              active={currentPage === 'payments/list'}
              onClick={() => handleNavigate('payments/list')}
              sidebarCollapsed={isCollapsed}
            />
            <NavItem 
              icon={CreditCard} 
              text="Outstanding"
              active={currentPage === 'payments/outstanding'}
              onClick={() => handleNavigate('payments/outstanding')}
              sidebarCollapsed={isCollapsed}
            />
            <NavItem 
              icon={IndianRupee} 
              text="Revenue"
              active={currentPage === 'revenue'}
              onClick={() => handleNavigate('revenue')}
              sidebarCollapsed={isCollapsed}
            />
            <NavItem 
              icon={BarChart3} 
              text="Financial Reports"
              active={currentPage === 'financial'}
              onClick={() => handleNavigate('financial')}
              sidebarCollapsed={isCollapsed}
            />
            <NavItem 
              icon={Receipt} 
              text="Expenses"
              active={currentPage === 'expenses'}
              onClick={() => handleNavigate('expenses')}
              sidebarCollapsed={isCollapsed}
            />
            <NavItem 
              icon={CreditCard} 
              text="Credit Management"
              active={currentPage === 'credit'}
              onClick={() => handleNavigate('credit')}
              sidebarCollapsed={isCollapsed}
            />
            <NavItem 
              icon={FileText} 
              text="Invoices"
              active={currentPage === 'invoices'}
              onClick={() => handleNavigate('invoices')}
              sidebarCollapsed={isCollapsed}
            />
            <NavItem 
              icon={BarChart3} 
              text="Reports"
              active={currentPage === 'reports'}
              onClick={() => handleNavigate('reports')}
              sidebarCollapsed={isCollapsed}
            />
          </div>
        </nav>

        {/* Settings at Bottom */}
        <div className={cn(
          "mt-auto border-t border-gray-200/50 dark:border-gray-800/50",
          isCollapsed ? "p-1.5" : "p-3"
        )}>
          <NavItem 
            icon={Settings} 
            text="Settings"
            active={currentPage === 'settings'}
            onClick={() => handleNavigate('settings')}
            sidebarCollapsed={isCollapsed}
          />
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}

function NavItem({ icon: Icon, text, active = false, onClick, badge, sidebarCollapsed = false }: NavItemProps) {
  const itemContent = (
    <motion.button
      onClick={onClick}
      whileHover={{ x: sidebarCollapsed ? 0 : 2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full flex items-center relative group",
        "text-sm transition-all duration-300",
        sidebarCollapsed ? "justify-center p-3 rounded-xl" : "gap-3 px-3 py-2.5 rounded-xl",
        active 
          ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium shadow-sm" 
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-800/50"
      )}
    >
      <motion.div
        animate={{ rotate: active ? 0 : 0 }}
        className="relative"
      >
        <Icon className={cn(
          "h-4 w-4 flex-shrink-0 transition-colors duration-300",
          active ? "text-blue-500" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
        )} strokeWidth={1.5} />
      </motion.div>
      {!sidebarCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center flex-1 min-w-0"
        >
          <span className="truncate flex-1">{text}</span>
          {badge && badge > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "ml-2 px-2 py-0.5 text-[10px] rounded-full font-semibold",
                active ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              )}
            >
              {badge}
            </motion.span>
          )}
        </motion.div>
      )}
      {active && !sidebarCollapsed && (
        <motion.div
          layoutId="activeNav"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </motion.button>
  );

  if (sidebarCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {itemContent}
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {text}
          {badge && badge > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded">
              {badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return itemContent;
}

export default Sidebar;