import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Package,
  DollarSign,
  ChevronRight,
  Check,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MobileInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ElementType;
  error?: string;
  required?: boolean;
}

export const MobileInput: React.FC<MobileInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon: Icon,
  error,
  required
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className={cn(
        "relative rounded-xl transition-all duration-200",
        isFocused ? "ring-2 ring-blue-500" : "",
        error ? "ring-2 ring-red-500" : ""
      )}>
        {Icon && (
          <Icon className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors",
            isFocused ? "text-blue-500" : "text-gray-400"
          )} />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            "w-full h-14 px-4 rounded-xl",
            "bg-gray-50 dark:bg-gray-800",
            "border border-gray-200 dark:border-gray-700",
            "text-base",
            "transition-all duration-200",
            "focus:outline-none focus:bg-white dark:focus:bg-gray-900",
            Icon && "pl-12"
          )}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <X className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
};

interface MobileSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  icon?: React.ElementType;
  required?: boolean;
}

export const MobileSelect: React.FC<MobileSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  icon: Icon,
  required
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-14 px-4 rounded-xl",
          "bg-gray-50 dark:bg-gray-800",
          "border border-gray-200 dark:border-gray-700",
          "flex items-center justify-between",
          "text-left text-base",
          "transition-all duration-200",
          "hover:bg-gray-100 dark:hover:bg-gray-750",
          Icon && "pl-12"
        )}
      >
        {Icon && (
          <Icon className="absolute left-4 h-5 w-5 text-gray-400" />
        )}
        <span className={cn(
          "flex-1",
          selectedOption ? "text-gray-900 dark:text-gray-100" : "text-gray-500"
        )}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronRight className={cn(
          "h-5 w-5 text-gray-400 transition-transform",
          isOpen && "rotate-90"
        )} />
      </button>

      {/* Options overlay */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-3 text-left",
                  "hover:bg-gray-50 dark:hover:bg-gray-750",
                  "transition-colors",
                  "flex items-center justify-between",
                  value === option.value && "bg-blue-50 dark:bg-blue-900/20"
                )}
              >
                <span className="text-base">{option.label}</span>
                {value === option.value && (
                  <Check className="h-5 w-5 text-blue-500" />
                )}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
};

interface MobileDatePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  required?: boolean;
}

export const MobileDatePicker: React.FC<MobileDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = "Select date",
  required
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-14 px-4 rounded-xl",
          "bg-gray-50 dark:bg-gray-800",
          "border border-gray-200 dark:border-gray-700",
          "flex items-center justify-between",
          "text-left text-base",
          "transition-all duration-200",
          "hover:bg-gray-100 dark:hover:bg-gray-750"
        )}
      >
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className={cn(
            value ? "text-gray-900 dark:text-gray-100" : "text-gray-500"
          )}>
            {value ? format(value, 'MMM d, yyyy') : placeholder}
          </span>
        </div>
        <ChevronRight className={cn(
          "h-5 w-5 text-gray-400 transition-transform",
          isOpen && "rotate-90"
        )} />
      </button>

      {/* Native date input for mobile */}
      <input
        type="date"
        value={value ? format(value, 'yyyy-MM-dd') : ''}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
        className="sr-only"
        id={`date-${label}`}
      />
    </div>
  );
};

interface MobileTextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}

export const MobileTextArea: React.FC<MobileTextAreaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  required
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className={cn(
        "relative rounded-xl transition-all duration-200",
        isFocused ? "ring-2 ring-blue-500" : ""
      )}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={rows}
          className={cn(
            "w-full px-4 py-3 rounded-xl",
            "bg-gray-50 dark:bg-gray-800",
            "border border-gray-200 dark:border-gray-700",
            "text-base",
            "transition-all duration-200",
            "focus:outline-none focus:bg-white dark:focus:bg-gray-900",
            "resize-none"
          )}
        />
      </div>
    </div>
  );
};

// Toggle switch for mobile
interface MobileToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export const MobileToggle: React.FC<MobileToggleProps> = ({
  label,
  checked,
  onChange,
  description
}) => {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "w-full p-4 rounded-xl",
        "bg-gray-50 dark:bg-gray-800",
        "flex items-center justify-between",
        "transition-all duration-200",
        "hover:bg-gray-100 dark:hover:bg-gray-750"
      )}
    >
      <div className="text-left">
        <p className="text-base font-medium">{label}</p>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className={cn(
        "relative w-12 h-7 rounded-full transition-colors",
        checked ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
      )}>
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm"
        />
      </div>
    </button>
  );
};