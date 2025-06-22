import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Customer } from '@/types';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUUID = (uuid: string | null): boolean => {
  if (!uuid) return false;
  return UUID_REGEX.test(uuid);
};

export function useCustomers(branchId: string | null = null) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // If branchId is provided but invalid, return empty array
      if (branchId && !isValidUUID(branchId)) {
        console.log('Invalid branch ID, returning empty array:', branchId);
        setCustomers([]);
        return;
      }

      console.log('Loading customers, branchId:', branchId);
      
      let query = supabase
        .from('customers')
        .select(`
          *,
          branch:branches(name, code)
        `)
        .order('name', { ascending: true });
      
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      // Transform the data to match our Customer type
      const transformedData = data?.map(customer => ({
        ...customer,
        branch_name: customer.branch?.name,
        branch_code: customer.branch?.code
      })) || [];
      
      setCustomers(transformedData);
      console.log('Customers loaded:', transformedData.length);
    } catch (err) {
      console.error('Failed to load customers:', err);
      setError(err instanceof Error ? err : new Error('Failed to load customers'));
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const createCustomer = async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (customerData.branch_id && !isValidUUID(customerData.branch_id)) {
        throw new Error('Invalid branch ID format');
      }

      console.log('Creating customer:', customerData);
      
      // Check if customer with same mobile and branch already exists
      if (customerData.branch_id && customerData.mobile) {
        const { data: existingCustomer, error: checkError } = await supabase
          .from('customers')
          .select('id')
          .eq('branch_id', customerData.branch_id)
          .eq('mobile', customerData.mobile)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
          throw checkError;
        }
        
        if (existingCustomer) {
          throw new Error('A customer with this mobile number already exists for this branch.');
        }
      }
      
      const { data, error: createError } = await supabase
        .from('customers')
        .insert(customerData)
        .select(`
          *,
          branch:branches(name, code)
        `)
        .single();
      
      if (createError) throw createError;
      
      // Transform the data to match our Customer type
      const transformedData = {
        ...data,
        branch_name: data.branch?.name,
        branch_code: data.branch?.code
      };
      
      setCustomers(prev => [transformedData, ...prev]);
      console.log('Customer created successfully:', transformedData);
      return transformedData;
    } catch (err) {
      console.error('Failed to create customer:', err);
      throw err instanceof Error ? err : new Error('Failed to create customer');
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      if (!isValidUUID(id)) {
        throw new Error('Invalid customer ID format');
      }

      if (updates.branch_id && !isValidUUID(updates.branch_id)) {
        throw new Error('Invalid branch ID format');
      }

      console.log(`Updating customer ${id}:`, updates);
      
      // Check if mobile number update would create a duplicate
      if (updates.branch_id && updates.mobile) {
        const { data: existingCustomer, error: checkError } = await supabase
          .from('customers')
          .select('id')
          .eq('branch_id', updates.branch_id)
          .eq('mobile', updates.mobile)
          .neq('id', id) // Exclude current customer
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
          throw checkError;
        }
        
        if (existingCustomer) {
          throw new Error('A customer with this mobile number already exists for this branch.');
        }
      }
      
      const { data, error: updateError } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          branch:branches(name, code)
        `)
        .single();
      
      if (updateError) throw updateError;
      
      // Transform the data to match our Customer type
      const transformedData = {
        ...data,
        branch_name: data.branch?.name,
        branch_code: data.branch?.code
      };
      
      setCustomers(prev => prev.map(customer => 
        customer.id === id ? transformedData : customer
      ));
      
      console.log('Customer updated successfully:', transformedData);
      return transformedData;
    } catch (err) {
      console.error('Failed to update customer:', err);
      throw err instanceof Error ? err : new Error('Failed to update customer');
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      if (!isValidUUID(id)) {
        throw new Error('Invalid customer ID format');
      }

      console.log(`Deleting customer ${id}`);
      
      // First check if customer has bookings
      const { count, error: countError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .or(`sender_id.eq.${id},receiver_id.eq.${id}`);
      
      if (countError) throw countError;
      
      if (count && count > 0) {
        throw new Error('Cannot delete customer with existing bookings');
      }
      
      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      setCustomers(prev => prev.filter(customer => customer.id !== id));
      console.log('Customer deleted successfully');
    } catch (err) {
      console.error('Failed to delete customer:', err);
      throw err instanceof Error ? err : new Error(
        err.message === 'Cannot delete customer with existing bookings' ||
        err.message === 'A customer with this mobile number already exists for this branch.'
          ? err.message
          : 'Failed to delete customer'
      );
    }
  };

  return {
    customers,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refresh: loadCustomers
  };
}