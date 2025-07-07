import api from './api';

// Types
export interface PnLStatement {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  revenue: {
    freight_revenue: number;
    loading_unloading_revenue: number;
    other_revenue: number;
    total_revenue: number;
    daily_average: number;
  };
  expenses: {
    direct_expenses: DirectExpenses | number;
    indirect_expenses: IndirectExpenses | number;
    administrative_expenses: AdministrativeExpenses | number;
    total_expenses: number;
  };
  profitability: {
    gross_profit: number;
    gross_margin: number;
    operating_profit: number;
    operating_margin: number;
    net_profit: number;
    net_margin: number;
  };
  comparison?: PnLStatement | null;
  key_ratios: {
    expense_ratio: number;
    direct_expense_ratio: number;
    admin_expense_ratio: number;
  };
}

export interface DirectExpenses {
  fuel: number;
  driver_salaries: number;
  vehicle_maintenance: number;
  toll_parking: number;
  loading_unloading: number;
  other_direct: number;
  total: number;
}

export interface IndirectExpenses {
  office_rent: number;
  utilities: number;
  insurance: number;
  professional_fees: number;
  marketing: number;
  other_indirect: number;
  total: number;
}

export interface AdministrativeExpenses {
  admin_salaries: number;
  office_supplies: number;
  communication: number;
  bank_charges: number;
  legal_compliance: number;
  other_admin: number;
  total: number;
}

export interface FinancialSummary {
  current_month: {
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
    cash_inflow: number;
  };
  previous_month: {
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
  };
  growth: {
    revenue_growth: number;
    expense_growth: number;
    profit_growth: number;
  };
  outstanding: {
    total_receivables: number;
    overdue_30_days: number;
    overdue_60_days: number;
    overdue_90_days: number;
  };
  ytd: {
    revenue: number;
    expenses: number;
    profit: number;
  };
}

export interface RouteProfitability {
  route: string;
  from_city: string;
  to_city: string;
  revenue: number;
  trip_count: number;
  direct_costs: number;
  gross_profit: number;
  margin: number;
  revenue_per_trip: number;
  cost_per_trip: number;
}

export interface CustomerProfitability {
  customer_id: string;
  customer_name: string;
  revenue: number;
  booking_count: number;
  avg_booking_value: number;
  payment_performance: string;
  credit_utilization: number;
}

// API Service
export const financialReportsService = {
  // P&L Statement
  async getPnLStatement(params: {
    branch_id?: string;
    start_date: string;
    end_date: string;
    comparison_period?: 'previous_period' | 'previous_year' | 'none';
    format?: 'summary' | 'detailed';
  }) {
    const response = await api.get('/api/financial-reports/pnl', { params });
    return response.data.data as PnLStatement;
  },

  // Financial Summary
  async getFinancialSummary(branch_id?: string) {
    const params = branch_id ? { branch_id } : {};
    const response = await api.get('/api/financial-reports/summary', { params });
    return response.data.data as FinancialSummary;
  },

  // Route Profitability
  async getRouteProfitability(params: {
    start_date: string;
    end_date: string;
    top_n?: number;
  }) {
    const response = await api.get('/api/financial-reports/route-profitability', { params });
    return response.data.data as RouteProfitability[];
  },

  // Customer Profitability
  async getCustomerProfitability(params: {
    start_date: string;
    end_date: string;
    top_n?: number;
  }) {
    const response = await api.get('/api/financial-reports/customer-profitability', { params });
    return response.data.data as CustomerProfitability[];
  },

  // Utility functions
  formatCurrency(amount: number): string {
    if (amount >= 10000000) { // 1 crore
      return `₹${(amount / 10000000).toFixed(2)}Cr`;
    } else if (amount >= 100000) { // 1 lakh
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  },

  getMarginColor(margin: number): string {
    if (margin >= 20) return 'text-green-600';
    if (margin >= 10) return 'text-blue-600';
    if (margin >= 5) return 'text-amber-600';
    return 'text-red-600';
  },

  getGrowthColor(growth: number): string {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  },

  getGrowthIcon(growth: number): 'up' | 'down' | 'neutral' {
    if (growth > 0) return 'up';
    if (growth < 0) return 'down';
    return 'neutral';
  },

  // Date helpers
  getCurrentMonthDates() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0]
    };
  },

  getPreviousMonthDates() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0]
    };
  },

  getQuarterDates(quarter?: number, year?: number) {
    const currentYear = year || new Date().getFullYear();
    const currentQuarter = quarter || Math.floor(new Date().getMonth() / 3) + 1;
    
    const startMonth = (currentQuarter - 1) * 3;
    const start = new Date(currentYear, startMonth, 1);
    const end = new Date(currentYear, startMonth + 3, 0);
    
    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0]
    };
  },

  getYearDates(year?: number) {
    const currentYear = year || new Date().getFullYear();
    return {
      start_date: `${currentYear}-01-01`,
      end_date: `${currentYear}-12-31`
    };
  },
};