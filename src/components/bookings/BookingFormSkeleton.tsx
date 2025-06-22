import React from 'react';
import { motion } from 'framer-motion';
import { Package, Calendar, User, MapPin, Truck, ArrowRight } from 'lucide-react';

export default function BookingFormSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with shimmer effect */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <div className="h-8 w-48 skeleton rounded-lg mb-2 bg-white/80 animate-pulse"></div>
            <div className="h-5 w-64 skeleton rounded-lg bg-white/60 animate-pulse"></div>
          </div>
          <div className="h-10 w-10 skeleton rounded-full bg-white/70 animate-pulse"></div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          {/* Progress Steps */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 flex items-center">
                <div className="h-8 w-8 rounded-full bg-brand-100 animate-pulse"></div>
                <div className="flex-1 h-1 mx-2 bg-gray-200"></div>
              </div>
              <div className="flex-1 flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="flex-1 h-1 mx-2 bg-gray-200"></div>
              </div>
              <div className="flex-1 flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <div className="h-4 w-24 skeleton rounded-lg bg-gray-100 animate-pulse"></div>
              <div className="h-4 w-24 skeleton rounded-lg bg-gray-100 animate-pulse"></div>
              <div className="h-4 w-24 skeleton rounded-lg bg-gray-100 animate-pulse"></div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Form Fields */}
            <div className="space-y-8">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-brand-500" />
                    <div className="h-4 w-24 skeleton rounded-lg bg-gray-100 animate-pulse"></div>
                  </div>
                  <div className="h-10 w-full skeleton rounded-lg bg-gray-100 animate-pulse"></div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-brand-500" />
                    <div className="h-4 w-24 skeleton rounded-lg bg-gray-100 animate-pulse"></div>
                  </div>
                  <div className="h-10 w-full skeleton rounded-lg bg-gray-100 animate-pulse"></div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-brand-500" />
                    <div className="h-4 w-24 skeleton rounded-lg bg-gray-100 animate-pulse"></div>
                  </div>
                  <div className="h-10 w-full skeleton rounded-lg bg-gray-100 animate-pulse"></div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-brand-500" />
                    <div className="h-4 w-24 skeleton rounded-lg bg-gray-100 animate-pulse"></div>
                  </div>
                  <div className="h-10 w-full skeleton rounded-lg bg-gray-100 animate-pulse"></div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-brand-500" />
                  <div className="h-4 w-32 skeleton rounded-lg bg-gray-100 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="h-10 w-full skeleton rounded-lg bg-gray-100 animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-10 w-full skeleton rounded-lg bg-gray-100 animate-pulse"></div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-brand-500" />
                  <div className="h-4 w-40 skeleton rounded-lg bg-gray-100 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="h-10 w-full skeleton rounded-lg bg-gray-100 animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-10 w-full skeleton rounded-lg bg-gray-100 animate-pulse"></div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-gray-50 p-4 rounded-xl border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="h-5 w-32 skeleton rounded-lg bg-gray-200 animate-pulse"></div>
                  <div className="h-5 w-24 skeleton rounded-lg bg-gray-200 animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-28 skeleton rounded-lg bg-gray-200 animate-pulse"></div>
                    <div className="h-4 w-20 skeleton rounded-lg bg-gray-200 animate-pulse"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 skeleton rounded-lg bg-gray-200 animate-pulse"></div>
                    <div className="h-4 w-20 skeleton rounded-lg bg-gray-200 animate-pulse"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 skeleton rounded-lg bg-gray-200 animate-pulse"></div>
                    <div className="h-4 w-20 skeleton rounded-lg bg-gray-200 animate-pulse"></div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between"
          >
            <div className="h-10 w-24 skeleton rounded-lg bg-gray-200 animate-pulse"></div>
            <div className="h-10 w-24 skeleton rounded-lg bg-brand-100 animate-pulse"></div>
          </motion.div>
        </motion.div>
        
        {/* Loading indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            repeatType: "loop"
          }}
          className="mt-8 flex justify-center"
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="h-3 w-3 rounded-full bg-brand-400"></div>
              <div className="absolute inset-0 h-3 w-3 rounded-full bg-brand-400 animate-ping"></div>
            </div>
            <div className="relative delay-150">
              <div className="h-3 w-3 rounded-full bg-brand-500"></div>
              <div className="absolute inset-0 h-3 w-3 rounded-full bg-brand-500 animate-ping delay-150"></div>
            </div>
            <div className="relative delay-300">
              <div className="h-3 w-3 rounded-full bg-brand-600"></div>
              <div className="absolute inset-0 h-3 w-3 rounded-full bg-brand-600 animate-ping delay-300"></div>
            </div>
            <p className="text-sm font-medium text-brand-700 ml-2">Loading booking form...</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}