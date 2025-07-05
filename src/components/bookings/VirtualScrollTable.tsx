import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Booking } from '@/types';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface VirtualScrollTableProps {
  items: Booking[];
  itemHeight: number;
  containerHeight: number;
  renderRow: (item: Booking, index: number) => React.ReactNode;
  renderHeader: () => React.ReactNode;
  onLoadMore?: () => void;
}

export default function VirtualScrollTable({
  items,
  itemHeight,
  containerHeight,
  renderRow,
  renderHeader,
  onLoadMore,
}: VirtualScrollTableProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate visible range
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight)
  );
  const visibleItems = items.slice(startIndex, endIndex + 1);

  // Buffer for smooth scrolling
  const bufferSize = 5;
  const bufferedStartIndex = Math.max(0, startIndex - bufferSize);
  const bufferedEndIndex = Math.min(items.length - 1, endIndex + bufferSize);
  const bufferedItems = items.slice(bufferedStartIndex, bufferedEndIndex + 1);

  const totalHeight = items.length * itemHeight;
  const offsetY = bufferedStartIndex * itemHeight;

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      setIsScrolling(true);

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set scrolling to false after scroll ends
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);

      // Load more when near bottom
      if (onLoadMore) {
        const scrollPercentage =
          (newScrollTop + containerHeight) / totalHeight;
        if (scrollPercentage > 0.9) {
          onLoadMore();
        }
      }
    },
    [containerHeight, totalHeight, onLoadMore]
  );

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100">
        {renderHeader()}
      </div>

      {/* Scrollable Body */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="overflow-auto"
        style={{ height: containerHeight }}
      >
        {/* Total Height Container */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Rendered Items */}
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {bufferedItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: index * 0.01 }}
                style={{ height: itemHeight }}
                className={isScrolling ? 'pointer-events-none' : ''}
              >
                {renderRow(item, bufferedStartIndex + index)}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      {items.length > 20 && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 bg-gray-200 rounded-full"
             style={{ height: containerHeight - 100 }}>
          <motion.div
            className="w-full bg-brand-600 rounded-full"
            style={{
              height: `${(containerHeight / totalHeight) * 100}%`,
              y: `${(scrollTop / totalHeight) * 100}%`,
            }}
            animate={{
              opacity: isScrolling ? 1 : 0.3,
            }}
            transition={{ duration: 0.2 }}
          />
        </div>
      )}

      {/* Loading More Indicator */}
      {onLoadMore && scrollTop + containerHeight >= totalHeight - 100 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg border border-gray-200"
        >
          <div className="flex items-center gap-2">
            <LoadingSpinner size="sm" />
            <span className="text-sm font-medium text-gray-700">Loading more...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}