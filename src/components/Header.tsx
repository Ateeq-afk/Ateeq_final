import React, { useState } from 'react';
import { 
  Search, 
  HelpCircle, 
  Bell 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useNotifications } from '@/lib/notifications';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const { unreadCount } = useNotifications();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    // Implement search functionality
  };

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900">
          <span className="bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">DesiCargo</span>
        </h1>
        <p className="text-gray-600 mt-1">K2K Logistics Management System</p>
      </div>
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <form onSubmit={handleSearch} className="relative flex-1 md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search anything..."
            className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-xl h-10 w-10 border-gray-200 bg-white shadow-soft relative"
            >
              <Bell className="h-5 w-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 border-gray-200 bg-white shadow-soft">
              <HelpCircle className="h-5 w-5 text-gray-700" />
            </Button>
          </motion.div>
        </div>
      </div>
    </header>
  );
}