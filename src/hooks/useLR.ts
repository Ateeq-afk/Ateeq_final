import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Booking } from '@/types';

export function useLR(branchId: string | null = null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function generateLRNumber() {
    try {
      console.log('Generating LR number, branchId:', branchId);
      
      // Get the branch code
      let branchCode = 'DC'; // Default code for DesiCargo
      
      if (branchId) {
        const { data: branch, error: branchError } = await supabase
          .from('branches')
          .select('code')
          .eq('id', branchId)
          .single();
        
        if (!branchError && branch) {
          branchCode = branch.code.slice(0, 2).toUpperCase();
        }
      }
      
      // Get the current date
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2); // Last 2 digits of year
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      
      // Get the latest LR number for this branch and month
      const { data: latestLR, error: lrError } = await supabase
        .from('bookings')
        .select('lr_number')
        .ilike('lr_number', `${branchCode}${year}${month}-%`)
        .order('lr_number', { ascending: false })
        .limit(1);
      
      // Generate sequence number
      let sequence = 1;
      if (!lrError && latestLR && latestLR.length > 0) {
        const lastSequence = parseInt(latestLR[0].lr_number.split('-')[1]);
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1;
        }
      }
      
      const lrNumber = `${branchCode}${year}${month}-${sequence.toString().padStart(4, '0')}`;
      console.log('Generated LR number:', lrNumber);
      return lrNumber;
    } catch (err) {
      console.error('Failed to generate LR number:', err);
      throw err instanceof Error ? err : new Error('Failed to generate LR number');
    }
  }

  async function createLR(data: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'total_amount'>) {
    try {
      setLoading(true);
      setError(null);
      console.log('Creating LR with data:', data);

      // Generate LR number if not provided
      if (!data.lr_number) {
        data.lr_number = await generateLRNumber();
      }

      // Calculate total amount
      const totalAmount = (data.quantity * data.freight_per_qty) + 
                          (data.loading_charges || 0) + 
                          (data.unloading_charges || 0) +
                          (data.insurance_charge || 0) +
                          (data.packaging_charge || 0);

      // Create the booking
      const { data: newBooking, error: sbError } = await supabase
        .from('bookings')
        .insert({
          ...data,
          total_amount: totalAmount
        })
        .select(`
          *,
          sender:customers!sender_id(*),
          receiver:customers!receiver_id(*),
          article:articles(*),
          from_branch_details:branches!from_branch(*),
          to_branch_details:branches!to_branch(*)
        `)
        .single();

      if (sbError) throw sbError;
      
      console.log('LR created successfully:', newBooking);
      return newBooking;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create LR'));
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function updateLRStatus(id: string, status: Booking['status']) {
    try {
      setLoading(true);
      setError(null);
      console.log(`Updating LR ${id} status to ${status}`);

      const { data, error: sbError } = await supabase
        .from('bookings')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (sbError) throw sbError;
      
      console.log('LR status updated successfully:', data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update LR status'));
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function printLR(id: string) {
    try {
      setLoading(true);
      setError(null);
      console.log(`Printing LR ${id}`);

      const { data, error: sbError } = await supabase
        .from('bookings')
        .select(`
          *,
          sender:customers!sender_id(*),
          receiver:customers!receiver_id(*),
          article:articles(*),
          from_branch_details:branches!from_branch(*),
          to_branch_details:branches!to_branch(*)
        `)
        .eq('id', id)
        .single();

      if (sbError) throw sbError;
      
      console.log('LR data retrieved successfully for printing:', data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to print LR'));
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    createLR,
    updateLRStatus,
    printLR,
    generateLRNumber
  };
}