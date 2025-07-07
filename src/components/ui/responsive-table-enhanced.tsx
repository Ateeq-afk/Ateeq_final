import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2,
  ExternalLink,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { Card, CardContent } from './card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';
import { cn } from '@/lib/utils';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  mobile?: boolean; // Show on mobile
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
}

interface ResponsiveTableEnhancedProps {
  data: any[];
  columns: Column[];
  onRowClick?: (row: any) => void;
  onAction?: (action: string, row: any) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
}

export function ResponsiveTableEnhanced({
  data,
  columns,
  onRowClick,
  onAction,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
  sortField,
  sortDirection,
  onSort
}: ResponsiveTableEnhancedProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (rowId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (column: Column) => {
    if (!column.sortable || !onSort) return;
    
    const newDirection = sortField === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(column.key, newDirection);
  };

  const getSortIcon = (column: Column) => {
    if (!column.sortable) return null;
    
    if (sortField === column.key) {
      return sortDirection === 'asc' ? 
        <SortAsc className="h-4 w-4" /> : 
        <SortDesc className="h-4 w-4" />;
    }
    
    return <Filter className="h-4 w-4 opacity-40" />;
  };

  // Mobile columns (show only essential info)
  const mobileColumns = columns.filter(col => col.mobile !== false).slice(0, 3);
  const desktopColumns = columns;

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-gray-500">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {desktopColumns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                      column.sortable && "cursor-pointer hover:bg-gray-100",
                      column.className
                    )}
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {getSortIcon(column)}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((row, index) => (
                <motion.tr
                  key={row.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onRowClick?.(row)}
                >
                  {desktopColumns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-3", column.className)}>
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onAction?.('view', row)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAction?.('edit', row)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onAction?.('delete', row)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data.map((row, index) => {
          const rowId = row.id || index.toString();
          const isExpanded = expandedRows.has(rowId);
          
          return (
            <motion.div
              key={rowId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Compact View */}
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => onRowClick?.(row)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-1">
                        {mobileColumns.map((column, idx) => (
                          <div key={column.key} className={cn(
                            idx === 0 && "font-medium text-gray-900",
                            idx > 0 && "text-sm text-gray-600"
                          )}>
                            {column.render ? column.render(row[column.key], row) : row[column.key]}
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowExpansion(rowId);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onAction?.('view', row)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAction?.('edit', row)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAction?.('external', row)}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  {/* Expanded View */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-100 overflow-hidden"
                      >
                        <div className="p-4 space-y-3 bg-gray-50">
                          {desktopColumns
                            .filter(col => !mobileColumns.includes(col))
                            .map((column) => (
                              <div key={column.key} className="flex justify-between items-start">
                                <span className="text-sm font-medium text-gray-700 w-1/3">
                                  {column.label}:
                                </span>
                                <span className="text-sm text-gray-900 w-2/3 text-right">
                                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                                </span>
                              </div>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}