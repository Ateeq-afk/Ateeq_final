import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  Mic,
  X,
  Filter,
  ArrowLeft,
  Clock,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'booking' | 'customer' | 'vehicle' | 'route';
  relevance: number;
}

interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  showVoiceSearch?: boolean;
}

export default function MobileSearch({
  isOpen,
  onClose,
  onSearch,
  placeholder = "Search bookings, customers...",
  showVoiceSearch = true
}: MobileSearchProps) {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  
  const debouncedQuery = useDebounce(query, 300);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Search suggestions based on debounced query
  useEffect(() => {
    if (debouncedQuery.length > 1) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockResults: SearchResult[] = [
          {
            id: '1',
            title: `BK001234 - Mumbai to Delhi`,
            subtitle: 'Booking • In Transit',
            type: 'booking',
            relevance: 0.9
          },
          {
            id: '2',
            title: `Rajesh Kumar`,
            subtitle: 'Customer • +91 98765 43210',
            type: 'customer',
            relevance: 0.8
          },
          {
            id: '3',
            title: `MH-01-AB-1234`,
            subtitle: 'Vehicle • Available',
            type: 'vehicle',
            relevance: 0.7
          }
        ].filter(item => 
          item.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(debouncedQuery.toLowerCase())
        );
        
        setSuggestions(mockResults);
        setIsLoading(false);
      }, 500);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  }, [debouncedQuery]);

  const handleVoiceSearch = () => {
    if (recognitionRef.current && showVoiceSearch) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      // Add to recent searches
      const newRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('recentSearches', JSON.stringify(newRecent));
      
      onSearch(searchQuery);
      onClose();
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking': return '📦';
      case 'customer': return '👤';
      case 'vehicle': return '🚛';
      case 'route': return '🗺️';
      default: return '📄';
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-white dark:bg-gray-900"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <div className="flex-1 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder={placeholder}
              className={cn(
                "w-full h-12 pl-10 pr-20 rounded-xl",
                "bg-gray-100 dark:bg-gray-800",
                "border-0 text-base",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            />
            
            {/* Voice search and clear buttons */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              {showVoiceSearch && (
                <button
                  onClick={handleVoiceSearch}
                  disabled={isListening}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    isListening 
                      ? "bg-red-100 text-red-600 animate-pulse" 
                      : "hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  <Mic className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <span className="text-sm text-gray-500">Searching...</span>
            </div>
          </div>
        )}

        {/* Search suggestions */}
        {suggestions.length > 0 && !isLoading && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
              Results
            </h3>
            <div className="space-y-2">
              {suggestions.map((result) => (
                <motion.button
                  key={result.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handleSearch(result.title)}
                  className="w-full p-3 text-left rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getTypeIcon(result.type)}</span>
                    <div className="flex-1">
                      <p className="font-medium">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Recent searches */}
        {!query && recentSearches.length > 0 && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Recent
              </h3>
              <button
                onClick={clearRecentSearches}
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-2">
              {recentSearches.map((recent, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSearch(recent)}
                  className="w-full p-3 text-left rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3"
                >
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{recent}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Popular searches */}
        {!query && recentSearches.length === 0 && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
              Popular
            </h3>
            <div className="space-y-2">
              {['In Transit Bookings', 'Overdue Deliveries', 'High Value Shipments', 'Customer Payments'].map((popular, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSearch(popular)}
                  className="w-full p-3 text-left rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3"
                >
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span>{popular}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {query && suggestions.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No results found</p>
            <p className="text-sm text-gray-400">Try different keywords</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}