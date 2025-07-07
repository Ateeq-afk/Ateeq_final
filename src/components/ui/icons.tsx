import React from 'react';

export function IndianRupee(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      <path d="m6 13 8.5 8" />
      <path d="M6 13h3" />
      <path d="M9 13c6.667 0 6.667-10 0-10" />
    </svg>
  );
}

// Custom Apple-style SVG icons for logistics features
export const LogisticsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M3 6L21 6M3 12L21 12M3 18L21 18M6 9L6 15M12 9L12 15M18 9L18 15" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="6" cy="6" r="2" fill="currentColor" />
    <circle cx="18" cy="18" r="2" fill="currentColor" />
  </svg>
);

export const FleetIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M2 16L20 16M2 16C2 17.1046 2.89543 18 4 18C5.10457 18 6 17.1046 6 16M2 16C2 14.8954 2.89543 14 4 14C5.10457 14 6 14.8954 6 16M20 16C20 17.1046 19.1046 18 18 18C16.8954 18 16 17.1046 16 16M20 16C20 14.8954 19.1046 14 18 14C16.8954 14 16 14.8954 16 16M6 16L16 16" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <path 
      d="M6 16V10C6 8.89543 6.89543 8 8 8L14 8C15.1046 8 16 8.89543 16 10V16" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M8 6L14 6" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <circle cx="4" cy="16" r="1" fill="currentColor" />
    <circle cx="18" cy="16" r="1" fill="currentColor" />
  </svg>
);

export const TrackingIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
    <path 
      d="M12 2V4M12 20V22M2 12H4M20 12H22" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <path 
      d="M18.364 5.636L16.95 7.05M7.05 16.95L5.636 18.364M18.364 18.364L16.95 16.95M7.05 7.05L5.636 5.636" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

export const AnalyticsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M3 17L9 11L13 15L21 7" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M17 7L21 7L21 11" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <rect x="3" y="18" width="2" height="3" fill="currentColor" rx="1" />
    <rect x="7" y="16" width="2" height="5" fill="currentColor" rx="1" />
    <rect x="11" y="14" width="2" height="7" fill="currentColor" rx="1" />
    <rect x="15" y="12" width="2" height="9" fill="currentColor" rx="1" />
    <rect x="19" y="10" width="2" height="11" fill="currentColor" rx="1" />
  </svg>
);

export const AutomationIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    <path 
      d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <circle cx="6" cy="6" r="2" fill="currentColor" opacity="0.6" />
    <circle cx="18" cy="6" r="2" fill="currentColor" opacity="0.6" />
    <circle cx="6" cy="18" r="2" fill="currentColor" opacity="0.6" />
    <circle cx="18" cy="18" r="2" fill="currentColor" opacity="0.6" />
  </svg>
);

export const IntegrationIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
    <rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
    <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
    <rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
    <path 
      d="M11 7H13M7 11V13M11 17H13M17 11V13" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <circle cx="7" cy="7" r="1" fill="currentColor" />
    <circle cx="17" cy="7" r="1" fill="currentColor" />
    <circle cx="7" cy="17" r="1" fill="currentColor" />
    <circle cx="17" cy="17" r="1" fill="currentColor" />
  </svg>
);

export const SecurityIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M9 12L11 14L15 10" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="12" cy="8" r="1" fill="currentColor" />
    <circle cx="8" cy="10" r="1" fill="currentColor" opacity="0.6" />
    <circle cx="16" cy="10" r="1" fill="currentColor" opacity="0.6" />
  </svg>
);

export const PricingIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path 
      d="M12 6V18M9 9H15M9 15H15" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <path 
      d="M15 9C15 7.89543 14.1046 7 13 7H11C9.89543 7 9 7.89543 9 9C9 10.1046 9.89543 11 11 11H13C14.1046 11 15 11.8954 15 13C15 14.1046 14.1046 15 13 15H11C9.89543 15 9 14.1046 9 13" 
      stroke="currentColor" 
      strokeWidth="2"
    />
  </svg>
);

export const SupportIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path 
      d="M16 16C16 16 14.5 18 12 18C9.5 18 8 16 8 16" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <circle cx="9" cy="9" r="1" fill="currentColor" />
    <circle cx="15" cy="9" r="1" fill="currentColor" />
    <path 
      d="M12 2C12 2 8 4 8 8M12 2C12 2 16 4 16 8" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

export const CloudIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M18 10H17.26C16.93 6.95 14.25 4.66 11.04 5.01C8.85 5.26 7.07 6.89 6.61 8.98C4.08 9.07 2 11.23 2 14C2 16.76 4.24 19 7 19H18C20.21 19 22 17.21 22 15C22 12.79 20.21 11 18 11V10Z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="12" cy="13" r="2" fill="currentColor" opacity="0.6" />
    <circle cx="8" cy="11" r="1" fill="currentColor" opacity="0.4" />
    <circle cx="16" cy="11" r="1" fill="currentColor" opacity="0.4" />
  </svg>
);

export const RocketIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M4.5 16.5C3 15 3 12.5 4.5 11L11 4.5C12.5 3 15 3 16.5 4.5L19.5 7.5C21 9 21 11.5 19.5 13L13 19.5C11.5 21 9 21 7.5 19.5L4.5 16.5Z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M9 15L15 9" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <circle cx="14.5" cy="9.5" r="1.5" fill="currentColor" />
    <path 
      d="M2 22L7 17M22 2L17 7" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

export const GrowthIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M22 12L18 8L13 13L8.5 8.5L2 15" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M16 8L22 8L22 14" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
    <circle cx="13" cy="13" r="1" fill="currentColor" />
    <circle cx="18" cy="8" r="1" fill="currentColor" />
    <path 
      d="M3 21L21 21" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

// Apple-style gradient wrapper component
export const IconWrapper = ({ 
  children, 
  gradient = 'blue',
  className = '',
  size = 'md'
}: { 
  children: React.ReactNode;
  gradient?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) => {
  const gradients = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-orange-500 to-red-500',
    red: 'from-red-500 to-pink-500',
    cyan: 'from-cyan-500 to-blue-500'
  };

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <div className={`
      ${sizes[size]} 
      rounded-2xl 
      bg-gradient-to-br ${gradients[gradient]} 
      p-3 
      text-white 
      shadow-lg 
      shadow-${gradient}-500/25
      hover:shadow-xl 
      hover:shadow-${gradient}-500/40
      hover:scale-105
      transition-all 
      duration-300 
      ease-out
      ${className}
    `}>
      {children}
    </div>
  );
};