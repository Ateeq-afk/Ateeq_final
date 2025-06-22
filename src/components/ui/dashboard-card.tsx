import React, { ReactNode } from "react";
import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "glass" | "gradient" | "elevated" | "bordered" | "soft";
  color?: "blue" | "green" | "amber" | "purple" | "indigo" | "rose" | "gray";
  withHover?: boolean;
  withAnimation?: boolean;
  animationDelay?: number;
  onClick?: () => void;
}

export const DashboardCard = React.forwardRef<HTMLDivElement, DashboardCardProps & MotionProps>(
  ({ 
    className, 
    children, 
    variant = "default", 
    color = "blue",
    withHover = true, 
    withAnimation = true,
    animationDelay = 0,
    onClick,
    ...props 
  }, ref) => {
    // Entrance animation
    const variants = {
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { 
          duration: 0.3, 
          ease: [0.22, 1, 0.36, 1],
          delay: animationDelay
        }
      }
    };

    // Hover animation
    const hoverAnimation = withHover ? {
      whileHover: { 
        y: -8, 
        scale: 1.02,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        transition: { 
          type: "spring", 
          stiffness: 400, 
          damping: 17 
        }
      },
      whileTap: { 
        scale: 0.98,
        transition: { 
          type: "spring", 
          stiffness: 400, 
          damping: 10 
        }
      }
    } : {};

    // Variant styles
    const variantStyles = {
      default: "bg-white border border-gray-200",
      glass: "bg-white/80 backdrop-blur-lg border border-white/20",
      gradient: getGradientStyle(color),
      elevated: "bg-white border border-gray-100",
      bordered: getBorderedStyle(color),
      soft: getSoftStyle(color)
    };

    // Shadow styles based on variant
    const shadowStyles = variant === "elevated" 
      ? "shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1),_0_10px_10px_-5px_rgba(0,0,0,0.04)]"
      : "shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1),_0_2px_8px_-3px_rgba(0,0,0,0.05)]";

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-xl p-6",
          shadowStyles,
          variantStyles[variant],
          "transition-all duration-300 ease-out",
          onClick && "cursor-pointer",
          className
        )}
        initial={withAnimation ? "hidden" : undefined}
        animate={withAnimation ? "visible" : undefined}
        variants={variants}
        onClick={onClick}
        {...hoverAnimation}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
DashboardCard.displayName = "DashboardCard";

// Helper function to get gradient style based on color
function getGradientStyle(color: string): string {
  switch (color) {
    case "blue":
      return "bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100";
    case "green":
      return "bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100";
    case "purple":
      return "bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100";
    case "amber":
      return "bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100";
    case "indigo":
      return "bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100";
    case "rose":
      return "bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100";
    case "gray":
      return "bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200";
    default:
      return "bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200";
  }
}

// Helper function to get bordered style based on color
function getBorderedStyle(color: string): string {
  switch (color) {
    case "blue":
      return "bg-white border-2 border-blue-200";
    case "green":
      return "bg-white border-2 border-green-200";
    case "purple":
      return "bg-white border-2 border-purple-200";
    case "amber":
      return "bg-white border-2 border-amber-200";
    case "indigo":
      return "bg-white border-2 border-indigo-200";
    case "rose":
      return "bg-white border-2 border-rose-200";
    case "gray":
      return "bg-white border-2 border-gray-200";
    default:
      return "bg-white border-2 border-gray-200";
  }
}

// Helper function to get soft style based on color
function getSoftStyle(color: string): string {
  switch (color) {
    case "blue":
      return "bg-blue-50/50 border border-blue-100";
    case "green":
      return "bg-green-50/50 border border-green-100";
    case "purple":
      return "bg-purple-50/50 border border-purple-100";
    case "amber":
      return "bg-amber-50/50 border border-amber-100";
    case "indigo":
      return "bg-indigo-50/50 border border-indigo-100";
    case "rose":
      return "bg-rose-50/50 border border-rose-100";
    case "gray":
      return "bg-gray-50/50 border border-gray-200";
    default:
      return "bg-gray-50/50 border border-gray-200";
  }
}

export interface DashboardCardIconProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  color?: "blue" | "green" | "amber" | "purple" | "indigo" | "rose" | "gray";
  size?: "sm" | "md" | "lg";
}

export const DashboardCardIcon = React.forwardRef<HTMLDivElement, DashboardCardIconProps>(
  ({ className, children, color = "blue", size = "md", ...props }, ref) => {
    const colorStyles = {
      blue: "bg-blue-50 text-blue-600",
      green: "bg-green-50 text-green-600",
      amber: "bg-amber-50 text-amber-600",
      purple: "bg-purple-50 text-purple-600",
      indigo: "bg-indigo-50 text-indigo-600",
      rose: "bg-rose-50 text-rose-600",
      gray: "bg-gray-100 text-gray-600"
    };

    const sizeStyles = {
      sm: "p-3 w-12 h-12",
      md: "p-4 w-16 h-16",
      lg: "p-5 w-20 h-20"
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-xl flex items-center justify-center mb-4",
          colorStyles[color],
          sizeStyles[size],
          className
        )}
        whileHover={{ 
          scale: 1.05,
          transition: { duration: 0.2 }
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
DashboardCardIcon.displayName = "DashboardCardIcon";

export interface DashboardCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export const DashboardCardTitle = React.forwardRef<HTMLHeadingElement, DashboardCardTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          "text-xl font-bold tracking-tight text-gray-900",
          className
        )}
        {...props}
      >
        {children}
      </h3>
    );
  }
);
DashboardCardTitle.displayName = "DashboardCardTitle";

export interface DashboardCardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export const DashboardCardDescription = React.forwardRef<HTMLParagraphElement, DashboardCardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm text-gray-500 mt-1", className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);
DashboardCardDescription.displayName = "DashboardCardDescription";

export interface DashboardCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const DashboardCardContent = React.forwardRef<HTMLDivElement, DashboardCardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mt-4", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DashboardCardContent.displayName = "DashboardCardContent";

export interface DashboardCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const DashboardCardFooter = React.forwardRef<HTMLDivElement, DashboardCardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mt-6 flex items-center", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DashboardCardFooter.displayName = "DashboardCardFooter";

export interface DashboardCardStatProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number;
  label: string;
  trend?: {
    value: string | number;
    positive: boolean;
  };
}

export const DashboardCardStat = React.forwardRef<HTMLDivElement, DashboardCardStatProps>(
  ({ className, value, label, trend, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("", className)}
        {...props}
      >
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        
        {trend && (
          <div className={`flex items-center gap-1 mt-1 text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.positive ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m7 17 10-10" />
                <path d="M7 7h10v10" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m7 7 10 10" />
                <path d="M17 7v10H7" />
              </svg>
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    );
  }
);
DashboardCardStat.displayName = "DashboardCardStat";