import React from 'react';
import { motion } from 'framer-motion';

const shimmer = {
  initial: { backgroundPosition: '-200% 0' },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'linear',
    },
  },
};

export default function BookingListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-brand-50 to-brand-100 p-6 rounded-2xl shadow-sm"
      >
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <motion.div
              variants={shimmer}
              initial="initial"
              animate="animate"
              className="h-8 w-32 rounded-lg mb-2"
              style={{
                background: 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                backgroundSize: '200% 100%',
              }}
            />
            <motion.div
              variants={shimmer}
              initial="initial"
              animate="animate"
              className="h-5 w-24 rounded-lg"
              style={{
                background: 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                backgroundSize: '200% 100%',
              }}
            />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                variants={shimmer}
                initial="initial"
                animate="animate"
                className="h-10 w-24 rounded-lg"
                style={{
                  background: 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                  backgroundSize: '200% 100%',
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Filters Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              variants={shimmer}
              initial="initial"
              animate="animate"
              className="h-10 rounded-lg"
              style={{
                background: 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                backgroundSize: '200% 100%',
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Table Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
      >
        {/* Table Header */}
        <div className="bg-gradient-to-r from-brand-50 to-blue-50 p-4">
          <div className="grid grid-cols-10 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <motion.div
                key={i}
                variants={shimmer}
                initial="initial"
                animate="animate"
                className="h-4 rounded"
                style={{
                  background: 'linear-gradient(90deg, #dbeafe 0%, #e0f2fe 50%, #dbeafe 100%)',
                  backgroundSize: '200% 100%',
                }}
              />
            ))}
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
            <motion.div
              key={row}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + row * 0.05 }}
              className="p-4"
            >
              <div className="grid grid-cols-10 gap-4 items-center">
                {/* Checkbox */}
                <motion.div
                  variants={shimmer}
                  initial="initial"
                  animate="animate"
                  className="h-5 w-5 rounded"
                  style={{
                    background: 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                    backgroundSize: '200% 100%',
                  }}
                />
                
                {/* LR Number */}
                <motion.div
                  variants={shimmer}
                  initial="initial"
                  animate="animate"
                  className="h-5 w-20 rounded"
                  style={{
                    background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #3b82f6 100%)',
                    backgroundSize: '200% 100%',
                    opacity: 0.2,
                  }}
                />
                
                {/* Other columns */}
                {[1, 2, 3, 4, 5, 6].map((col) => (
                  <motion.div
                    key={col}
                    variants={shimmer}
                    initial="initial"
                    animate="animate"
                    className="h-5 w-full rounded"
                    style={{
                      background: 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                      backgroundSize: '200% 100%',
                    }}
                  />
                ))}
                
                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <motion.div
                    variants={shimmer}
                    initial="initial"
                    animate="animate"
                    className="h-8 w-8 rounded"
                    style={{
                      background: 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                      backgroundSize: '200% 100%',
                    }}
                  />
                  <motion.div
                    variants={shimmer}
                    initial="initial"
                    animate="animate"
                    className="h-8 w-8 rounded"
                    style={{
                      background: 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                      backgroundSize: '200% 100%',
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Loading Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="flex justify-center items-center py-4"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'loop',
            }}
            className="h-3 w-3 bg-brand-500 rounded-full"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'loop',
              delay: 0.2,
            }}
            className="h-3 w-3 bg-brand-600 rounded-full"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'loop',
              delay: 0.4,
            }}
            className="h-3 w-3 bg-brand-700 rounded-full"
          />
        </div>
      </motion.div>
    </div>
  );
}