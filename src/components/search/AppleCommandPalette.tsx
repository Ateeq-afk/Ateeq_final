import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search,
  Command,
  ArrowRight,
  Package,
  Users,
  Truck,
  Building2,
  Receipt,
  BarChart3,
  MapPin,
  FileText,
  Settings,
  CreditCard,
  Calendar,
  Hash,
  Filter,
  Sparkles,
  Clock,
  TrendingUp,
  Zap,
  ChevronRight,
  X,
  Home,
  Activity,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useHotkeys } from 'react-hotkeys-hook';
import { useDebounce } from '@/hooks/useDebounce';

// Command types
const COMMAND_TYPES = {
  navigation: { icon: ArrowRight, color: 'blue' },
  booking: { icon: Package, color: 'green' },
  customer: { icon: Users, color: 'purple' },
  vehicle: { icon: Truck, color: 'orange' },
  branch: { icon: Building2, color: 'pink' },
  invoice: { icon: Receipt, color: 'yellow' },
  report: { icon: BarChart3, color: 'indigo' },
  tracking: { icon: MapPin, color: 'red' },
  settings: { icon: Settings, color: 'gray' }
};

// Search result item interface
interface SearchResult {
  id: string;
  type: keyof typeof COMMAND_TYPES;
  title: string;
  subtitle?: string;
  action: () => void;
  keywords?: string[];
  icon?: React.ElementType;
  badge?: string;
  recent?: boolean;
  trending?: boolean;
}

// Recent searches storage
const RECENT_SEARCHES_KEY = 'desi-cargo-recent-searches';
const MAX_RECENT_SEARCHES = 5;

// Search result component
const SearchResultItem = ({ 
  result, 
  isSelected, 
  onClick 
}: { 
  result: SearchResult; 
  isSelected: boolean; 
  onClick: () => void;
}) => {
  const typeConfig = COMMAND_TYPES[result.type];
  const Icon = result.icon || typeConfig.icon;
  
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      whileHover={{ x: 4 }}
      onClick={onClick}
      className={cn(
        "w-full px-4 py-3 flex items-center gap-3",
        "text-left transition-all duration-200",
        "border-l-2",
        isSelected 
          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500" 
          : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border-transparent"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
        `bg-${typeConfig.color}-100 dark:bg-${typeConfig.color}-900/30`
      )}>
        <Icon className={cn(
          "h-5 w-5",
          `text-${typeConfig.color}-600 dark:text-${typeConfig.color}-400`
        )} strokeWidth={1.5} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            "font-medium truncate",
            isSelected ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-gray-100"
          )}>
            {result.title}
          </p>
          {result.badge && (
            <Badge variant="outline" className="text-xs">
              {result.badge}
            </Badge>
          )}
          {result.recent && (
            <Clock className="h-3 w-3 text-gray-400" />
          )}
          {result.trending && (
            <TrendingUp className="h-3 w-3 text-green-500" />
          )}
        </div>
        {result.subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {result.subtitle}
          </p>
        )}
      </div>
      
      <ChevronRight className={cn(
        "h-4 w-4 flex-shrink-0 transition-transform",
        isSelected ? "translate-x-1 text-blue-500" : "text-gray-400"
      )} />
    </motion.button>
  );
};

// Command section
const CommandSection = ({ 
  title, 
  icon: Icon, 
  results, 
  selectedIndex, 
  onSelect,
  startIndex 
}: {
  title: string;
  icon?: React.ElementType;
  results: SearchResult[];
  selectedIndex: number;
  onSelect: (result: SearchResult) => void;
  startIndex: number;
}) => {
  if (results.length === 0) return null;

  return (
    <div className="py-2">
      <div className="px-4 py-2 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {title}
        </p>
      </div>
      <div>
        {results.map((result, index) => (
          <SearchResultItem
            key={result.id}
            result={result}
            isSelected={selectedIndex === startIndex + index}
            onClick={() => onSelect(result)}
          />
        ))}
      </div>
    </div>
  );
};

