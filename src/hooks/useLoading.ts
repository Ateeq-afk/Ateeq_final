import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { useBookings } from '@/hooks/useBookings';
import { loadingService } from '@/services/loading';

export function useLoading() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { showSuccess, showError } = useNotificationSystem();
  const { getCurrentUserBranch } = useAuth();
  const { selectedBranch } = useBranchSelection();
  const { updateBookingStatus } = useBookings();
  const userBranch = getCurrentUserBranch();

  // Get pending bookings that need to be loaded
  const getPendingBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const effectiveBranchId = selectedBranch || userBranch?.id;
      
      if (!effectiveBranchId) {
        console.warn('No branch ID available for loading pending bookings');
        return [];
      }
      
      console.log('Getting pending bookings for loading, branchId:', effectiveBranchId);
      
      // Get bookings that are in 'booked' status and not yet loaded
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          booking_articles(
            *,
            article:articles(*)
          ),
          sender:customers!sender_id(id, name, mobile, email, type),
          receiver:customers!receiver_id(id, name, mobile, email, type),
          from_branch_details:branches!from_branch(id, name, city, state),
          to_branch_details:branches!to_branch(id, name, city, state)
        `)
        .eq('from_branch', effectiveBranchId)
        .eq('status', 'booked')
        .is('loading_session_id', null)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error('Error fetching pending bookings:', fetchError);
        // Provide more user-friendly error messages
        let errorMessage = 'Failed to fetch pending bookings';
        if (fetchError.message?.includes('fetch') || fetchError.message?.includes('network')) {
          errorMessage = 'Network connection failed. Please check your internet connection.';
        } else if (fetchError.code === 'PGRST301') {
          errorMessage = 'Database connection error. Please try again.';
        } else {
          errorMessage = `${errorMessage}: ${fetchError.message}`;
        }
        throw new Error(errorMessage);
      }
      
      console.log('Pending bookings for loading:', data?.length);
      return data || [];
    } catch (err) {
      console.error('Failed to get pending bookings for loading:', err);
      let errorMessage = 'Failed to get pending bookings';
      if (err instanceof Error) {
        if (err.message.includes('fetch') || err.message.includes('network')) {
          errorMessage = 'Network connection failed. Please check your internet connection.';
        } else {
          errorMessage = err.message;
        }
      }
      setError(new Error(errorMessage));
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, userBranch]);

  // Get active OGPLs (outward gate passes)
  const getActiveOGPLs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const effectiveBranchId = selectedBranch || userBranch?.id;
      
      if (!effectiveBranchId) {
        console.warn('No branch ID available for loading active OGPLs');
        return [];
      }
      
      console.log('Getting active OGPLs');
      
      // Use the loading service instead of direct Supabase calls
      const data = await loadingService.getOGPLs({ status: 'created' });
      
      // Filter by branch since the API doesn't support branch filtering yet
      const filteredData = data.filter((ogpl: any) => ogpl.from_station === effectiveBranchId);
      
      console.log('Active OGPLs:', filteredData.length);
      return filteredData;
    } catch (err) {
      console.error('Failed to get active OGPLs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get active OGPLs';
      setError(new Error(errorMessage));
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, userBranch]);

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
      
      // Use the loading service
      const ogplData = await loadingService.createOGPL({
        vehicle_id: data.vehicleId,
        from_station: data.fromBranchId,
        to_station: data.toBranchId,
        transit_date: data.transitDate,
        primary_driver_name: data.driverName,
        primary_driver_mobile: data.driverMobile,
        remarks: data.remarks
      });
      
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
      
      // Use the loading service
      const sessionData = await loadingService.createLoadingSession({
        ogpl_id: data.ogplId,
        vehicle_id: data.vehicleId,
        from_branch_id: data.fromBranchId,
        to_branch_id: data.toBranchId,
        booking_ids: data.bookingIds,
        notes: data.notes
      });
      
      console.log('Loading session created:', sessionData);
      
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
      
      const effectiveBranchId = selectedBranch || userBranch?.id;
      
      if (!effectiveBranchId) {
        console.warn('No branch ID available for loading history');
        return [];
      }
      
      console.log('Getting loading history');
      
      // Use the loading service
      const data = await loadingService.getLoadingSessions();
      
      // Filter by branch since the API doesn't support branch filtering yet
      const filteredData = data.filter((session: any) => session.from_branch_id === effectiveBranchId);
      
      console.log('Loading history:', filteredData.length);
      return filteredData;
    } catch (err) {
      console.error('Failed to get loading history:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get loading history';
      setError(new Error(errorMessage));
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, userBranch]);

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