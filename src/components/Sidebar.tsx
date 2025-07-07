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
  Plus,
  ChevronLeft,
  Activity,
  Scan
} from 'lucide-react';
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
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "flex flex-col h-full",
          "bg-background border-r border-border/50",
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[60px]" : "w-[240px]"
        )}
      >
        {/* Logo Section */}
        <div className={cn(
          "h-16 flex items-center",
          "border-b border-border/50",
          isCollapsed ? "justify-center px-2" : "justify-between px-5"
        )}>
          {!isCollapsed ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center text-white">
                <Truck className="h-4 w-4" />
              </div>
              <span className="font-semibold text-lg">DesiCargo</span>
            </motion.div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center text-white cursor-pointer">
                  <Truck className="h-4 w-4" />
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
              className="p-1.5 hover:bg-accent rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav 
          className={cn(
            "flex-1 overflow-y-auto",
            isCollapsed ? "px-2 py-2" : "px-3 py-4"
          )} 
        >
          {/* Quick Action */}
          <motion.button
            onClick={() => handleNavigate('new-booking')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full mb-4 rounded-lg",
              "bg-brand-500 hover:bg-brand-600",
              "text-white font-medium",
              "transition-all duration-200",
              isCollapsed ? "p-2.5" : "px-4 py-2.5 flex items-center gap-2"
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
                <Plus className="h-4 w-4" />
                <span className="text-sm">New Booking</span>
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
              <div className="my-3 px-3">
                <div className="text-xs font-medium text-muted-foreground">OPERATIONS</div>
              </div>
            )}
            
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
              <div className="my-3 px-3">
                <div className="text-xs font-medium text-muted-foreground">MANAGEMENT</div>
              </div>
            )}
            
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
              <div className="my-3 px-3">
                <div className="text-xs font-medium text-muted-foreground">FINANCE</div>
              </div>
            )}
            
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
          "mt-auto border-t border-border/50",
          isCollapsed ? "p-2" : "p-3"
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
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center relative",
        "text-sm transition-all duration-200",
        sidebarCollapsed ? "justify-center p-2 rounded-lg" : "gap-3 px-3 py-2 rounded-lg",
        active 
          ? "bg-accent text-foreground font-medium" 
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
    >
      <Icon className="h-4 w-4" />
      {!sidebarCollapsed && (
        <>
          <span>{text}</span>
          {badge && badge > 0 && (
            <span className={cn(
              "ml-auto px-2 py-0.5 text-xs rounded-full font-medium",
              active ? "bg-foreground/10" : "bg-muted"
            )}>
              {badge}
            </span>
          )}
        </>
      )}
      {active && (
        <motion.div
          layoutId="activeNav"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-500 rounded-r"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </button>
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