import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[];
  defaultSnapPoint?: number;
  className?: string;
}

export default function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [0.5, 0.9],
  defaultSnapPoint = 0,
  className
}: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [currentSnapPoint, setCurrentSnapPoint] = React.useState(defaultSnapPoint);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const windowHeight = window.innerHeight;
    const currentY = info.offset.y;
    const velocity = info.velocity.y;

    // Close if dragged down significantly
    if (currentY > windowHeight * 0.3 || velocity > 500) {
      onClose();
      return;
    }

    // Find closest snap point
    const currentHeight = windowHeight * snapPoints[currentSnapPoint];
    const draggedHeight = currentHeight - currentY;
    const normalizedHeight = draggedHeight / windowHeight;

    let closestSnapIndex = 0;
    let minDistance = Math.abs(snapPoints[0] - normalizedHeight);

    snapPoints.forEach((point, index) => {
      const distance = Math.abs(point - normalizedHeight);
      if (distance < minDistance) {
        minDistance = distance;
        closestSnapIndex = index;
      }
    });

    setCurrentSnapPoint(closestSnapIndex);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ 
              y: `${100 - (snapPoints[currentSnapPoint] * 100)}%`,
              transition: { type: 'spring', damping: 30, stiffness: 300 }
            }}
            exit={{ y: '100%' }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-white dark:bg-gray-900",
              "rounded-t-3xl shadow-2xl",
              "will-change-transform",
              className
            )}
            style={{
              height: `${snapPoints[Math.max(...Array(snapPoints.length).keys())] * 100}%`
            }}
          >
            {/* Drag Handle */}
            <div className="absolute top-0 left-0 right-0 flex justify-center py-3 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 pt-8 pb-4 border-b">
                <h2 className="text-lg font-semibold">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className={cn(
              "flex-1 overflow-y-auto overscroll-contain",
              title ? "p-6" : "pt-10 px-6 pb-6"
            )}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}