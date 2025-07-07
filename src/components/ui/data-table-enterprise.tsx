import * as React from "react"
import { cn } from "@/lib/utils"
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronsUpDown, 
  Search,
  Filter,
  Download,
  Upload,
  Settings2,
  Eye,
  EyeOff,
  MoreHorizontal
} from "lucide-react"
import { Button } from "./button-enterprise"
import { Input } from "./input"
import { Checkbox } from "./checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu"

interface Column<T> {
  id: string
  header: string | React.ReactNode
  accessor: (row: T) => any
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  sticky?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  selectable?: boolean
  onSelectionChange?: (selectedRows: T[]) => void
  actions?: (row: T) => React.ReactNode
  bulkActions?: React.ReactNode
  emptyState?: React.ReactNode
  className?: string
  striped?: boolean
  compact?: boolean
  bordered?: boolean
  hoverable?: boolean
  stickyHeader?: boolean
  virtualScroll?: boolean
  onRowClick?: (row: T) => void
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  searchable = false,
  searchPlaceholder = "Search...",
  onSearch,
  selectable = false,
  onSelectionChange,
  actions,
  bulkActions,
  emptyState,
  className,
  striped = false,
  compact = false,
  bordered = true,
  hoverable = true,
  stickyHeader = false,
  virtualScroll = false,
  onRowClick,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set())
  const [visibleColumns, setVisibleColumns] = React.useState<Set<string>>(
    new Set(columns.map(col => col.id))
  )
  const [searchQuery, setSearchQuery] = React.useState('')

  // Handle sorting
  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnId)
      setSortDirection('asc')
    }
  }

  // Handle row selection
  const handleSelectAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(data.map(row => row.id)))
    }
  }

  const handleSelectRow = (rowId: string) => {
    const newSelection = new Set(selectedRows)
    if (newSelection.has(rowId)) {
      newSelection.delete(rowId)
    } else {
      newSelection.add(rowId)
    }
    setSelectedRows(newSelection)
  }

  React.useEffect(() => {
    if (onSelectionChange) {
      const selected = data.filter(row => selectedRows.has(row.id))
      onSelectionChange(selected)
    }
  }, [selectedRows, data, onSelectionChange])

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data

    const column = columns.find(col => col.id === sortColumn)
    if (!column) return data

    return [...data].sort((a, b) => {
      const aVal = column.accessor(a)
      const bVal = column.accessor(b)

      if (aVal === bVal) return 0
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
  }, [data, sortColumn, sortDirection, columns])

  // Filter by search
  const filteredData = React.useMemo(() => {
    if (!searchQuery) return sortedData

    return sortedData.filter(row => {
      return columns.some(column => {
        const value = column.accessor(row)
        return String(value).toLowerCase().includes(searchQuery.toLowerCase())
      })
    })
  }, [sortedData, searchQuery, columns])

  const getSortIcon = (columnId: string) => {
    if (sortColumn !== columnId) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 text-neutral-400" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="ml-2 h-4 w-4" />
      : <ChevronDown className="ml-2 h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="w-full space-y-3">
        <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Table Controls */}
      {(searchable || bulkActions) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  onSearch?.(e.target.value)
                }}
                className="pl-10"
              />
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {selectedRows.size > 0 && bulkActions}
            
            {/* Column visibility toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map(column => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={visibleColumns.has(column.id)}
                    onCheckedChange={(checked) => {
                      const newVisible = new Set(visibleColumns)
                      if (checked) {
                        newVisible.add(column.id)
                      } else {
                        newVisible.delete(column.id)
                      }
                      setVisibleColumns(newVisible)
                    }}
                  >
                    {typeof column.header === 'string' ? column.header : column.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="relative overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-sm">
          <thead className={cn(
            "bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800",
            stickyHeader && "sticky top-0 z-10"
          )}>
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <Checkbox
                    checked={selectedRows.size === data.length && data.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.filter(col => visibleColumns.has(col.id)).map(column => (
                <th
                  key={column.id}
                  className={cn(
                    "px-4 py-3 font-medium text-neutral-700 dark:text-neutral-300",
                    column.align === 'center' && "text-center",
                    column.align === 'right' && "text-right",
                    column.sortable && "cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors",
                    column.sticky && "sticky left-0 z-10 bg-neutral-50 dark:bg-neutral-900",
                    column.width
                  )}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className={cn(
                    "flex items-center",
                    column.align === 'center' && "justify-center",
                    column.align === 'right' && "justify-end"
                  )}>
                    {column.header}
                    {column.sortable && getSortIcon(column.id)}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="w-20 px-4 py-3 text-right font-medium text-neutral-700 dark:text-neutral-300">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.filter(col => visibleColumns.has(col.id)).length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                  className="px-4 py-16 text-center"
                >
                  {emptyState || (
                    <div className="text-neutral-500 dark:text-neutral-400">
                      No data available
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredData.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  className={cn(
                    "transition-colors",
                    hoverable && "hover:bg-neutral-50 dark:hover:bg-neutral-900/50",
                    striped && rowIndex % 2 === 1 && "bg-neutral-50/50 dark:bg-neutral-900/25",
                    onRowClick && "cursor-pointer",
                    selectedRows.has(row.id) && "bg-primary-50 dark:bg-primary-900/20"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="w-12 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedRows.has(row.id)}
                        onCheckedChange={() => handleSelectRow(row.id)}
                      />
                    </td>
                  )}
                  {columns.filter(col => visibleColumns.has(col.id)).map(column => (
                    <td
                      key={column.id}
                      className={cn(
                        "px-4",
                        compact ? "py-2" : "py-3",
                        column.align === 'center' && "text-center",
                        column.align === 'right' && "text-right",
                        column.sticky && "sticky left-0 z-10 bg-white dark:bg-neutral-950"
                      )}
                    >
                      {column.cell ? column.cell(row) : column.accessor(row)}
                    </td>
                  ))}
                  {actions && (
                    <td className="w-20 px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      {selectedRows.size > 0 && (
        <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
          <span>{selectedRows.size} of {data.length} row(s) selected</span>
        </div>
      )}
    </div>
  )
}