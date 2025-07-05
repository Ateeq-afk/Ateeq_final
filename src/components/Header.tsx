import React, { useRef, useEffect } from 'react';
import { 
  Search, 
  HelpCircle, 
  Bell,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { useNotifications } from '@/lib/notifications';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '@/contexts/SearchContext';
import { SearchResults } from '@/components/ui/search-results';

export default function Header() {
  const { searchQuery, setSearchQuery, searchResults, isSearching } = useSearch();
  const { unreadCount } = useNotifications();
  const { user, logout } = useAuth();
  const { branch } = useCurrentBranch();
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

  // Show results when searching or when there are results
  useEffect(() => {
    setShowResults(searchQuery.length > 0 && (isSearching || searchResults.length > 0));
  }, [searchQuery, isSearching, searchResults]);

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl md:text-4xl font-heading font-black">
          <span className="text-gradient">DesiCargo</span>
        </h1>
        <p className="text-muted-foreground mt-1">Premium Logistics Management System</p>
      </motion.div>
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <motion.div 
          ref={searchRef}
          className="relative flex-1 md:w-80"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-brand-600 dark:group-focus-within:text-brand-400 transition-colors" />
            <Input
              type="text"
              placeholder="Search bookings, customers, articles..."
              aria-label="Search bookings, customers, articles"
              className="input-premium pl-10 pr-4 py-3 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowResults(true)}
            />
          </form>
          {showResults && (
            <SearchResults 
              results={searchResults} 
              isSearching={isSearching}
              onSelect={() => {
                setSearchQuery('');
                setShowResults(false);
              }}
            />
          )}
        </motion.div>
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {canSwitchBranch && userBranches.length > 1 && (
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <Select value={selectedBranch || ''} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-[200px] glass-subtle">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {userBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}
          
          <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              className="relative h-11 w-11 rounded-2xl glass-subtle hover:bg-accent group"
            >
              <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              {unreadCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-medium animate-pulse-glow"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Help"
              className="h-11 w-11 rounded-2xl glass-subtle hover:bg-accent group"
            >
              <HelpCircle className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05, y: -2 }}>
            <ThemeToggle />
          </motion.div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  variant="ghost" 
                  aria-label="User menu"
                  className="flex items-center gap-3 p-2 rounded-2xl hover:bg-accent group transition-all duration-200"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-border shadow-sm">
                      <AvatarImage src="/user-icon.png" alt="User" />
                      <AvatarFallback className="bg-gradient-to-br from-brand-500 to-brand-600 text-white font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></div>
                  </div>
                  <div className="text-sm text-left hidden md:block">
                    <div className="font-medium text-foreground group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {user?.name}
                    </div>
                    <div className="text-xs text-muted-foreground">{branch?.name}</div>
                  </div>
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-strong border border-border/50 shadow-lg">
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-accent group transition-colors" 
                onClick={() => navigate('/dashboard/settings')}
              >
                <span className="group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-red-500/10 text-red-600 dark:text-red-400 group transition-colors" 
                onClick={signOut}
              >
                <span className="group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </div>
    </header>
  );
}