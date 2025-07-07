import React, { useRef, useEffect, useState } from 'react';
import { 
  Search, 
  Bell,
  Building2,
  Command,
  Settings,
  LogOut,
  User,
  ChevronDown,
  X
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/lib/notifications';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '@/contexts/SearchContext';
import { SearchResults } from '@/components/ui/search-results';
// Temporarily disable real-time status
// import RealtimeStatus from '@/components/ui/RealtimeStatus';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({}: HeaderProps) {
  const { searchQuery, setSearchQuery, searchResults, isSearching } = useSearch();
  const { unreadCount } = useNotifications();
  const { user, logout } = useAuth();
  const { selectedBranch, setSelectedBranch, userBranches, canSwitchBranch } = useBranchSelection();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const [showResults, setShowResults] = React.useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for dynamic header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
    : '';

  const signOut = async () => {
    await logout();
    navigate('/signin');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled automatically by the SearchContext
  };

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle CMD+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Show results when searching or when there are results
  useEffect(() => {
    setShowResults(searchQuery.length > 0 && (isSearching || searchResults.length > 0));
  }, [searchQuery, isSearching, searchResults]);

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        "h-14 flex items-center justify-between px-4 md:px-6",
        "border-b transition-all duration-300",
        "sticky top-0 z-50",
        scrolled ? [
          "bg-white/95 dark:bg-black/95",
          "backdrop-blur-2xl backdrop-saturate-200",
          "border-gray-200/80 dark:border-gray-800/80",
          "shadow-sm"
        ] : [
          "bg-white/60 dark:bg-black/60",
          "backdrop-blur-xl backdrop-saturate-150",
          "border-gray-200/30 dark:border-gray-800/30"
        ]
      )}
    >
      {/* Logo */}
      <div className="flex items-center">
        <Logo className="h-7" />
      </div>
      {/* Search Bar */}
      <div className="flex-1 max-w-lg mx-4 md:mx-8">
        <motion.div 
          ref={searchRef}
          className="relative"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search"
              aria-label="Search"
              className={cn(
                "w-full pl-9 pr-10 h-9",
                "bg-gray-100/80 dark:bg-gray-900/80",
                "border border-gray-200/50 dark:border-gray-800/50",
                "rounded-lg",
                "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                "focus:bg-white dark:focus:bg-gray-900",
                "focus:border-blue-500/50 dark:focus:border-blue-400/50",
                "focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20",
                "transition-all duration-300 ease-out",
                "text-sm",
                "hover:bg-gray-100 dark:hover:bg-gray-800/80"
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowResults(true)}
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-9 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="h-3.5 w-3.5 text-gray-500" />
              </motion.button>
            )}
          </form>
          <AnimatePresence>
            {showResults && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SearchResults 
                  results={searchResults} 
                  isSearching={isSearching}
                  onSelect={() => {
                    setSearchQuery('');
                    setShowResults(false);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      {/* Right Section - Actions */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Branch Switcher */}
        {canSwitchBranch && userBranches.length > 1 && (
          <Select value={selectedBranch || ''} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[160px] h-8 bg-transparent border-0 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-0 text-sm rounded-lg transition-colors">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-gray-500" />
                <SelectValue placeholder="Select branch" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {userBranches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {/* Notifications */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            className="relative h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
          >
            <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shadow-sm"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </Button>
        </motion.div>

        {/* Real-time Status - temporarily disabled */}
        {/* <RealtimeStatus compact={true} /> */}

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center gap-2 h-9 px-2.5 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-lg transition-all duration-200"
              >
                <Avatar className="h-7 w-7 ring-2 ring-white/50 dark:ring-black/50">
                  <AvatarImage src="/user-icon.png" alt="User" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                  {user?.name?.split(' ')[0]}
                </span>
                <ChevronDown className="h-3 w-3 text-gray-400 transition-transform duration-200 group-data-[state=open]:rotate-180" strokeWidth={1.5} />
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-gray-800">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/user-icon.png" alt="User" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate">
                <p className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
            
            <DropdownMenuItem onClick={() => navigate('/dashboard/profile')} className="py-2.5 px-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <User className="mr-2.5 h-4 w-4 text-gray-500" strokeWidth={1.5} />
              <span className="text-sm">Profile</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="py-2.5 px-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <Settings className="mr-2.5 h-4 w-4 text-gray-500" strokeWidth={1.5} />
              <span className="text-sm">Settings</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-gray-800" />
            
            <DropdownMenuItem onClick={signOut} className="py-2.5 px-3 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400">
              <LogOut className="mr-2.5 h-4 w-4" strokeWidth={1.5} />
              <span className="text-sm font-medium">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}