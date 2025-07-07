import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp } from "lucide-react"

// Table wrapper with horizontal scroll on mobile
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("border-b bg-muted/50", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("border-t bg-muted/50 font-medium", className)}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

// Mobile-friendly responsive table component
interface ResponsiveTableProps {
  children: React.ReactNode
  mobileColumns?: string[] // Columns to show on mobile
  className?: string
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({ 
  children, 
  mobileColumns = [], 
  className 
}) => {
  return (
    <>
      {/* Desktop Table */}
      <div className={cn("hidden md:block", className)}>
        <Table>{children}</Table>
      </div>
      
      {/* Mobile Cards */}
      <div className="block md:hidden space-y-4">
        {/* This would need to be implemented based on your specific table structure */}
        {/* For now, showing the desktop table with horizontal scroll */}
        <div className="overflow-x-auto -mx-4 px-4">
          <Table>{children}</Table>
        </div>
      </div>
    </>
  )
}

// Sortable Table Header Component
interface SortableHeaderProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sorted?: 'asc' | 'desc' | false
  onSort?: () => void
}

const SortableHeader = React.forwardRef<HTMLTableCellElement, SortableHeaderProps>(
  ({ className, sorted, onSort, children, ...props }, ref) => {
    return (
      <TableHead
        ref={ref}
        className={cn("cursor-pointer select-none", className)}
        onClick={onSort}
        {...props}
      >
        <div className="flex items-center gap-2">
          {children}
          <div className="flex flex-col">
            <ChevronUp 
              className={cn(
                "h-3 w-3 -mb-1",
                sorted === 'asc' ? "text-foreground" : "text-muted-foreground/30"
              )} 
            />
            <ChevronDown 
              className={cn(
                "h-3 w-3",
                sorted === 'desc' ? "text-foreground" : "text-muted-foreground/30"
              )} 
            />
          </div>
        </div>
      </TableHead>
    )
  }
)
SortableHeader.displayName = "SortableHeader"

// Data Table Card Component for Mobile
interface DataCardProps {
  data: Record<string, any>
  fields: Array<{
    key: string
    label: string
    render?: (value: any) => React.ReactNode
  }>
  actions?: React.ReactNode
  className?: string
}

const DataCard: React.FC<DataCardProps> = ({ data, fields, actions, className }) => {
  return (
    <div className={cn(
      "rounded-lg border bg-card p-4 space-y-3 shadow-sm",
      "hover:shadow-md transition-shadow duration-200",
      className
    )}>
      {fields.map((field) => (
        <div key={field.key} className="flex justify-between items-start gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {field.label}:
          </span>
          <span className="text-sm text-right">
            {field.render ? field.render(data[field.key]) : data[field.key]}
          </span>
        </div>
      ))}
      {actions && (
        <div className="pt-3 border-t flex justify-end gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}

// Empty State for Tables
interface TableEmptyStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  title = "No data found",
  description = "There are no items to display at this time.",
  action,
  icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-4 text-muted-foreground">{icon}</div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}

// Loading State for Tables
interface TableSkeletonProps {
  columns: number
  rows?: number
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ columns, rows = 5 }) => {
  return (
    <div className="w-full">
      {/* Desktop Skeleton */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, i) => (
                <TableHead key={i}>
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <div className="h-4 w-full max-w-[200px] bg-muted animate-pulse rounded" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Mobile Skeleton */}
      <div className="block md:hidden space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex justify-between">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  ResponsiveTable,
  SortableHeader,
  DataCard,
  TableEmptyState,
  TableSkeleton,
}