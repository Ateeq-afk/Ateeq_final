import api from './api';

export interface OperationalException {
  delayedShipments: {
    count: number;
    totalValue: number;
    details: Array<{
      id: string;
      lr_number: string;
      from_city: string;
      to_city: string;
      created_at: string;
      total_amount: number;
      sender_name: string;
    }>;
  };
  overdueVehicles: {
    count: number;
    details: Array<{
      id: string;
      vehicle_number: string;
      driver_name: string;
      departure_date: string;
      expected_return_date: string;
      vehicles: {
        registration_number: string;
        driver_name: string;
        current_location: string;
      };
    }>;
  };
  overduePayments: {
    count: number;
    totalValue: number;
    details: Array<{
      id: string;
      lr_number: string;
      sender_name: string;
      total_amount: number;
      created_at: string;
      payment_type: string;
    }>;
  };
  capacityConstraints: {
    count: number;
    details: Array<{
      id: string;
      registration_number: string;
      max_weight: number;
      utilization: number;
    }>;
  };
}

export interface FleetOperations {
  totalVehicles: number;
  activeVehicles: number;
  utilizationRate: number;
  availableCapacity: number;
}

export interface RoutePerformance {
  route: string;
  revenuePerKm: number;
  totalRevenue: number;
  totalDistance: number;
  trips: number;
  avgRevenuePerTrip: number;
}

export interface FinancialHealth {
  dailyPerformance: {
    todayRevenue: number;
    todayPaidRevenue: number;
    collectionRate: number;
  };
  outstandingReceivables: {
    current: number;      // 0-30 days
    aging30: number;      // 31-60 days
    aging60: number;      // 61-90 days
    aging90: number;      // 90+ days
  };
  totalOutstanding: number;
}

export interface CustomerInsights {
  atRiskHighValue: Array<{
    name: string;
    totalRevenue: number;
    bookingCount: number;
    lastBooking: string;
  }>;
  atRiskCount: number;
}

export interface OperationalDashboardData {
  exceptions: OperationalException;
  operations: {
    fleet: FleetOperations;
    routes: {
      topPerformingRoutes: RoutePerformance[];
      totalActiveRoutes: number;
    };
  };
  financial: FinancialHealth;
  customers: CustomerInsights;
}

