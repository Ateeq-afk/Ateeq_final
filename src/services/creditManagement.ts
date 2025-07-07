import { 
  CreditTransaction, 
  CustomerContract, 
  BillingCycle, 
  CustomerPortalAccess 
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${user.token}`,
  };
};

export const creditManagementService = {
  // Credit Transactions
  async getCreditTransactions(customerId?: string, params?: {
    startDate?: string;
    endDate?: string;
    transactionType?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (customerId) queryParams.append('customer_id', customerId);
    if (params?.startDate) queryParams.append('start_date', params.startDate);
    if (params?.endDate) queryParams.append('end_date', params.endDate);
    if (params?.transactionType) queryParams.append('transaction_type', params.transactionType);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response = await fetch(`${API_URL}/credit-transactions?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch credit transactions');
    }
    
    return response.json();
  },

  async createCreditTransaction(transaction: Omit<CreditTransaction, 'id' | 'created_at'>) {
    const response = await fetch(`${API_URL}/credit-transactions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(transaction),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create credit transaction');
    }
    
    return response.json();
  },

  // Credit Limit Management
  async updateCreditLimit(customerId: string, newLimit: number, reason?: string) {
    const response = await fetch(`${API_URL}/customers/${customerId}/credit-limit`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ new_limit: newLimit, reason }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update credit limit');
    }
    
    return response.json();
  },

  async getCreditLimitHistory(customerId: string) {
    const response = await fetch(`${API_URL}/customers/${customerId}/credit-limit-history`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch credit limit history');
    }
    
    return response.json();
  },

  // Customer Category Management
  async updateCustomerCategory(customerId: string, category: 'Regular' | 'Premium' | 'Corporate') {
    const response = await fetch(`${API_URL}/customers/${customerId}/category`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ category }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update customer category');
    }
    
    return response.json();
  },

  // Credit Status Management
  async updateCreditStatus(customerId: string, status: 'Active' | 'On Hold' | 'Blocked' | 'Suspended', reason?: string) {
    const response = await fetch(`${API_URL}/customers/${customerId}/credit-status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, reason }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update credit status');
    }
    
    return response.json();
  },

  // Customer Contracts
  async getCustomerContracts(customerId?: string) {
    const queryParams = customerId ? `?customer_id=${customerId}` : '';
    const response = await fetch(`${API_URL}/customer-contracts${queryParams}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch customer contracts');
    }
    
    return response.json();
  },

  async createCustomerContract(contract: Omit<CustomerContract, 'id' | 'created_at' | 'updated_at'>) {
    const response = await fetch(`${API_URL}/customer-contracts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(contract),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create customer contract');
    }
    
    return response.json();
  },

  async updateCustomerContract(contractId: string, updates: Partial<CustomerContract>) {
    const response = await fetch(`${API_URL}/customer-contracts/${contractId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update customer contract');
    }
    
    return response.json();
  },

  // Billing Cycles
  async getBillingCycles(customerId?: string, status?: string) {
    const queryParams = new URLSearchParams();
    if (customerId) queryParams.append('customer_id', customerId);
    if (status) queryParams.append('status', status);

    const response = await fetch(`${API_URL}/billing-cycles?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch billing cycles');
    }
    
    return response.json();
  },

  async createBillingCycle(cycle: Omit<BillingCycle, 'id' | 'created_at'>) {
    const response = await fetch(`${API_URL}/billing-cycles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cycle),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create billing cycle');
    }
    
    return response.json();
  },

  async generateInvoiceForCycle(cycleId: string) {
    const response = await fetch(`${API_URL}/billing-cycles/${cycleId}/generate-invoice`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate invoice for billing cycle');
    }
    
    return response.json();
  },

  // Customer Portal Access
  async getPortalAccess(customerId: string) {
    const response = await fetch(`${API_URL}/customers/${customerId}/portal-access`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch portal access');
    }
    
    return response.json();
  },

  async createPortalAccess(access: Omit<CustomerPortalAccess, 'id' | 'created_at' | 'updated_at' | 'login_count' | 'last_login'>) {
    const response = await fetch(`${API_URL}/customer-portal-access`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(access),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create portal access');
    }
    
    return response.json();
  },

  async updatePortalAccess(accessId: string, updates: Partial<CustomerPortalAccess>) {
    const response = await fetch(`${API_URL}/customer-portal-access/${accessId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update portal access');
    }
    
    return response.json();
  },

  async resetPortalPin(customerId: string) {
    const response = await fetch(`${API_URL}/customers/${customerId}/reset-portal-pin`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to reset portal PIN');
    }
    
    return response.json();
  },

  // Credit Alerts
  async getCreditAlerts(customerId?: string, unreadOnly?: boolean) {
    const queryParams = new URLSearchParams();
    if (customerId) queryParams.append('customer_id', customerId);
    if (unreadOnly) queryParams.append('unread_only', 'true');

    const response = await fetch(`${API_URL}/credit-alerts?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch credit alerts');
    }
    
    return response.json();
  },

  async markAlertAsRead(alertId: string) {
    const response = await fetch(`${API_URL}/credit-alerts/${alertId}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark alert as read');
    }
    
    return response.json();
  },

  async markAllAlertsAsRead(customerId?: string) {
    const queryParams = customerId ? `?customer_id=${customerId}` : '';
    const response = await fetch(`${API_URL}/credit-alerts/mark-all-read${queryParams}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark all alerts as read');
    }
    
    return response.json();
  },

  // Credit Summary and Analytics
  async getCustomerCreditSummary(customerId?: string) {
    const queryParams = customerId ? `?customer_id=${customerId}` : '';
    const response = await fetch(`${API_URL}/credit-summary${queryParams}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch credit summary');
    }
    
    return response.json();
  },

  async getCreditAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'category' | 'status' | 'branch';
  }) {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('start_date', params.startDate);
    if (params?.endDate) queryParams.append('end_date', params.endDate);
    if (params?.groupBy) queryParams.append('group_by', params.groupBy);

    const response = await fetch(`${API_URL}/credit-analytics?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch credit analytics');
    }
    
    return response.json();
  },

  // Automated Billing
  async runAutomatedBilling() {
    const response = await fetch(`${API_URL}/automated-billing/run`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to run automated billing');
    }
    
    return response.json();
  },

  async getAutomatedBillingSchedule() {
    const response = await fetch(`${API_URL}/automated-billing/schedule`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch automated billing schedule');
    }
    
    return response.json();
  },

  async updateAutomatedBillingSchedule(schedule: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time?: string;
  }) {
    const response = await fetch(`${API_URL}/automated-billing/schedule`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(schedule),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update automated billing schedule');
    }
    
    return response.json();
  },

  // SLA Management
  async checkSLACompliance(customerId: string, dateRange?: { startDate: string; endDate: string }) {
    const queryParams = new URLSearchParams();
    if (dateRange?.startDate) queryParams.append('start_date', dateRange.startDate);
    if (dateRange?.endDate) queryParams.append('end_date', dateRange.endDate);

    const response = await fetch(`${API_URL}/customers/${customerId}/sla-compliance?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to check SLA compliance');
    }
    
    return response.json();
  },

  // Bulk Operations
  async bulkUpdateCreditLimits(updates: Array<{ customerId: string; newLimit: number; reason?: string }>) {
    const response = await fetch(`${API_URL}/credit-limits/bulk-update`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ updates }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to bulk update credit limits');
    }
    
    return response.json();
  },

  async bulkUpdateCategories(updates: Array<{ customerId: string; category: 'Regular' | 'Premium' | 'Corporate' }>) {
    const response = await fetch(`${API_URL}/customer-categories/bulk-update`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ updates }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to bulk update customer categories');
    }
    
    return response.json();
  },
};