import React, { useState } from 'react';
import { 
  Truck, 
  Package, 
  BarChart3, 
  Users,
  LayoutDashboard,
  Home,
  FileText,
  IndianRupee,
  Building2,
  Upload,
  Download,
  ChevronRight,
  Settings,
  Menu,
  ChevronDown,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useBookings } from '@/hooks/useBookings';
import { useState as useHookState } from 'react';

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
}

function Sidebar({ onNavigate, currentPage }: SidebarProps) {
  const navigate = useNavigate();
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

  const handlePrintLR = (booking) => {
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
              font-family: 'Lato', Arial, sans-serif;
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
    <aside className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-100">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white shadow-md">
          <Truck className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold bg-gradient-to-r from-brand-600 to-brand-800 text-transparent bg-clip-text">
            DesiCargo
          </span>
          <span className="text-xs text-gray-500">K2K Logistics</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto scrollbar-hidden">
        {/* Quick Actions */}
        <div className="px-3 py-2 bg-gradient-to-r from-brand-50 to-blue-50 rounded-xl border border-brand-100 shadow-sm">
          <motion.div 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            className="transition-all duration-200"
          >
            <NavItem 
              icon={Package} 
              text="New Booking" 
              active={currentPage === 'new-booking'}
              onClick={() => handleNavigate('new-booking')}
            />
          </motion.div>
        </div>

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
            
            {/* Recent Bookings Dropdown */}
            <div className="ml-12 mt-1">
              <button 
                className="flex items-center text-xs text-gray-500 hover:text-brand-600 transition-colors"
                onClick={() => setShowRecentBookings(!showRecentBookings)}
              >
                <ChevronDown 
                  className={`h-3 w-3 mr-1 transition-transform ${showRecentBookings ? 'rotate-180' : ''}`} 
                />
                Recent Bookings
              </button>
              
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
                          className="pl-2 pr-1 py-1.5 rounded-lg text-xs hover:bg-gray-50 flex items-center justify-between"
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
                              <span className="font-medium">{booking.lr_number}</span>
                              <span className="text-gray-400 ml-1">({booking.article?.name || 'N/A'})</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {booking.status === 'unloaded' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-orange-600"
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
                                className="h-6 w-6 text-gray-400 hover:text-green-600"
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
                              className="h-6 w-6 text-gray-400 hover:text-brand-600"
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
                              className="h-6 w-6 text-gray-400 hover:text-brand-600"
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
                      <div className="pl-2 py-1.5 text-xs text-gray-400">
                        No recent bookings
                      </div>
                    )}
                    
                    <div className="pt-1 pl-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-brand-600 hover:text-brand-700 p-0 h-auto"
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
            icon={Building2} 
            text="Branches"
            active={currentPage === 'branches'}
            onClick={() => handleNavigate('branches')}
          />
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
          defaultOpen={false}
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
    <div className="space-y-1">
      <div 
        className="px-3 flex items-center justify-between cursor-pointer group"
        onClick={onToggle}
      >
        <span className="text-xs font-semibold text-gray-500 tracking-wider group-hover:text-brand-600 transition-colors">
          {title}
        </span>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} 
        />
      </div>
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon: Icon, text, active = false, onClick, badge, children }: NavItemProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
        active 
          ? "bg-gradient-to-r from-brand-50 to-brand-100 text-brand-700 shadow-sm border border-brand-200/50" 
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
          active ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500'
        }`}>
          <Icon className="h-4 w-4" />
        </div>
        {text}
      </div>
      {badge && (
        <span className={cn(
          "px-2 py-0.5 text-xs rounded-full",
          active
            ? "bg-brand-200 text-brand-700"
            : "bg-gray-100 text-gray-600"
        )}>
          {badge}
        </span>
      )}
      {children}
    </motion.button>
  );
}

function Layers2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m2 14 10 7 10-7" />
      <path d="m2 9 10 7 10-7" />
      <path d="m2 4 10 7 10-7" />
    </svg>
  );
}

function Printer(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect width="12" height="8" x="6" y="14" />
    </svg>
  );
}

export default Sidebar;