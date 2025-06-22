import * as React from "react"
import { Check, ChevronDown, Search, User } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"

export interface ComboboxOption {
  value: string
  label: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  required?: boolean
  details?: {
    name?: string
    mobile?: string
    gst?: string
    description?: string
    rate?: string
  }
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  "aria-label"?: string
  showDropdown?: boolean
  onSearchChange?: (query: string) => void
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Start typing to search...",
  searchPlaceholder = "Type to search...",
  emptyText = "No results found.",
  className,
  disabled = false,
  "aria-label": ariaLabel,
  showDropdown = true,
  onSearchChange,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Find selected option
  const selectedOption = options.find(opt => opt.value === value)

  // Filter options based on search query
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.details?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.details?.mobile?.includes(searchQuery) ||
    option.details?.gst?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.details?.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    onSearchChange?.(query)
  }

  return (
    <div className="relative w-full">
      <div
        className={cn(
          "relative w-full cursor-pointer rounded-lg border border-input bg-background text-sm ring-offset-background",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center gap-2 pr-8 pl-3 py-2">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <selectedOption.icon className="h-4 w-4 text-gray-500" />
              )}
              <div className="flex-1 overflow-hidden">
                <div className="font-medium truncate">{selectedOption.label}</div>
                {selectedOption.details && (
                  <div className="text-xs text-gray-500 truncate">
                    {selectedOption.details.mobile && `📱 ${selectedOption.details.mobile}`}
                    {selectedOption.details.gst && ` • GST: ${selectedOption.details.gst}`}
                    {selectedOption.details.description && ` • ${selectedOption.details.description}`}
                    {selectedOption.details.rate && ` • ${selectedOption.details.rate}`}
                  </div>
                )}
              </div>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200">
          <Command className="rounded-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <CommandInput 
                placeholder={searchPlaceholder}
                value={searchQuery}
                onValueChange={handleSearchChange}
                className="pl-9"
              />
            </div>

            <CommandEmpty className="p-4 text-sm text-gray-500">
              {emptyText}
            </CommandEmpty>

            <CommandGroup className="max-h-60 overflow-y-auto">
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                    setSearchQuery("")
                  }}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {option.icon && (
                      <option.icon className="h-5 w-5 text-gray-400 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {option.label}
                          {option.required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                        {value === option.value && (
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                        )}
                      </div>
                      {(option.description || option.details) && (
                        <div className="text-sm text-gray-500 truncate">
                          {option.details ? (
                            <>
                              {option.details.mobile && `📱 ${option.details.mobile}`}
                              {option.details.gst && ` • GST: ${option.details.gst}`}
                              {option.details.description && ` • ${option.details.description}`}
                              {option.details.rate && ` • ${option.details.rate}`}
                            </>
                          ) : (
                            option.description
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {open && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  )
}