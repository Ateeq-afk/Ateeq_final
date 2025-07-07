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
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "h-16 flex items-center justify-between px-6",
        "border-b border-border/50",
        "bg-background/50 backdrop-blur-sm"
      )}
    >
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <motion.div 
          ref={searchRef}
          className="relative"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search anything..."
              aria-label="Search"
              className={cn(
                "w-full pl-10 pr-10 h-9",
                "bg-accent/30 border-transparent",
                "focus:bg-background focus:border-border",
                "placeholder:text-muted-foreground/70",
                "transition-all duration-200"
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowResults(true)}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted/50 rounded border border-border/50">
              <Command className="h-3 w-3" />K
            </kbd>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-10 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded transition-colors"
              >
                <X className="h-3 w-3" />
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
      <div className="flex items-center gap-3">
        {/* Branch Switcher */}
        {canSwitchBranch && userBranches.length > 1 && (
          <Select value={selectedBranch || ''} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[160px] h-9 bg-transparent border-0 hover:bg-accent/50 focus:ring-0">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
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
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          className="relative h-9 w-9 hover:bg-accent/50"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center gap-2 h-9 px-2 hover:bg-accent/50"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src="/user-icon.png" alt="User" />
                <AvatarFallback className="bg-brand-500 text-white text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium max-w-[100px] truncate">
                {user?.name?.split(' ')[0]}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-3 p-2 border-b">
              <Avatar className="h-9 w-9">
                <AvatarImage src="/user-icon.png" alt="User" />
                <AvatarFallback className="bg-brand-500 text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            
            <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={signOut} className="text-red-600 dark:text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}