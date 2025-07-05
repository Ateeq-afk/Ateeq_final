import React, { useState } from 'react';
import { 
  Truck, 
  Package, 
  BarChart3, 
  Users,
  Home,
  FileText,
  IndianRupee,
  Building2,
  Upload,
  Download,
  ChevronRight,
  Settings,
  ChevronDown,
  CheckCircle2,
  Layers2,
  Printer,
  MapPin,
  // MessageSquare
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useBookings } from '@/hooks/useBookings';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

interface NavItemProps {
  icon: React.ElementType;
  text: string;
  active?: boolean;
  onClick: () => void;
  badge?: number;
  children?: React.ReactNode;
}

interface NavGroupProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

interface SidebarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onOpenChat?: () => void;
}

function Sidebar({ onNavigate, currentPage, onOpenChat }: SidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.user_metadata?.role === 'admin' || user?.role === 'admin';
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    overview: false,
    operations: false,
    management: false,
    finance: false,
    settings: false
  });
  const [showRecentBookings, setShowRecentBookings] = useState(false);
  const { bookings, updateBookingStatus } = useBookings();

  // Get the 5 most recent bookings
  const recentBookings = bookings.slice(0, 5);

  const handleNavigate = (path: string) => {
    navigate(`/dashboard/${path}`);
    onNavigate(path);
  };

  const toggleCollapse = (section: string) => {
    setCollapsed(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePrintLR = (booking: any) => {
    // Create a printable version of the LR
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lorry Receipt - ${booking.lr_number}</title>
          <style>
            body {
              font-family: 'Inter', Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f3f4f6;
              font-weight: bold;
            }
            h2, h3, h4 {
              margin-top: 0;
              font-weight: bold;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .section {
              margin-bottom: 20px;
            }
            .flex-row {
              display: flex;
              gap: 10px;
            }
            .flex-col {
              flex: 1;
            }
            .border-box {
              border: 1px solid #ddd;
              padding: 10px;
            }
            .signature-row {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
            }
            .signature-box {
              text-align: center;
              width: 30%;
            }
            .signature-line {
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 20px;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div>
                <h2>Lorry Receipt</h2>
                <p>LR #${booking.lr_number}</p>
              </div>
              <div style="text-align: right;">
                <h3>DesiCargo Logistics</h3>
                <p>Date: ${new Date(booking.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div class="section flex-row">
              <div class="flex-col border-box">
                <h4>From</h4>
                <p>${booking.from_branch_details?.name || 'N/A'}</p>
                <p>${booking.from_branch_details?.city || ''}, ${booking.from_branch_details?.state || ''}</p>
              </div>
              <div class="flex-col border-box">
                <h4>To</h4>
                <p>${booking.to_branch_details?.name || 'N/A'}</p>
                <p>${booking.to_branch_details?.city || ''}, ${booking.to_branch_details?.state || ''}</p>
              </div>
            </div>
            
            <div class="section flex-row">
              <div class="flex-col border-box">
                <h4>Sender</h4>
                <p>${booking.sender?.name || 'N/A'}</p>
                <p>${booking.sender?.mobile || 'N/A'}</p>
              </div>
              <div class="flex-col border-box">
                <h4>Receiver</h4>
                <p>${booking.receiver?.name || 'N/A'}</p>
                <p>${booking.receiver?.mobile || 'N/A'}</p>
              </div>
            </div>
            
            <div class="section">
              <h4>Article Details</h4>
              <table>
                <tr>
                  <th>Article</th>
                  <th>Description</th>
                  <th style="text-align: right;">Quantity</th>
                  <th style="text-align: right;">Rate</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
                <tr>
                  <td>${booking.article?.name || 'N/A'}</td>
                  <td>${booking.description || '-'}</td>
                  <td style="text-align: right;">${booking.quantity} ${booking.uom}</td>
                  <td style="text-align: right;">₹${booking.freight_per_qty}</td>
                  <td style="text-align: right;">₹${(booking.quantity * booking.freight_per_qty).toFixed(2)}</td>
                </tr>
                ${booking.loading_charges ? `
                <tr>
                  <td colspan="4" style="text-align: right;">Loading Charges:</td>
                  <td style="text-align: right;">₹${booking.loading_charges.toFixed(2)}</td>
                </tr>` : ''}
                ${booking.unloading_charges ? `
                <tr>
                  <td colspan="4" style="text-align: right;">Unloading Charges:</td>
                  <td style="text-align: right;">₹${booking.unloading_charges.toFixed(2)}</td>
                </tr>` : ''}
                <tr>
                  <td colspan="4" style="text-align: right; font-weight: bold;">Total:</td>
                  <td style="text-align: right; font-weight: bold;">₹${booking.total_amount.toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
            <div class="section flex-row">
              <div class="flex-col border-box">
                <h4>Payment Details</h4>
                <p>Payment Type: ${booking.payment_type}</p>
                <p>Status: ${booking.status.replace('_', ' ')}</p>
              </div>
              <div class="flex-col border-box">
                <h4>Additional Information</h4>
                <p>Booking Date: ${new Date(booking.created_at).toLocaleDateString()}</p>
                <p>Expected Delivery: ${booking.expected_delivery_date ? new Date(booking.expected_delivery_date).toLocaleDateString() : 'Not specified'}</p>
              </div>
            </div>
            
            <div class="signature-row">
              <div class="signature-box">
                <p class="signature-line">Sender's Signature</p>
              </div>
              <div class="signature-box">
                <p class="signature-line">Receiver's Signature</p>
              </div>
              <div class="signature-box">
                <p class="signature-line">For DesiCargo Logistics</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Print after content is loaded
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <aside className="flex flex-col h-full relative overflow-hidden">
      {/* Logo */}
      <div className="h-20 flex items-center gap-3 px-6 border-b border-border/50 relative overflow-hidden">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 20,
            delay: 0.2
          }}
          className="h-12 w-12 rounded-2xl gradient-brand flex items-center justify-center text-white shadow-lg relative group hover-scale"
        >
          <div className="absolute inset-0 rounded-2xl gradient-brand opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-300" />
          <Truck className="h-6 w-6 relative z-10" />
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col"
        >
          <span className="text-xl font-heading font-bold text-gradient">
            DesiCargo
          </span>
          <span className="text-xs text-muted-foreground">Premium Logistics</span>
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/5 to-transparent dark:via-brand-400/5" />
      </div>
      
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto overflow-x-hidden" aria-label="Main navigation" style={{ maxHeight: 'calc(100vh - 5rem)', scrollbarWidth: 'thin' }}>
        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative overflow-hidden rounded-xl gradient-brand-subtle p-[1px]"
        >
          <div className="relative bg-background/90 dark:bg-background/70 rounded-xl p-3">
            <div className="absolute inset-0 gradient-brand opacity-10" />
            <motion.div 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              className="relative z-10"
            >
              <button
                onClick={() => handleNavigate('new-booking')}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg bg-foreground text-background hover:opacity-90 transition-all duration-200 group"
              >
                <div className="h-8 w-8 rounded-lg bg-background/20 flex items-center justify-center group-hover:bg-background/30 transition-colors">
                  <Package className="h-4 w-4" />
                </div>
                <span className="font-medium">New Booking</span>
                <ChevronRight className="h-4 w-4 ml-auto opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Chat Button - Temporarily disabled */}
        {/* {onOpenChat && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="px-4 mb-4"
          >
            <button
              onClick={onOpenChat}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-200 group"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <MessageSquare className="h-4 w-4" />
              </div>
              <span className="font-medium text-foreground">Team Chat</span>
              <ChevronRight className="h-4 w-4 ml-auto opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
          </motion.div>
        )} */}

        {/* Overview */}
        <NavGroup 
          title="OVERVIEW" 
          defaultOpen={true}
          onToggle={() => toggleCollapse('overview')}
          isCollapsed={collapsed.overview}
        >
          <NavItem 
            icon={Home} 
            text="Dashboard" 
            active={currentPage === '' || currentPage === 'dashboard'}
            onClick={() => handleNavigate('')}
          />
        </NavGroup>
        
        {/* Operations */}
        <NavGroup 
          title="OPERATIONS" 
          defaultOpen={true}
          onToggle={() => toggleCollapse('operations')}
          isCollapsed={collapsed.operations}
        >
          <div>
            <NavItem 
              icon={Package} 
              text="Bookings" 
              active={currentPage === 'bookings'}
              onClick={() => handleNavigate('bookings')}
              badge={bookings.length > 0 ? bookings.filter(b => b.status === 'booked').length : 0}
            />
            
            {/* Recent Bookings Dropdown - Hidden for now */}
            {false && (
              <div className="ml-12 mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center text-xs dark:text-gray-400 dark:hover:text-gray-300"
                  onClick={() => setShowRecentBookings(!showRecentBookings)}
                >
                  <ChevronDown
                    className={`h-3 w-3 mr-1 transition-transform ${showRecentBookings ? 'rotate-180' : ''}`}
                  />
                  Recent Bookings
                </Button>
                
                <AnimatePresence>
                  {showRecentBookings && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mt-2 space-y-1"
                    >
                      {recentBookings.length > 0 ? (
                        recentBookings.map((booking) => (
                          <div 
                            key={booking.id} 
                            className="pl-2 pr-1 py-1.5 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                                booking.status === 'delivered' ? 'bg-green-500' :
                                booking.status === 'out_for_delivery' ? 'bg-orange-500' :
                                booking.status === 'in_transit' ? 'bg-blue-500' :
                                booking.status === 'unloaded' ? 'bg-purple-500' :
                                booking.status === 'cancelled' ? 'bg-red-500' :
                                'bg-yellow-500'
                              }`}></div>
                              <div className="truncate">
                                <span className="font-medium dark:text-gray-300">{booking.lr_number}</span>
                                <span className="text-gray-400 dark:text-gray-500 ml-1">({booking.article?.name || 'N/A'})</span>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {booking.status === 'unloaded' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-gray-400 hover:text-orange-600 dark:hover:text-orange-500"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await updateBookingStatus(booking.id, 'out_for_delivery');
                                  }}
                                >
                                  <Truck className="h-3 w-3" />
                                </Button>
                              )}
                              {booking.status === 'out_for_delivery' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-gray-400 hover:text-green-600 dark:hover:text-green-500"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await updateBookingStatus(booking.id, 'delivered');
                                  }}
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-brand-600 dark:hover:text-brand-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintLR(booking);
                                }}
                              >
                                <Printer className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-brand-600 dark:hover:text-brand-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/dashboard/bookings/${booking.id}`);
                                }}
                              >
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="pl-2 py-1.5 text-xs text-gray-400 dark:text-gray-500">
                          No recent bookings
                        </div>
                      )}
                      
                      <div className="pt-1 pl-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 p-0 h-auto"
                          onClick={() => handleNavigate('bookings')}
                        >
                          View all bookings
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
          
          <NavItem 
            icon={Upload} 
            text="Loading" 
            active={currentPage === 'loading'}
            onClick={() => handleNavigate('loading')}
          />
          <NavItem 
            icon={Download} 
            text="Unloading" 
            active={currentPage === 'unloading'}
            onClick={() => handleNavigate('unloading')}
          />
          <NavItem 
            icon={MapPin} 
            text="Article Tracking" 
            active={currentPage === 'tracking'}
            onClick={() => handleNavigate('tracking')}
          />
          <NavItem 
            icon={Layers2} 
            text="Articles" 
            active={currentPage === 'articles'}
            onClick={() => handleNavigate('articles')}
          />
        </NavGroup>

        {/* Management */}
        <NavGroup 
          title="MANAGEMENT" 
          defaultOpen={true}
          onToggle={() => toggleCollapse('management')}
          isCollapsed={collapsed.management}
        >
          <NavItem 
            icon={Users} 
            text="Customers"
            active={currentPage === 'customers'}
            onClick={() => handleNavigate('customers')}
          />
          <NavItem
            icon={Truck}
            text="Vehicles"
            active={currentPage === 'vehicles'}
            onClick={() => handleNavigate('vehicles')}
          />
          <NavItem
            icon={Package}
            text="Warehouse"
            active={currentPage === 'warehouse'}
            onClick={() => handleNavigate('warehouse')}
          />
          <NavItem
            icon={Building2}
            text="Branches"
            active={currentPage === 'branches'}
            onClick={() => handleNavigate('branches')}
          />
          {isAdmin && (
            <NavItem
              icon={Building2}
              text="Organizations"
              active={currentPage === 'organizations'}
              onClick={() => handleNavigate('organizations')}
            />
          )}
        </NavGroup>

        {/* Finance */}
        <NavGroup 
          title="FINANCE" 
          defaultOpen={true}
          onToggle={() => toggleCollapse('finance')}
          isCollapsed={collapsed.finance}
        >
          <NavItem 
            icon={IndianRupee} 
            text="Revenue"
            active={currentPage === 'revenue'}
            onClick={() => handleNavigate('revenue')}
          />
          <NavItem 
            icon={BarChart3} 
            text="Reports"
            active={currentPage === 'reports'}
            onClick={() => handleNavigate('reports')}
          />
        </NavGroup>
        
        {/* Settings */}
        <NavGroup 
          title="SETTINGS" 
          defaultOpen={true}
          onToggle={() => toggleCollapse('settings')}
          isCollapsed={collapsed.settings}
        >
          <NavItem 
            icon={Settings} 
            text="Preferences"
            active={currentPage === 'settings'}
            onClick={() => handleNavigate('settings')}
          />
        </NavGroup>

      </nav>
    </aside>
  );
}

function NavGroup({ title, children, defaultOpen = true, onToggle, isCollapsed }: NavGroupProps & { onToggle: () => void, isCollapsed: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-2"
    >
      <div 
        className="px-3 flex items-center justify-between cursor-pointer group py-1"
        onClick={onToggle}
        aria-expanded={!isCollapsed}
        role="button"
        aria-label={`Toggle ${title} section`}
      >
        <span className="text-[11px] font-semibold text-muted-foreground/70 tracking-[0.08em] uppercase group-hover:text-foreground/70 transition-colors duration-200">
          {title}
        </span>
        <motion.div
          animate={{ rotate: isCollapsed ? -90 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
        </motion.div>
      </div>
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="overflow-hidden space-y-0.5"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function NavItem({ icon: Icon, text, active = false, onClick, badge, children }: NavItemProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "group relative flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
        active 
          ? "bg-gradient-to-r from-brand-500/10 via-brand-400/10 to-brand-600/10 text-foreground shadow-sm" 
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
      whileHover={{ x: active ? 0 : 4 }}
      whileTap={{ scale: 0.98 }}
    >
      {active && (
        <motion.div
          layoutId="activeNav"
          className="absolute inset-0 bg-gradient-to-r from-brand-500/10 via-brand-400/10 to-brand-600/10 rounded-xl"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <div className="relative z-10 flex items-center gap-3">
        <div className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300",
          active 
            ? "bg-foreground/10 text-foreground shadow-sm" 
            : "bg-accent/50 text-muted-foreground group-hover:bg-accent group-hover:text-foreground"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="font-medium">{text}</span>
      </div>
      <div className="relative z-10 flex items-center gap-2">
        {badge && badge > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              "px-2 py-0.5 text-xs rounded-full font-medium",
              active
                ? "bg-foreground/10 text-foreground"
                : "bg-brand-500/10 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300"
            )}
          >
            {badge}
          </motion.span>
        )}
        {children}
      </div>
    </motion.button>
  );
}

export default Sidebar;