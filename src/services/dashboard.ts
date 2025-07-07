import api from './api';

export interface DashboardMetrics {
  // Core business metrics  
  totalBookings: number;
  activeBookings: number;
  deliveredBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  monthRevenue: number;
  todayRevenue: number;
  weekRevenue: number;
  averageBookingValue: number;
  monthlyGrowthRate: number;
  
  // Performance metrics
  deliverySuccessRate: number;
  onTimeDeliveryRate: number;
  
  // Time-based metrics
  todayBookings: number;
  weekBookings: number;
  monthBookings: number;
  
  // Customer metrics
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  topCustomers: Array<{
    id: string;
    name: string;
    totalBookings: number;
    totalRevenue: number;
  }>;
  
  // Vehicle & operational metrics
  totalVehicles: number;
  activeVehicles: number;
  vehiclesInTransit: number;
  vehicleUtilizationRate: number;
  
  // Route metrics
  popularRoutes: Array<{
    from: string;
    to: string;
    count: number;
    revenue: number;
  }>;
  
  // Additional metrics
  articlesInTransit: number;
  averageDeliveryTime: number;
  customerSatisfactionScore: number;
  outstandingPayments: number;
  profitMargin: number;
  warehouseCapacityUtilization: number;
  pendingOGPLs: number;
  averageBookingValue: number;
  deliverySuccessRate: number;
  
  // Time-based metrics
  todayBookings: number;
  weekBookings: number;
  monthBookings: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  
  // Customer metrics
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  topCustomers: Array<{
    id: string;
    name: string;
    totalBookings: number;
    totalRevenue: number;
  }>;
  
  // Vehicle metrics
  totalVehicles: number;
  activeVehicles: number;
  vehiclesInTransit: number;
  vehicleUtilizationRate: number;
  
  // Route metrics
  popularRoutes: Array<{
    from: string;
    to: string;
    count: number;
    revenue: number;
  }>;
  
  // Performance metrics
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
  customerSatisfactionScore: number;
  
  // Financial metrics
  outstandingPayments: number;
  monthlyGrowthRate: number;
  profitMargin: number;
  
  // Operational metrics
  warehouseCapacityUtilization: number;
  pendingOGPLs: number;
  articlesInTransit: number;
}

export interface TrendData {
  date: string;
  bookings: number;
  revenue: number;
  deliveries: number;
  articlesShipped: number;
}

export interface RevenueBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: string;
  metadata: Record<string, any>;
}

export const dashboardService = {
  async getMetrics(branchId?: string): Promise<{ success: boolean; data: DashboardMetrics }> {
    const params = branchId ? { branch_id: branchId } : {};
    const response = await api.get('/api/dashboard/metrics', { params });
    return response.data;
  },

  async getTrends(branchId?: string, days: number = 30): Promise<{ success: boolean; data: TrendData[] }> {
    const params = { 
      days: days.toString(),
      ...(branchId ? { branch_id: branchId } : {})
    };
    const response = await api.get('/api/dashboard/trends', { params });
    return response.data;
  },

  async getRevenueBreakdown(branchId?: string): Promise<{ success: boolean; data: RevenueBreakdown[] }> {
    const params = branchId ? { branch_id: branchId } : {};
    const response = await api.get('/api/dashboard/revenue-breakdown', { params });
    return response.data;
  },

  async getRecentActivities(branchId?: string, limit: number = 10): Promise<{ success: boolean; data: Activity[] }> {
    const params = { 
      limit: limit.toString(),
      ...(branchId ? { branch_id: branchId } : {})
    };
    const response = await api.get('/api/dashboard/recent-activities', { params });
    return response.data;
  }
};