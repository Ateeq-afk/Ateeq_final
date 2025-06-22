import React from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PrintButtonProps {
  onPrint?: () => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
}

export function PrintButton({ 
  onPrint, 
  className, 
  variant = 'outline',
  size = 'default',
  children 
}: PrintButtonProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      // Default print behavior
      const printStyles = document.createElement('style');
      printStyles.innerHTML = `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-hide {
            display: none !important;
          }
          @page {
            size: auto;
            margin: 20mm;
          }
        }
      `;
      document.head.appendChild(printStyles);
      
      window.print();
      
      // Clean up
      document.head.removeChild(printStyles);
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handlePrint}
      className={className}
    >
      <Printer className="h-4 w-4 mr-2" />
      {children || 'Print'}
    </Button>
  );
}