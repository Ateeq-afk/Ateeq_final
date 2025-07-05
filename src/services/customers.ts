import { supabase } from '@/lib/supabaseClient';
import type { Customer, CustomerArticleRate } from '@/types';

export interface CustomerFilters {
  branchId?: string;
  type?: 'individual' | 'company';
  search?: string;
  creditLimitMin?: number;
  creditLimitMax?: number;
  paymentTerms?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'mobile' | 'created_at' | 'credit_limit';
  sortDirection?: 'asc' | 'desc';
}

export interface CustomerResponse {
  data: Customer[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CustomerStats {
  totalCustomers: number;
  individualCustomers: number;
  companyCustomers: number;
  totalCreditIssued: number;
  averageCreditLimit: number;
}

class CustomerService {
  async getCustomers(filters: CustomerFilters = {}): Promise<CustomerResponse> {
    try {
      const {
        branchId,
        type,
        search,
        creditLimitMin,
        creditLimitMax,
        paymentTerms,
        page = 1,
        pageSize = 10,
        sortBy = 'name',
        sortDirection = 'asc'
      } = filters;

      let query = supabase
        .from('customers')
        .select(`
          *,
          branches!inner(name, code)
        `, { count: 'exact' });

      // Apply filters
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      if (type) {
        query = query.eq('type', type);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,mobile.ilike.%${search}%,gst.ilike.%${search}%`);
      }

      if (creditLimitMin !== undefined) {
        query = query.gte('credit_limit', creditLimitMin);
      }

      if (creditLimitMax !== undefined) {
        query = query.lte('credit_limit', creditLimitMax);
      }

      if (paymentTerms) {
        query = query.eq('payment_terms', paymentTerms);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortDirection === 'asc' });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform the data to match our Customer type
      const transformedData = data?.map(customer => ({
        ...customer,
        branch_name: customer.branches?.name,
        branch_code: customer.branches?.code
      })) || [];

      return {
        data: transformedData,
        total: count || 0,
        page,
        pageSize
      };
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      throw error;
    }
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          branches!inner(name, code)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) return null;

      return {
        ...data,
        branch_name: data.branch?.name,
        branch_code: data.branch?.code
      };
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      throw error;
    }
  }

  async createCustomer(customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    try {
      // Check for duplicate mobile number in the same branch
      if (customerData.branch_id && customerData.mobile) {
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('branch_id', customerData.branch_id)
          .eq('mobile', customerData.mobile)
          .single();

        if (existing) {
          throw new Error('A customer with this mobile number already exists for this branch.');
        }
      }

      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select(`
          *,
          branches!inner(name, code)
        `)
        .single();

      if (error) throw error;

      return {
        ...data,
        branch_name: data.branch?.name,
        branch_code: data.branch?.code
      };
    } catch (error) {
      console.error('Failed to create customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    try {
      // Check for duplicate mobile number if updating
      if (updates.branch_id && updates.mobile) {
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('branch_id', updates.branch_id)
          .eq('mobile', updates.mobile)
          .neq('id', id)
          .single();

        if (existing) {
          throw new Error('A customer with this mobile number already exists for this branch.');
        }
      }

      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          branches!inner(name, code)
        `)
        .single();

      if (error) throw error;

      return {
        ...data,
        branch_name: data.branch?.name,
        branch_code: data.branch?.code
      };
    } catch (error) {
      console.error('Failed to update customer:', error);
      throw error;
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      // Check if customer has bookings
      const { count, error: countError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .or(`sender_id.eq.${id},receiver_id.eq.${id}`);

      if (countError) throw countError;

      if (count && count > 0) {
        throw new Error('Cannot delete customer with existing bookings');
      }

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete customer:', error);
      throw error;
    }
  }

  async bulkDeleteCustomers(ids: string[]): Promise<{ success: string[]; failed: Array<{ id: string; error: string }> }> {
    const results = {
      success: [] as string[],
      failed: [] as Array<{ id: string; error: string }>
    };

    for (const id of ids) {
      try {
        await this.deleteCustomer(id);
        results.success.push(id);
      } catch (error) {
        results.failed.push({
          id,
          error: error instanceof Error ? error.message : 'Failed to delete'
        });
      }
    }

    return results;
  }

  async getCustomerStats(branchId?: string): Promise<CustomerStats> {
    try {
      let query = supabase
        .from('customers')
        .select('type, credit_limit', { count: 'exact' });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, count, error } = await query;

      if (error) throw error;

      const stats = {
        totalCustomers: count || 0,
        individualCustomers: 0,
        companyCustomers: 0,
        totalCreditIssued: 0,
        averageCreditLimit: 0
      };

      if (data && data.length > 0) {
        data.forEach(customer => {
          if (customer.type === 'individual') {
            stats.individualCustomers++;
          } else {
            stats.companyCustomers++;
          }
          stats.totalCreditIssued += customer.credit_limit || 0;
        });

        stats.averageCreditLimit = stats.totalCreditIssued / stats.totalCustomers;
      }

      return stats;
    } catch (error) {
      console.error('Failed to fetch customer stats:', error);
      throw error;
    }
  }

  // Customer Article Rates
  async getCustomerRates(customerId: string): Promise<CustomerArticleRate[]> {
    try {
      const { data, error } = await supabase
        .from('customer_article_rates')
        .select(`
          *,
          article:articles(name, description, base_rate)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to fetch customer rates:', error);
      throw error;
    }
  }

  async upsertCustomerRate(customerId: string, articleId: string, rate: number): Promise<CustomerArticleRate> {
    try {
      const { data, error } = await supabase
        .from('customer_article_rates')
        .upsert({
          customer_id: customerId,
          article_id: articleId,
          rate
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to upsert customer rate:', error);
      throw error;
    }
  }

  async deleteCustomerRate(customerId: string, articleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('customer_article_rates')
        .delete()
        .eq('customer_id', customerId)
        .eq('article_id', articleId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete customer rate:', error);
      throw error;
    }
  }

  async bulkUpsertCustomerRates(customerId: string, rates: Array<{ articleId: string; rate: number }>): Promise<void> {
    try {
      const data = rates.map(({ articleId, rate }) => ({
        customer_id: customerId,
        article_id: articleId,
        rate
      }));

      const { error } = await supabase
        .from('customer_article_rates')
        .upsert(data);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to bulk upsert customer rates:', error);
      throw error;
    }
  }

  // Export customers
  async exportCustomers(filters: CustomerFilters = {}): Promise<Customer[]> {
    try {
      // Get all customers without pagination for export
      const allFilters = { ...filters, page: 1, pageSize: 10000 };
      const response = await this.getCustomers(allFilters);
      return response.data;
    } catch (error) {
      console.error('Failed to export customers:', error);
      throw error;
    }
  }

  // Import customers
  async importCustomers(customers: Array<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>): Promise<{
    success: number;
    failed: Array<{ index: number; error: string }>;
  }> {
    const results = {
      success: 0,
      failed: [] as Array<{ index: number; error: string }>
    };

    for (let i = 0; i < customers.length; i++) {
      try {
        await this.createCustomer(customers[i]);
        results.success++;
      } catch (error) {
        results.failed.push({
          index: i,
          error: error instanceof Error ? error.message : 'Failed to import'
        });
      }
    }

    return results;
  }
}

export const customerService = new CustomerService();