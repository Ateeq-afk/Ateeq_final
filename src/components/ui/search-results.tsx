import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, User, FileText, Truck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'booking' | 'customer' | 'article' | 'vehicle';
  title: string;
  subtitle?: string;
  path: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  isSearching: boolean;
  onSelect?: () => void;
  className?: string;
}

const iconMap = {
  booking: Package,
  customer: User,
  article: FileText,
  vehicle: Truck,
};

export function SearchResults({ results, isSearching, onSelect, className }: SearchResultsProps) {
  const navigate = useNavigate();

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    if (onSelect) onSelect();
  };

  if (isSearching) {
    return (
      <div className={cn(
        "absolute top-full mt-2 w-full bg-card rounded-lg border border-border shadow-lg p-4",
        className
      )}>
        <div className="flex items-center justify-center gap-2 text-muted-foreground" role="status" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Searching...</span>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "absolute top-full mt-2 w-full bg-card rounded-lg border border-border shadow-lg overflow-hidden",
      className
    )}>
      <div className="max-h-80 overflow-y-auto">
        {results.map((result) => {
          const Icon = iconMap[result.type];
          return (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left"
            >
              <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{result.title}</div>
                {result.subtitle && (
                  <div className="text-sm text-muted-foreground truncate">
                    {result.subtitle}
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground capitalize">
                {result.type}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}