import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Booking } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

// Loosened UUID validation regex (matches any UUID version)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidUUID = (uuid: string | null): boolean => {
  if (!uuid) return false;
  return UUID_REGEX.test(uuid);
};

export function useBookings<T = Booking>(branchId: string | null = null) {
  const [bookings, setBookings] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { getCurrentUserBranch } = useAuth();
  const userBranch = getCurrentUserBranch();

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const validBranchId = branchId && isValidUUID(branchId);
      const validUserBranchId = userBranch?.id && isValidUUID(userBranch.id);

      if ((branchId && !validBranchId) || (!branchId && userBranch?.id && !validUserBranchId)) {
        console.error('Invalid branch ID detected', { branchId, userBranchId: userBranch?.id });
        throw new Error('Invalid branch ID format');
      }

      const effectiveBranchId = validBranchId ? branchId : validUserBranchId ? userBranch?.id : null;

      console.log('Loading bookings for branch ID:', effectiveBranchId);

      // First try a very basic query to see if we can get any data at all
      const { data: basicData, error: basicError } = await supabase
        .from('bookings')
        .select('id, lr_number, status, created_at')
        .limit(5);
        
      if (basicError) {
        console.error('Basic bookings query failed:', basicError);
        throw basicError;
      }
      
      console.log('Basic bookings query successful, sample:', basicData);

      // Now try a simple query without relationships
      let simpleQuery = supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (effectiveBranchId) {
        simpleQuery = simpleQuery.or(`from_branch.eq.${effectiveBranchId},to_branch.eq.${effectiveBranchId}`);
      }

      const { data: simpleData, error: simpleError } = await simpleQuery;
      
      if (simpleError) {
        console.error('Simple bookings query failed:', simpleError);
        throw simpleError;
      }
      
      console.log('Simple bookings query successful, count:', simpleData?.length);

      // Now try with relationships, but with a more careful approach
      try {
        let fullQuery = supabase
          .from('bookings')
          .select(`
            *,
            sender:customers!sender_id(id, name, mobile, email, type),
            receiver:customers!receiver_id(id, name, mobile, email, type),
            article:articles(id, name, description, base_rate),
            from_branch_details:branches!from_branch(id, name, city, state),
            to_branch_details:branches!to_branch(id, name, city, state)
          `)
          .order('created_at', { ascending: false });

        if (effectiveBranchId) {
          fullQuery = fullQuery.or(`from_branch.eq.${effectiveBranchId},to_branch.eq.${effectiveBranchId}`);
        }

        const { data: fullData, error: fullError } = await fullQuery;
        
        if (fullError) {
          console.error('Full bookings query failed:', fullError);
          // Fall back to simple data
          setBookings(simpleData as unknown as T[] || []);
        } else {
          console.log('Full bookings query successful, count:', fullData?.length);
          setBookings(fullData as unknown as T[] || []);
        }
      } catch (relationshipError) {
        console.error('Error with relationship query:', relationshipError);
        // Fall back to simple data
        setBookings(simpleData as unknown as T[] || []);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setError(err instanceof Error ? err : new Error('Failed to load bookings'));
      setBookings([] as unknown as T[]);
    } finally {
      setLoading(false);
    }
  }, [branchId, userBranch]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const createBooking = async (data: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'total_amount'>) => {
    try {
      console.log('Creating booking with data:', data);
      
      // Validate branch IDs
      if (data.branch_id && !isValidUUID(data.branch_id)) {
        throw new Error('Invalid branch ID format');
      }
      if (data.from_branch && !isValidUUID(data.from_branch)) {
        throw new Error('Invalid from_branch ID format');
      }
      if (data.to_branch && !isValidUUID(data.to_branch)) {
        throw new Error('Invalid to_branch ID format');
      }
      
      // Calculate total amount
      const totalAmount = (data.quantity * data.freight_per_qty) + 
                          (data.loading_charges || 0) + 
                          (data.unloading_charges || 0) +
                          (data.insurance_charge || 0) +
                          (data.packaging_charge || 0);
      
      // Clean up the data before sending to database
      const cleanedData = {
        ...data,
        branch_id: data.branch_id || userBranch?.id,
        total_amount: totalAmount,
        status: 'booked',
        loading_status: 'pending',
        unloading_status: 'pending',
        pod_status: 'pending',
        // Ensure date fields are properly handled
        expected_delivery_date: data.expected_delivery_date || null,
        invoice_date: data.invoice_date || null,
      };
      
      // Remove any undefined values or fields that don't exist in the database schema
      const finalData = Object.fromEntries(
        Object.entries(cleanedData).filter(([key, value]) => {
          // Remove undefined values and fields that might cause issues
          return value !== undefined && 
                 key !== 'trial_end' && 
                 key !== 'trial_start' && 
                 key !== 'cancel_at_period_end';
        })
      );
      
      console.log('Submitting cleaned booking data to Supabase:', finalData);
      
      // First try a simple insert with minimal fields
      const { data: basicBooking, error: basicError } = await supabase
        .from('bookings')
        .insert({
          branch_id: finalData.branch_id,
          lr_number: finalData.lr_number,
          lr_type: finalData.lr_type,
          from_branch: finalData.from_branch,
          to_branch: finalData.to_branch,
          sender_id: finalData.sender_id,
          receiver_id: finalData.receiver_id,
          article_id: finalData.article_id,
          uom: finalData.uom,
          quantity: finalData.quantity,
          freight_per_qty: finalData.freight_per_qty,
          total_amount: totalAmount,
          payment_type: finalData.payment_type,
          status: 'booked',
          loading_status: 'pending',
          unloading_status: 'pending',
          pod_status: 'pending'
        })
        .select('id')
        .single();
        
      if (basicError) {
        console.error('Basic booking insert error:', basicError);
        throw basicError;
      }
      
      console.log('Basic booking created with ID:', basicBooking.id);
      
      // Now update with all the fields
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update(finalData)
        .eq('id', basicBooking.id)
        .select()
        .single();
        
      if (updateError) {
        console.error('Error updating booking with full data:', updateError);
        // We'll continue since the basic booking was created successfully
      }
      
      // Fetch the complete booking with relationships
      const { data: completeBooking, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          sender:customers!sender_id(id, name, mobile, email, type),
          receiver:customers!receiver_id(id, name, mobile, email, type),
          article:articles(id, name, description, base_rate),
          from_branch_details:branches!from_branch(id, name, city, state),
          to_branch_details:branches!to_branch(id, name, city, state)
        `)
        .eq('id', basicBooking.id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching complete booking:', fetchError);
        // Fall back to the basic booking
        await loadBookings(); // Refresh the list
        return updatedBooking || basicBooking as unknown as T;
      }
      
      console.log('Booking created successfully:', completeBooking);
      
      // Add to local state
      setBookings(prev => [completeBooking, ...prev] as unknown as T[]);
      
      return completeBooking as unknown as T;
    } catch (err) {
      console.error('Failed to create booking:', err);
      throw err instanceof Error ? err : new Error('Failed to create booking');
    }
  };

  const updateBookingStatus = async (id: string, status: Booking['status'], additionalUpdates: Partial<Booking> = {}) => {
    try {
      if (!isValidUUID(id)) {
        throw new Error('Invalid booking ID format');
      }

      console.log(`Updating booking ${id} status to ${status}`);
      
      // Update booking in Supabase
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({
          ...additionalUpdates,
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating booking status:', updateError);
        throw updateError;
      }
      
      console.log('Basic booking update successful');
      
      // Fetch the complete updated booking with relationships
      const { data: completeBooking, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          sender:customers!sender_id(id, name, mobile, email, type),
          receiver:customers!receiver_id(id, name, mobile, email, type),
          article:articles(id, name, description, base_rate),
          from_branch_details:branches!from_branch(id, name, city, state),
          to_branch_details:branches!to_branch(id, name, city, state)
        `)
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching updated booking:', fetchError);
        // Update the local state with the basic updated booking
        setBookings(prev => 
          prev.map(booking => 
            (booking as any).id === id ? updatedBooking : booking
          ) as T[]
        );
        return updatedBooking;
      }
      
      // Update the local state
      setBookings(prev => 
        prev.map(booking => 
          (booking as any).id === id ? completeBooking : booking
        ) as T[]
      );
      
      console.log('Booking status updated successfully:', completeBooking);
      return completeBooking;
    } catch (err) {
      console.error('Failed to update booking status:', err);
      throw err instanceof Error ? err : new Error('Failed to update booking status');
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      if (!isValidUUID(id)) {
        throw new Error('Invalid booking ID format');
      }

      console.log(`Deleting booking ${id}`);
      
      // Delete booking from Supabase
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      // Update the local state
      setBookings(prev => prev.filter(booking => (booking as any).id !== id) as T[]);
      
      console.log('Booking deleted successfully');
    } catch (err) {
      console.error('Failed to delete booking:', err);
      throw err instanceof Error ? err : new Error('Failed to delete booking');
    }
  };

  return {
    bookings,
    loading,
    error,
    createBooking,
    updateBookingStatus,
    deleteBooking,
    refresh: loadBookings
  };
}