export const operationalDashboardService = {
  async getOperationalData(branchId?: string): Promise<OperationalDashboardData> {
    const params = branchId ? { branch_id: branchId } : {};
    const response = await api.get('/api/dashboard/operational', { params });
    return response.data.data;
  },

  async getExceptions(branchId?: string): Promise<OperationalException> {
    const data = await this.getOperationalData(branchId);
    return data.exceptions;
  },

  async getCriticalAlerts(branchId?: string): Promise<Array<{
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    value?: string;
    actionable: boolean;
    priority: number;
  }>> {
    const data = await this.getOperationalData(branchId);
    const alerts = [];

    // Critical delayed shipments
    if (data.exceptions.delayedShipments.count > 0) {
      alerts.push({
        id: 'delayed-shipments',
        type: 'critical' as const,
        title: 'Delayed Shipments Alert',
        description: `${data.exceptions.delayedShipments.count} shipments delayed >72 hours`,
        value: `₹${(data.exceptions.delayedShipments.totalValue / 100000).toFixed(1)}L at risk`,
        actionable: true,
        priority: 1
      });
    }

    // Vehicle capacity constraints
    if (data.exceptions.capacityConstraints.count > 0) {
      alerts.push({
        id: 'capacity-constraints',
        type: 'warning' as const,
        title: 'High Vehicle Utilization',
        description: `${data.exceptions.capacityConstraints.count} vehicles at 95%+ capacity`,
        value: 'Expansion needed',
        actionable: true,
        priority: 2
      });
    }

    // Outstanding payments
    if (data.exceptions.overduePayments.count > 0) {
      alerts.push({
        id: 'overdue-payments',
        type: 'warning' as const,
        title: 'Payment Collection Required',
        description: `₹${(data.exceptions.overduePayments.totalValue / 100000).toFixed(1)}L overdue >30 days`,
        value: `${data.exceptions.overduePayments.count} customers`,
        actionable: true,
        priority: 3
      });
    }

    // Overdue vehicles
    if (data.exceptions.overdueVehicles.count > 0) {
      alerts.push({
        id: 'overdue-vehicles',
        type: 'warning' as const,
        title: 'Vehicles Overdue Return',
        description: `${data.exceptions.overdueVehicles.count} vehicles past expected return`,
        actionable: true,
        priority: 4
      });
    }

    // Low collection rate
    if (data.financial.dailyPerformance.collectionRate < 70) {
      alerts.push({
        id: 'low-collection',
        type: 'info' as const,
        title: 'Collection Rate Below Target',
        description: `Today's collection rate: ${data.financial.dailyPerformance.collectionRate.toFixed(1)}%`,
        value: 'Target: 80%+',
        actionable: true,
        priority: 5
      });
    }

    // At-risk customers
    if (data.customers.atRiskCount > 0) {
      alerts.push({
        id: 'at-risk-customers',
        type: 'info' as const,
        title: 'Customer Retention Risk',
        description: `${data.customers.atRiskCount} high-value customers inactive >15 days`,
        actionable: true,
        priority: 6
      });
    }

    return alerts.sort((a, b) => a.priority - b.priority);
  },

  async getFleetEfficiency(branchId?: string): Promise<{
    utilizationRate: number;
    availableCapacity: number;
    activeVehicles: number;
    totalVehicles: number;
    recommendation: string;
  }> {
    const data = await this.getOperationalData(branchId);
    const fleet = data.operations.fleet;
    
    let recommendation = '';
    if (fleet.utilizationRate > 90) {
      recommendation = 'Consider fleet expansion - high utilization risk';
    } else if (fleet.utilizationRate < 60) {
      recommendation = 'Optimize routes - underutilized capacity available';
    } else {
      recommendation = 'Fleet utilization within optimal range';
    }

    return {
      ...fleet,
      recommendation
    };
  },

  async getFinancialHealth(branchId?: string): Promise<FinancialHealth & {
    healthScore: number;
    recommendations: string[];
  }> {
    const data = await this.getOperationalData(branchId);
    const financial = data.financial;
    
    // Calculate health score (0-100)
    let healthScore = 100;
    
    // Penalize low collection rate
    if (financial.dailyPerformance.collectionRate < 80) {
      healthScore -= (80 - financial.dailyPerformance.collectionRate) * 0.5;
    }
    
    // Penalize high aging receivables
    const totalReceivables = Object.values(financial.outstandingReceivables).reduce((sum, val) => sum + val, 0);
    if (totalReceivables > 0) {
      const agingRatio = (financial.outstandingReceivables.aging60 + financial.outstandingReceivables.aging90) / totalReceivables;
      if (agingRatio > 0.2) {
        healthScore -= agingRatio * 30;
      }
    }
    
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    // Generate recommendations
    const recommendations = [];
    
    if (financial.dailyPerformance.collectionRate < 80) {
      recommendations.push('Improve collection processes - target 80%+ daily collection rate');
    }
    
    if (financial.outstandingReceivables.aging90 > 0) {
      recommendations.push(`Address ₹${(financial.outstandingReceivables.aging90 / 100000).toFixed(1)}L in 90+ day receivables`);
    }
    
    if (financial.outstandingReceivables.aging60 > financial.outstandingReceivables.current) {
      recommendations.push('Focus on 60-90 day collections before they become bad debt');
    }
    
    return {
      ...financial,
      healthScore: Math.round(healthScore),
      recommendations
    };
  },

  async getRouteOptimization(branchId?: string): Promise<{
    topRoutes: RoutePerformance[];
    opportunities: Array<{
      route: string;
      issue: string;
      recommendation: string;
      potential_savings: string;
    }>;
  }> {
    const data = await this.getOperationalData(branchId);
    const routes = data.operations.routes.topPerformingRoutes;
    
    // Identify optimization opportunities
    const opportunities = [];
    
    // Routes with low revenue per km
    const lowEfficiencyRoutes = routes.filter(r => r.revenuePerKm < 50);
    lowEfficiencyRoutes.forEach(route => {
      opportunities.push({
        route: route.route,
        issue: `Low revenue efficiency: ₹${route.revenuePerKm.toFixed(0)}/km`,
        recommendation: 'Consider consolidation or route optimization',
        potential_savings: '10-15% cost reduction'
      });
    });
    
    // Routes with high trip count but low revenue per trip
    const lowValueRoutes = routes.filter(r => r.trips > 10 && r.avgRevenuePerTrip < 5000);
    lowValueRoutes.forEach(route => {
      if (!opportunities.find(o => o.route === route.route)) {
        opportunities.push({
          route: route.route,
          issue: `High frequency, low value: ₹${route.avgRevenuePerTrip.toFixed(0)}/trip`,
          recommendation: 'Increase minimum shipment value or frequency',
          potential_savings: '20-25% revenue increase'
        });
      }
    });
    
    return {
      topRoutes: routes,
      opportunities: opportunities.slice(0, 5)
    };
  }
};