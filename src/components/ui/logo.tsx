import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'white' | 'black';
}

export const Logo: React.FC<LogoProps> = ({ className = '', variant = 'default' }) => {
  const colors = {
    default: {
      primary: '#1a1a1a',
      accent: '#007AFF',
      text: '#1a1a1a'
    },
    white: {
      primary: '#ffffff',
      accent: '#ffffff',
      text: '#ffffff'
    },
    black: {
      primary: '#000000',
      accent: '#000000',
      text: '#000000'
    }
  };

  const color = colors[variant];

  return (
    <svg
      className={className}
      viewBox="0 0 200 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Icon Part - Modern abstract cargo/package design */}
      <g>
        {/* Package base with perspective */}
        <path
          d="M8 16 L24 8 L40 16 L40 32 L24 40 L8 32 Z"
          fill={color.accent}
          opacity="0.9"
        />
        
        {/* Package top face */}
        <path
          d="M8 16 L24 8 L40 16 L24 24 Z"
          fill={color.accent}
          opacity="1"
        />
        
        {/* Motion lines suggesting speed/delivery */}
        <path
          d="M0 20 L6 20 M0 24 L4 24 M0 28 L6 28"
          stroke={color.accent}
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Package fold line */}
        <path
          d="M24 8 L24 24 M24 24 L8 16 M24 24 L40 16"
          stroke={color.primary}
          strokeWidth="1"
          opacity="0.3"
        />
      </g>

      {/* Text Part - Clean, modern typography */}
      <g>
        {/* DesiCargo text */}
        <text
          x="52"
          y="30"
          fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif"
          fontSize="24"
          fontWeight="600"
          fill={color.text}
          letterSpacing="-0.5"
        >
          DesiCargo
        </text>
      </g>
    </svg>
  );
};

export const LogoIcon: React.FC<{ className?: string; color?: string }> = ({ 
  className = '', 
  color = '#007AFF' 
}) => {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 16 L24 8 L40 16 L40 32 L24 40 L8 32 Z"
        fill={color}
        opacity="0.9"
      />
      <path
        d="M8 16 L24 8 L40 16 L24 24 Z"
        fill={color}
        opacity="1"
      />
      <path
        d="M0 20 L6 20 M0 24 L4 24 M0 28 L6 28"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M24 8 L24 24 M24 24 L8 16 M24 24 L40 16"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
    </svg>
  );
};