export default function AppleCommandPalette({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 150);

  // Load recent searches
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches');
      }
    }
  }, []);

  // Save to recent searches
  const saveToRecent = (result: SearchResult) => {
    const updated = [
      { ...result, recent: true },
      ...recentSearches.filter(r => r.id !== result.id)
    ].slice(0, MAX_RECENT_SEARCHES);
    
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // All available commands
  const allCommands: SearchResult[] = useMemo(() => [
    // Navigation
    {
      id: 'nav-dashboard',
      type: 'navigation',
      title: 'Dashboard',
      subtitle: 'View executive dashboard',
      icon: Home,
      action: () => navigate('/dashboard'),
      keywords: ['home', 'overview', 'main']
    },
    {
      id: 'nav-bookings',
      type: 'navigation',
      title: 'Bookings',
      subtitle: 'Manage all bookings',
      icon: Package,
      action: () => navigate('/dashboard/bookings'),
      keywords: ['orders', 'shipments']
    },
    {
      id: 'nav-tracking',
      type: 'navigation',
      title: 'Real-Time Tracking',
      subtitle: 'Track vehicles and shipments',
      icon: MapPin,
      action: () => navigate('/dashboard/tracking'),
      keywords: ['gps', 'location', 'live']
    },
    {
      id: 'nav-financial',
      type: 'navigation',
      title: 'Financial Dashboard',
      subtitle: 'Revenue and expense analytics',
      icon: DollarSign,
      action: () => navigate('/dashboard/financial'),
      keywords: ['money', 'revenue', 'profit']
    },
    
    // Quick Actions
    {
      id: 'action-new-booking',
      type: 'booking',
      title: 'Create New Booking',
      subtitle: 'Start a new shipment booking',
      icon: Package,
      badge: 'Quick',
      action: () => navigate('/dashboard/new-booking'),
      keywords: ['new', 'create', 'add', 'shipment']
    },
    {
      id: 'action-new-customer',
      type: 'customer',
      title: 'Add New Customer',
      subtitle: 'Register a new customer',
      icon: Users,
      action: () => navigate('/dashboard/customers/new'),
      keywords: ['new', 'create', 'add', 'client']
    },
    {
      id: 'action-new-invoice',
      type: 'invoice',
      title: 'Generate Invoice',
      subtitle: 'Create a new invoice',
      icon: Receipt,
      action: () => navigate('/dashboard/invoices/new'),
      keywords: ['new', 'create', 'bill']
    },
    
    // Reports
    {
      id: 'report-revenue',
      type: 'report',
      title: 'Revenue Report',
      subtitle: 'View revenue analytics',
      icon: TrendingUp,
      trending: true,
      action: () => navigate('/dashboard/reports/revenue'),
      keywords: ['analytics', 'income', 'earnings']
    },
    {
      id: 'report-performance',
      type: 'report',
      title: 'Performance Report',
      subtitle: 'Operational performance metrics',
      icon: Activity,
      action: () => navigate('/dashboard/reports/performance'),
      keywords: ['analytics', 'metrics', 'kpi']
    },
    
    // Search by ID
    {
      id: 'search-booking',
      type: 'booking',
      title: 'Search Booking by LR Number',
      subtitle: 'Find booking using LR number',
      icon: Hash,
      action: () => navigate('/dashboard/bookings?search=lr'),
      keywords: ['lr', 'number', 'id', 'find']
    },
    {
      id: 'search-customer',
      type: 'customer',
      title: 'Search Customer',
      subtitle: 'Find customer by name or phone',
      icon: Search,
      action: () => navigate('/dashboard/customers?search=true'),
      keywords: ['find', 'client', 'phone']
    },
    
    // Settings
    {
      id: 'settings-profile',
      type: 'settings',
      title: 'Profile Settings',
      subtitle: 'Manage your profile',
      icon: Users,
      action: () => navigate('/dashboard/settings/profile'),
      keywords: ['account', 'user', 'personal']
    },
    {
      id: 'settings-billing',
      type: 'settings',
      title: 'Billing Settings',
      subtitle: 'Manage billing preferences',
      icon: CreditCard,
      action: () => navigate('/dashboard/settings/billing'),
      keywords: ['payment', 'invoice', 'subscription']
    }
  ], [navigate]);

  // Filter results based on search query
  const searchResults = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return {
        recent: recentSearches.slice(0, 3),
        trending: allCommands.filter(cmd => cmd.trending).slice(0, 3),
        quick: allCommands.filter(cmd => cmd.badge === 'Quick').slice(0, 3)
      };
    }

    const query = debouncedSearchQuery.toLowerCase();
    const filtered = allCommands.filter(cmd => 
      cmd.title.toLowerCase().includes(query) ||
      cmd.subtitle?.toLowerCase().includes(query) ||
      cmd.keywords?.some(keyword => keyword.toLowerCase().includes(query))
    );

    // Group by type
    const grouped = filtered.reduce((acc, cmd) => {
      const type = cmd.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(cmd);
      return acc;
    }, {} as Record<string, SearchResult[]>);

    return grouped;
  }, [debouncedSearchQuery, allCommands, recentSearches]);

  // Calculate total results for keyboard navigation
  const totalResults = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return (searchResults.recent?.length || 0) + 
             (searchResults.trending?.length || 0) + 
             (searchResults.quick?.length || 0);
    }
    return Object.values(searchResults).reduce((sum, results) => sum + results.length, 0);
  }, [searchResults, debouncedSearchQuery]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % totalResults);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + totalResults) % totalResults);
          break;
        case 'Enter':
          e.preventDefault();
          handleSelectResult();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, totalResults, selectedIndex]);

  // Auto-focus search input
  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle result selection
  const handleSelectResult = () => {
    let currentIndex = 0;
    
    if (!debouncedSearchQuery.trim()) {
      // Handle empty search state
      const sections = ['recent', 'trending', 'quick'];
      for (const section of sections) {
        const results = searchResults[section];
        if (results && currentIndex + results.length > selectedIndex) {
          const result = results[selectedIndex - currentIndex];
          if (result) {
            saveToRecent(result);
            result.action();
            onClose();
            return;
          }
        }
        currentIndex += results?.length || 0;
      }
    } else {
      // Handle search results
      for (const [type, results] of Object.entries(searchResults)) {
        if (currentIndex + results.length > selectedIndex) {
          const result = results[selectedIndex - currentIndex];
          if (result) {
            saveToRecent(result);
            result.action();
            onClose();
            return;
          }
        }
        currentIndex += results.length;
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50"
          >
            <div className="mx-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                {/* Search Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for anything..."
                      className={cn(
                        "w-full h-12 pl-12 pr-12",
                        "bg-gray-50 dark:bg-gray-800",
                        "border-0 rounded-xl",
                        "text-gray-900 dark:text-gray-100",
                        "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500/30",
                        "text-base"
                      )}
                    />
                    <button
                      onClick={onClose}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                  
                  {/* Quick filters */}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Suggestions
                    </Badge>
                    <Badge variant="outline" className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Filter className="h-3 w-3 mr-1" />
                      Filters
                    </Badge>
                    <Badge variant="outline" className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Calendar className="h-3 w-3 mr-1" />
                      Date Range
                    </Badge>
                  </div>
                </div>

                {/* Search Results */}
                <div className="max-h-[400px] overflow-y-auto">
                  {!debouncedSearchQuery.trim() ? (
                    <>
                      {searchResults.recent?.length > 0 && (
                        <CommandSection
                          title="Recent"
                          icon={Clock}
                          results={searchResults.recent}
                          selectedIndex={selectedIndex}
                          onSelect={(result) => {
                            saveToRecent(result);
                            result.action();
                            onClose();
                          }}
                          startIndex={0}
                        />
                      )}
                      
                      {searchResults.trending?.length > 0 && (
                        <CommandSection
                          title="Trending"
                          icon={TrendingUp}
                          results={searchResults.trending}
                          selectedIndex={selectedIndex}
                          onSelect={(result) => {
                            saveToRecent(result);
                            result.action();
                            onClose();
                          }}
                          startIndex={searchResults.recent?.length || 0}
                        />
                      )}
                      
                      {searchResults.quick?.length > 0 && (
                        <CommandSection
                          title="Quick Actions"
                          icon={Zap}
                          results={searchResults.quick}
                          selectedIndex={selectedIndex}
                          onSelect={(result) => {
                            saveToRecent(result);
                            result.action();
                            onClose();
                          }}
                          startIndex={(searchResults.recent?.length || 0) + (searchResults.trending?.length || 0)}
                        />
                      )}
                    </>
                  ) : Object.keys(searchResults).length > 0 ? (
                    Object.entries(searchResults).map(([type, results], groupIndex) => {
                      const startIndex = Object.entries(searchResults)
                        .slice(0, groupIndex)
                        .reduce((sum, [_, r]) => sum + r.length, 0);
                        
                      return (
                        <CommandSection
                          key={type}
                          title={type.charAt(0).toUpperCase() + type.slice(1)}
                          results={results}
                          selectedIndex={selectedIndex}
                          onSelect={(result) => {
                            saveToRecent(result);
                            result.action();
                            onClose();
                          }}
                          startIndex={startIndex}
                        />
                      );
                    })
                  ) : (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                        <Search className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">
                        No results found for "{debouncedSearchQuery}"
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Try searching for something else
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">↑</kbd>
                      <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">↓</kbd>
                      Navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">↵</kbd>
                      Select
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">ESC</kbd>
                      Close
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI-powered search
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}