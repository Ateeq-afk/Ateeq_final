import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: string;
  type: 'booking' | 'customer' | 'article' | 'vehicle';
  title: string;
  subtitle?: string;
  path: string;
}

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  isSearching: boolean;
  performSearch: (query: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  
  const debouncedQuery = useDebounce(searchQuery, 300);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Perform parallel searches across different entities
      const token = localStorage.getItem('authToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const lowerQuery = query.toLowerCase();
      const results: SearchResult[] = [];

      // Search bookings
      try {
        const bookingsResponse = await fetch(`${apiUrl}/api/bookings?search=${encodeURIComponent(query)}`, { headers });
        if (bookingsResponse.ok) {
          const { data } = await bookingsResponse.json();
          if (data && Array.isArray(data)) {
            data.slice(0, 3).forEach((booking: any) => {
              results.push({
                id: booking.id,
                type: 'booking',
                title: booking.lr_number,
                subtitle: `${booking.from_location} to ${booking.to_location}`,
                path: `/dashboard/bookings/${booking.id}`
              });
            });
          }
        }
      } catch (error) {
        console.error('Error searching bookings:', error);
      }

      // Search customers
      try {
        const customersResponse = await fetch(`${apiUrl}/api/customers?search=${encodeURIComponent(query)}`, { headers });
        if (customersResponse.ok) {
          const { data } = await customersResponse.json();
          if (data && Array.isArray(data)) {
            data.slice(0, 3).forEach((customer: any) => {
              results.push({
                id: customer.id,
                type: 'customer',
                title: customer.name,
                subtitle: customer.phone || customer.email,
                path: `/dashboard/customers/${customer.id}`
              });
            });
          }
        }
      } catch (error) {
        console.error('Error searching customers:', error);
      }

      // Search articles
      try {
        const articlesResponse = await fetch(`${apiUrl}/api/articles?search=${encodeURIComponent(query)}`, { headers });
        if (articlesResponse.ok) {
          const { data } = await articlesResponse.json();
          if (data && Array.isArray(data)) {
            data.slice(0, 3).forEach((article: any) => {
              results.push({
                id: article.id,
                type: 'article',
                title: article.name,
                subtitle: article.description || 'No description',
                path: `/dashboard/articles/${article.id}`
              });
            });
          }
        }
      } catch (error) {
        console.error('Error searching articles:', error);
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  React.useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery, performSearch]);

  return (
    <SearchContext.Provider value={{
      searchQuery,
      setSearchQuery,
      searchResults,
      isSearching,
      performSearch
    }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}