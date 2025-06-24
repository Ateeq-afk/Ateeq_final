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
        console.warn('No branch ID available for loading pending bookings');
        return [];
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
        const errorMessage = `Failed to fetch pending bookings: ${fetchError.message} (Code: ${fetchError.code})`;
        throw new Error(errorMessage);
      }
      
      console.log('Pending bookings for loading:', data?.length);
      return data || [];
    } catch (err) {
      console.error('Failed to get pending bookings for loading:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get pending bookings';
      setError(new Error(errorMessage));
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
        console.warn('No branch ID available for loading active OGPLs');
        return [];
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
        const errorMessage = `Failed to fetch active OGPLs: ${fetchError.message} (Code: ${fetchError.code})`;
        throw new Error(errorMessage);
      }
      
      console.log('Active OGPLs:', data?.length);
      return data || [];
    } catch (err) {
      console.error('Failed to get active OGPLs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get active OGPLs';
      setError(new Error(errorMessage));
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
        const errorMessage = `Failed to create OGPL: ${ogplError.message} (Code: ${ogplError.code})`;
        throw new Error(errorMessage);
      }
      
      console.log('OGPL created:', ogplData);
      return ogplData;
    } catch (err) {
      console.error('Failed to create OGPL:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create OGPL';
      setError(new Error(errorMessage));
      showError('OGPL Creation Failed', errorMessage);
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
        const errorMessage = `Failed to create loading session: ${sessionError.message} (Code: ${sessionError.code})`;
        throw new Error(errorMessage);
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
        const errorMessage = `Failed to create loading records: ${recordsError.message} (Code: ${recordsError.code})`;
        throw new Error(errorMessage);
      }
      
      console.log('Loading records created:', recordsData?.length);
      
      // 3. Update the status of each booking
      for (const bookingId of data.bookingIds) {
        try {
          await updateBookingStatus(
            bookingId, 
            'in_transit', 
            { 
              loading_status: 'loaded',
              loading_session_id: sessionData.id
            }
          );
        } catch (bookingError) {
          console.error(`Failed to update booking ${bookingId}:`, bookingError);
          const errorMessage = bookingError instanceof Error ? bookingError.message : 'Unknown error';
          throw new Error(`Failed to update booking ${bookingId}: ${errorMessage}`);
        }
      }
      
      // 4. Update the OGPL status to in_transit
      const { error: ogplError } = await supabase
        .from('ogpl')
        .update({ status: 'in_transit' })
        .eq('id', data.ogplId);
      
      if (ogplError) {
        console.error('Error updating OGPL status:', ogplError);
        const errorMessage = `Failed to update OGPL status: ${ogplError.message} (Code: ${ogplError.code})`;
        throw new Error(errorMessage);
      }
      
      showSuccess('Loading Complete', `${data.bookingIds.length} bookings have been loaded successfully`);
      return sessionData;
    } catch (err) {
      console.error('Failed to create loading session:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create loading session';
      setError(new Error(errorMessage));
      showError('Loading Failed', errorMessage);
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
        console.warn('No branch ID available for loading history');
        return [];
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
        const errorMessage = `Failed to fetch loading history: ${fetchError.message} (Code: ${fetchError.code})`;
        throw new Error(errorMessage);
      }
      
      console.log('Loading history:', data?.length);
      return data || [];
    } catch (err) {
      console.error('Failed to get loading history:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get loading history';
      setError(new Error(errorMessage));
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