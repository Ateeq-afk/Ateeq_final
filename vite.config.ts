import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'framer-motion'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'query-vendor': ['@tanstack/react-query'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'chart-vendor': ['recharts', 'echarts', 'echarts-for-react'],
          
          // Feature chunks
          'booking-features': [
            'src/components/bookings/BookingListEnhanced.tsx',
            'src/components/bookings/BookingDetails.tsx',
            'src/components/bookings/NewBookingForm.tsx',
            'src/components/bookings/LazyBook.tsx'
          ],
          'article-features': [
            'src/components/articles/ArticleList.tsx',
            'src/components/articles/ArticleForm.tsx'
          ],
          'customer-features': [
            'src/components/customers/CustomerList.tsx',
            'src/components/customers/CustomerForm.tsx'
          ],
          'warehouse-features': [
            'src/pages/WarehouseManagementPage.tsx',
            'src/components/UnloadingPage.tsx',
            'src/pages/LoadingManagementPage.tsx'
          ],
          'reports-features': [
            'src/pages/ReportsPage.tsx',
            'src/components/revenue/RevenuePage.tsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB
  },
})