import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter,
  Calendar,
  MapPin,
  Users,
  Package,
  DollarSign,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface FilterOption {
  id: string;
  label: string;
  value: any;
  count?: number;
}

interface FilterGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  options: FilterOption[];
  type: 'select' | 'range' | 'date' | 'multi-select';
}

interface SmartFiltersProps {
  onFiltersChange: (filters: Record<string, any>) => void;
  context?: 'bookings' | 'customers' | 'vehicles' | 'financial';
}

// AI-suggested filter component
const AISuggestion = ({ suggestion, onApply }: { suggestion: any; onApply: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {suggestion.title}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            {suggestion.description}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onApply}
          className="h-7 text-xs"
        >
          Apply
        </Button>
      </div>
    </motion.div>
  );
};

// Filter pill component
const FilterPill = ({ 
  filter, 
  onRemove 
}: { 
  filter: { group: string; label: string; value: any }; 
  onRemove: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5",
        "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
        "rounded-full text-sm font-medium"
      )}
    >
      <span className="text-xs opacity-70">{filter.group}:</span>
      <span>{filter.label}</span>
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
};

export default function SmartFilters({ onFiltersChange, context = 'bookings' }: SmartFiltersProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Context-specific filter groups
  const getFilterGroups = (): FilterGroup[] => {
    switch (context) {
      case 'bookings':
        return [
          {
            id: 'status',
            label: 'Status',
            icon: CheckCircle2,
            type: 'multi-select',
            options: [
              { id: 'booked', label: 'Booked', value: 'booked', count: 45 },
              { id: 'in-transit', label: 'In Transit', value: 'in-transit', count: 32 },
              { id: 'delivered', label: 'Delivered', value: 'delivered', count: 128 },
              { id: 'cancelled', label: 'Cancelled', value: 'cancelled', count: 5 }
            ]
          },
          {
            id: 'date',
            label: 'Date Range',
            icon: Calendar,
            type: 'date',
            options: []
          },
          {
            id: 'branch',
            label: 'Branch',
            icon: MapPin,
            type: 'multi-select',
            options: [
              { id: 'mumbai', label: 'Mumbai', value: 'mumbai', count: 78 },
              { id: 'delhi', label: 'Delhi', value: 'delhi', count: 65 },
              { id: 'bangalore', label: 'Bangalore', value: 'bangalore', count: 54 }
            ]
          },
          {
            id: 'amount',
            label: 'Amount Range',
            icon: DollarSign,
            type: 'range',
            options: []
          }
        ];
      
      case 'financial':
        return [
          {
            id: 'type',
            label: 'Transaction Type',
            icon: TrendingUp,
            type: 'multi-select',
            options: [
              { id: 'income', label: 'Income', value: 'income', count: 234 },
              { id: 'expense', label: 'Expense', value: 'expense', count: 189 },
              { id: 'refund', label: 'Refund', value: 'refund', count: 12 }
            ]
          },
          {
            id: 'category',
            label: 'Category',
            icon: Package,
            type: 'multi-select',
            options: [
              { id: 'booking', label: 'Booking Revenue', value: 'booking', count: 156 },
              { id: 'operations', label: 'Operations', value: 'operations', count: 89 },
              { id: 'payroll', label: 'Payroll', value: 'payroll', count: 45 },
              { id: 'maintenance', label: 'Maintenance', value: 'maintenance', count: 34 }
            ]
          },
          {
            id: 'date',
            label: 'Date Range',
            icon: Calendar,
            type: 'date',
            options: []
          }
        ];
      
      default:
        return [];
    }
  };

  // AI suggestions based on context
  const getAISuggestions = () => {
    switch (context) {
      case 'bookings':
        return [
          {
            id: 1,
            title: 'High-value urgent bookings',
            description: 'Show bookings > ₹10,000 with urgent priority',
            filters: { amount: [10000, 100000], priority: 'urgent' }
          },
          {
            id: 2,
            title: 'Delayed shipments',
            description: 'Bookings past expected delivery date',
            filters: { status: 'in-transit', delayed: true }
          }
        ];
      
      case 'financial':
        return [
          {
            id: 1,
            title: 'Large transactions this week',
            description: 'Transactions > ₹50,000 in last 7 days',
            filters: { amount: [50000, 1000000], dateRange: '7d' }
          },
          {
            id: 2,
            title: 'Overdue payments',
            description: 'Pending payments older than 30 days',
            filters: { type: 'receivable', overdue: true }
          }
        ];
      
      default:
        return [];
    }
  };

  const filterGroups = getFilterGroups();
  const aiSuggestions = getAISuggestions();

  const handleFilterChange = (groupId: string, value: any) => {
    const newFilters = { ...activeFilters, [groupId]: value };
    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleRemoveFilter = (groupId: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[groupId];
    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearAll = () => {
    setActiveFilters({});
    onFiltersChange({});
  };

  const handleApplySuggestion = (suggestion: any) => {
    const newFilters = { ...activeFilters, ...suggestion.filters };
    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
    setShowSuggestions(false);
  };

  const getActiveFilterPills = () => {
    const pills: any[] = [];
    
    Object.entries(activeFilters).forEach(([groupId, value]) => {
      const group = filterGroups.find(g => g.id === groupId);
      if (!group) return;

      if (Array.isArray(value)) {
        value.forEach(v => {
          const option = group.options.find(o => o.value === v);
          if (option) {
            pills.push({
              groupId,
              group: group.label,
              label: option.label,
              value: v
            });
          }
        });
      } else if (group.type === 'date' && value) {
        pills.push({
          groupId,
          group: group.label,
          label: `${format(value.from, 'MMM d')} - ${format(value.to, 'MMM d')}`,
          value
        });
      } else if (group.type === 'range' && value) {
        pills.push({
          groupId,
          group: group.label,
          label: `₹${value[0].toLocaleString()} - ₹${value[1].toLocaleString()}`,
          value
        });
      }
    });

    return pills;
  };

  const activePills = getActiveFilterPills();

  return (
    <div className="space-y-4">
      {/* AI Suggestions */}
      {showSuggestions && aiSuggestions.length > 0 && (
        <AnimatePresence>
          <div className="space-y-2">
            {aiSuggestions.map((suggestion) => (
              <AISuggestion
                key={suggestion.id}
                suggestion={suggestion}
                onApply={() => handleApplySuggestion(suggestion)}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterGroups.map((group) => {
          const Icon = group.icon;
          const hasActiveFilter = activeFilters[group.id];

          return (
            <Popover key={group.id}>
              <PopoverTrigger asChild>
                <Button
                  variant={hasActiveFilter ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "h-9 gap-2",
                    hasActiveFilter && "bg-blue-500 hover:bg-blue-600"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {group.label}
                  {hasActiveFilter && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
                      {Array.isArray(activeFilters[group.id]) 
                        ? activeFilters[group.id].length 
                        : 1}
                    </Badge>
                  )}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80">
                {group.type === 'multi-select' && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm mb-3">{group.label}</h4>
                    {group.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={activeFilters[group.id]?.includes(option.value) || false}
                          onChange={(e) => {
                            const current = activeFilters[group.id] || [];
                            const newValue = e.target.checked
                              ? [...current, option.value]
                              : current.filter(v => v !== option.value);
                            handleFilterChange(group.id, newValue.length > 0 ? newValue : null);
                          }}
                          className="rounded"
                        />
                        <span className="flex-1 text-sm">{option.label}</span>
                        {option.count !== undefined && (
                          <Badge variant="secondary" className="text-xs">
                            {option.count}
                          </Badge>
                        )}
                      </label>
                    ))}
                  </div>
                )}
                
                {group.type === 'date' && (
                  <div>
                    <h4 className="font-medium text-sm mb-3">{group.label}</h4>
                    <CalendarComponent
                      mode="range"
                      selected={activeFilters[group.id]}
                      onSelect={(range) => handleFilterChange(group.id, range)}
                      className="rounded-md"
                    />
                  </div>
                )}
                
                {group.type === 'range' && (
                  <div>
                    <h4 className="font-medium text-sm mb-3">{group.label}</h4>
                    <div className="space-y-4">
                      <Slider
                        value={activeFilters[group.id] || [0, 100000]}
                        onValueChange={(value) => handleFilterChange(group.id, value)}
                        max={100000}
                        step={1000}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>₹{(activeFilters[group.id]?.[0] || 0).toLocaleString()}</span>
                        <span>₹{(activeFilters[group.id]?.[1] || 100000).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          );
        })}

        {activePills.length > 0 && (
          <>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-9 text-xs"
            >
              Clear all
            </Button>
          </>
        )}
      </div>

      {/* Active Filters */}
      {activePills.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
          <AnimatePresence>
            {activePills.map((pill, index) => (
              <FilterPill
                key={`${pill.groupId}-${index}`}
                filter={pill}
                onRemove={() => {
                  if (Array.isArray(activeFilters[pill.groupId])) {
                    const newValue = activeFilters[pill.groupId].filter(v => v !== pill.value);
                    handleFilterChange(pill.groupId, newValue.length > 0 ? newValue : null);
                  } else {
                    handleRemoveFilter(pill.groupId);
                  }
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}