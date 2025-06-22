import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/hooks/useBookings';

export function useLoading(branchId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { showSuccess, showError } = useNotificationSystem();
  const { getCurrentUserBranch } = useAuth();
  const { updateBookingStatus } = useBookings();
  const userBranch = getCurrentUserBranch();

  // Get pending bookings that need to be loaded
  const getPendingBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const effectiveBranchId = branchId || userBranch?.id;
      
      if (!effectiveBranchId) {
        throw new Error('No branch ID available');
      }
      
      console.log('Getting pending bookings for loading, branchId:', effectiveBranchId);
      
      // Get bookings that are in 'booked' status and have loading_status 'pending'
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          sender:customers!sender_id(id, name, mobile, email, type),
          receiver:customers!receiver_id(id, name, mobile, email, type),
          article:articles(id, name, description, base_rate),
          from_branch_details:branches!from_branch(id, name, city, state),
          to_branch_details:branches!to_branch(id, name, city, state)
        `)
        .eq('from_branch', effectiveBranchId)
        .eq('status', 'booked')
        .eq('loading_status', 'pending')
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error('Error fetching pending bookings:', fetchError);
        throw fetchError;
      }
      
      console.log('Pending bookings for loading:', data?.length);
      return data || [];
    } catch (err) {
      console.error('Failed to get pending bookings for loading:', err);
      setError(err instanceof Error ? err : new Error('Failed to get pending bookings'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [branchId, userBranch]);

  // Get active OGPLs (outward gate passes)
  const getActiveOGPLs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const effectiveBranchId = branchId || userBranch?.id;
      
      if (!effectiveBranchId) {
        throw new Error('No branch ID available');
      }
      
      console.log('Getting active OGPLs, branchId:', effectiveBranchId);
      
      const { data, error: fetchError } = await supabase
        .from('ogpl')
        .select(`
          *,
          vehicle:vehicles(*),
          from_station:branches!from_station(*),
          to_station:branches!to_station(*),
          loading_records(
            id,
            booking_id,
            loaded_at,
            loaded_by
          )
        `)
        .eq('from_station', effectiveBranchId)
        .eq('status', 'created')
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error('Error fetching active OGPLs:', fetchError);
        throw fetchError;
      }
      
      console.log('Active OGPLs:', data?.length);
      return data || [];
    } catch (err) {
      console.error('Failed to get active OGPLs:', err);
      setError(err instanceof Error ? err : new Error('Failed to get active OGPLs'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [branchId, userBranch]);

  // Create a new OGPL
  const createOGPL = async (data: {
    vehicleId: string;
    fromBranchId: string;
    toBranchId: string;
    transitDate: string;
    driverName: string;
    driverMobile: string;
    remarks?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Creating OGPL:', data);
      
      // Generate OGPL number
      const ogplNumber = `OGPL-${Date.now().toString().slice(-8)}`;
      
      // Create the OGPL
      const { data: ogplData, error: ogplError } = await supabase
        .from('ogpl')
        .insert({
          ogpl_number: ogplNumber,
          vehicle_id: data.vehicleId,
          from_station: data.fromBranchId,
          to_station: data.toBranchId,
          transit_date: data.transitDate,
          primary_driver_name: data.driverName,
          primary_driver_mobile: data.driverMobile,
          remarks: data.remarks,
          status: 'created'
        })
        .select()
        .single();
      
      if (ogplError) {
        console.error('Error creating OGPL:', ogplError);
        throw ogplError;
      }
      
      console.log('OGPL created:', ogplData);
      return ogplData;
    } catch (err) {
      console.error('Failed to create OGPL:', err);
      setError(err instanceof Error ? err : new Error('Failed to create OGPL'));
      showError('OGPL Creation Failed', err instanceof Error ? err.message : 'Failed to create OGPL');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create a new loading session
  const createLoadingSession = async (data: {
    ogplId: string;
    vehicleId: string;
    fromBranchId: string;
    toBranchId: string;
    bookingIds: string[];
    notes?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Creating loading session:', data);
      
      // 1. Create the loading session
      const { data: sessionData, error: sessionError } = await supabase
        .from('loading_sessions')
        .insert({
          ogpl_id: data.ogplId,
          loaded_by: 'Admin User', // In a real app, this would be the current user
          vehicle_id: data.vehicleId,
          from_branch_id: data.fromBranchId,
          to_branch_id: data.toBranchId,
          notes: data.notes,
          total_items: data.bookingIds.length
        })
        .select()
        .single();
      
      if (sessionError) {
        console.error('Error creating loading session:', sessionError);
        throw sessionError;
      }
      
      console.log('Loading session created:', sessionData);
      
      // 2. Create loading records for each booking
      const loadingRecords = data.bookingIds.map(bookingId => ({
        ogpl_id: data.ogplId,
        booking_id: bookingId,
        loaded_by: 'Admin User' // In a real app, this would be the current user
      }));
      
      const { data: recordsData, error: recordsError } = await supabase
        .from('loading_records')
        .insert(loadingRecords)
        .select();
      
      if (recordsError) {
        console.error('Error creating loading records:', recordsError);
        throw recordsError;
      }
      
      console.log('Loading records created:', recordsData?.length);
      
      // 3. Update the status of each booking
      for (const bookingId of data.bookingIds) {
        await updateBookingStatus(
          bookingId, 
          'in_transit', 
          { 
            loading_status: 'loaded',
            loading_session_id: sessionData.id
          }
        );
      }
      
      // 4. Update the OGPL status to in_transit
      const { error: ogplError } = await supabase
        .from('ogpl')
        .update({ status: 'in_transit' })
        .eq('id', data.ogplId);
      
      if (ogplError) {
        console.error('Error updating OGPL status:', ogplError);
        throw ogplError;
      }
      
      showSuccess('Loading Complete', `${data.bookingIds.length} bookings have been loaded successfully`);
      return sessionData;
    } catch (err) {
      console.error('Failed to create loading session:', err);
      setError(err instanceof Error ? err : new Error('Failed to create loading session'));
      showError('Loading Failed', err instanceof Error ? err.message : 'Failed to create loading session');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get loading history
  const getLoadingHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const effectiveBranchId = branchId || userBranch?.id;
      
      if (!effectiveBranchId) {
        throw new Error('No branch ID available');
      }
      
      console.log('Getting loading history, branchId:', effectiveBranchId);
      
      const { data, error: fetchError } = await supabase
        .from('loading_sessions')
        .select(`
          *,
          ogpl:ogpl(*),
          vehicle:vehicles(*),
          from_branch:branches!from_branch_id(*),
          to_branch:branches!to_branch_id(*)
        `)
        .eq('from_branch_id', effectiveBranchId)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error('Error fetching loading history:', fetchError);
        throw fetchError;
      }
      
      console.log('Loading history:', data?.length);
      return data || [];
    } catch (err) {
      console.error('Failed to get loading history:', err);
      setError(err instanceof Error ? err : new Error('Failed to get loading history'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [branchId, userBranch]);

  return {
    loading,
    error,
    getPendingBookings,
    getActiveOGPLs,
    createOGPL,
    createLoadingSession,
    getLoadingHistory
  };
}