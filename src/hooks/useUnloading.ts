import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { useBookings } from '@/hooks/useBookings';
import { unloadingService } from '@/services/unloading';

// Simple UUID validation used across hooks
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (uuid: string | null): boolean => !!uuid && UUID_REGEX.test(uuid);

export function useUnloading() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { showSuccess, showError } = useNotificationSystem();
  const { getCurrentUserBranch } = useAuth();
  const { selectedBranch } = useBranchSelection();
  const { updateBookingStatus } = useBookings();
  const userBranch = getCurrentUserBranch();

  // Get incoming OGPLs that need to be unloaded
  const getIncomingOGPLs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const effectiveBranchId = selectedBranch || userBranch?.id;

      if (!effectiveBranchId) {
        console.warn('No branch ID available, fetching all in_transit OGPLs');
      } else {
        console.log('Getting incoming OGPLs for branch:', effectiveBranchId);
      }
      
      // First try a simple query to debug
      const { data: simpleData, error: simpleError } = await supabase
        .from('ogpl')
        .select('id, ogpl_number, status')
        .eq('status', 'in_transit')
        .limit(5);
        
      if (simpleError) {
        console.error('Simple OGPL query failed:', simpleError);
        const errorMessage = `Failed to fetch OGPLs: ${simpleError.message} (Code: ${simpleError.code})`;
        throw new Error(errorMessage);
      }
      
      console.log('Simple OGPL query successful, sample:', simpleData);
      
      // Now try the full query
      let query = supabase
        .from('ogpl')
        .select(`
          *,
          vehicle:vehicles(*),
          from_station:branches!from_station(*),
          to_station:branches!to_station(*),
          loading_records(
            *,
            booking:bookings(
              *,
              sender:customers!sender_id(*),
              receiver:customers!receiver_id(*),
              article:articles(*)
            )
          )
        `)
        .eq('status', 'in_transit')
        .order('created_at', { ascending: false });
      
      if (effectiveBranchId) {
        query = query.eq('to_station', effectiveBranchId);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        console.error('Full OGPL query failed:', fetchError);
        
        // Fall back to a simpler query without relationships
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('ogpl')
          .select('*')
          .eq('status', 'in_transit')
          .order('created_at', { ascending: false });
          
        if (fallbackError) {
          console.error('Fallback OGPL query failed:', fallbackError);
          const errorMessage = `Failed to fetch OGPLs: ${fallbackError.message} (Code: ${fallbackError.code})`;
          throw new Error(errorMessage);
        }
        
        console.log('Fallback OGPL query successful, count:', fallbackData?.length);
        return fallbackData || [];
      }
      
      console.log('Full OGPL query successful, count:', data?.length);
      return data || [];
    } catch (err) {
      console.error('Failed to get incoming OGPLs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get incoming OGPLs';
      setError(new Error(errorMessage));
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, userBranch]);

  // Unload an OGPL using the new secure unloading service
  const unloadOGPL = async (
    ogplId: string,
    bookingIds: string[],
    conditions: Record<string, { status: string; remarks?: string; photo?: string }>,
    branchId: string
  ) => {
    try {
      console.log('=== UNLOAD OGPL FUNCTION START ===');
      console.log('Parameters:', { ogplId, bookingIds: bookingIds.length, conditions: Object.keys(conditions).length, branchId });
      
      setLoading(true);
      setError(null);

      // Validate identifiers
      if (!isValidUUID(ogplId)) {
        throw new Error('Invalid OGPL ID');
      }

      if (!branchId || !isValidUUID(branchId)) {
        throw new Error('Invalid or missing branch ID');
      }

      if (!bookingIds.length) {
        throw new Error('No bookings provided for unloading');
      }

      // Validate conditions
      const hasInvalidEntries = Object.entries(conditions).some(([bookingId, condition]) => {
        if (condition.status === 'damaged' && !condition.remarks) {
          showError('Validation Error', 'Please provide remarks for all damaged items');
          return true;
        }
        return false;
      });
      
      if (hasInvalidEntries) {
        throw new Error('Please provide remarks for all damaged items');
      }

      // Convert conditions to the format expected by the service
      const formattedConditions = Object.fromEntries(
        Object.entries(conditions).map(([bookingId, condition]) => [
          bookingId,
          {
            status: condition.status as 'good' | 'damaged' | 'missing',
            remarks: condition.remarks,
            photo: condition.photo
          }
        ])
      );

      // Use the new unloading service which properly handles workflow context
      console.log('Calling unloading service...');
      const result = await unloadingService.completeUnloading(ogplId, formattedConditions);
      
      console.log('Unloading service completed successfully:', result);
      showSuccess('Unloading Complete', `All items have been successfully unloaded`);
      
      return result;
    } catch (err) {
      console.error('=== UNLOAD OGPL FUNCTION FAILED ===');
      console.error('Failed to unload OGPL:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to unload OGPL';
      setError(new Error(errorMessage));
      showError('Unloading Failed', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get completed unloadings
  const getCompletedUnloadings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const effectiveBranchId = selectedBranch || userBranch?.id;

      console.log('Getting completed unloadings, branchId:', effectiveBranchId);
      
      // Use the new unloading_sessions table
      let query = supabase
        .from('unloading_sessions')
        .select(`
          *,
          ogpl:ogpl(
            *,
            vehicle:vehicles(*),
            from_station:branches!from_station(*),
            to_station:branches!to_station(*),
            loading_records(
              *,
              booking:bookings(
                *,
                sender:customers!sender_id(*),
                receiver:customers!receiver_id(*),
                article:articles(*)
              )
            )
          )
        `)
        .order('unloaded_at', { ascending: false });
      
      if (effectiveBranchId) {
        query = query.eq('branch_id', effectiveBranchId);
      }
      
      const { data: sessionData, error: sessionError } = await query;
      
      if (sessionError) {
        console.error('Error fetching unloading sessions:', sessionError);
        const errorMessage = `Failed to fetch unloading sessions: ${sessionError.message} (Code: ${sessionError.code})`;
        throw new Error(errorMessage);
      }
      
      console.log('Unloading sessions fetched:', sessionData?.length);
      return sessionData || [];
    } catch (err) {
      console.error('Failed to get completed unloadings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get completed unloadings';
      setError(new Error(errorMessage));
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, userBranch]);

  // Get unloading statistics
  const getUnloadingStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const effectiveBranchId = selectedBranch || userBranch?.id;
      
      if (!effectiveBranchId) {
        console.warn('No branch ID available for unloading stats');
        return {
          totalSessions: 0,
          totalDamaged: 0,
          totalMissing: 0,
          goodCondition: 0
        };
      }
      
      console.log('Getting unloading stats, branchId:', effectiveBranchId);
      
      // Get total unloaded items
      const { count: totalCount, error: totalError } = await supabase
        .from('unloading_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', effectiveBranchId);
      
      if (totalError) {
        console.error('Error fetching total unloading count:', totalError);
        const errorMessage = `Failed to fetch unloading stats: ${totalError.message} (Code: ${totalError.code})`;
        throw new Error(errorMessage);
      }
      
      // Get damaged items count
      const { data: damagedData, error: damagedError } = await supabase
        .from('unloading_sessions')
        .select('items_damaged')
        .eq('branch_id', effectiveBranchId);
      
      if (damagedError) {
        console.error('Error fetching damaged items count:', damagedError);
        const errorMessage = `Failed to fetch damaged items: ${damagedError.message} (Code: ${damagedError.code})`;
        throw new Error(errorMessage);
      }
      
      const totalDamaged = damagedData?.reduce((sum, session) => sum + (session.items_damaged || 0), 0) || 0;
      
      // Get missing items count
      const { data: missingData, error: missingError } = await supabase
        .from('unloading_sessions')
        .select('items_missing')
        .eq('branch_id', effectiveBranchId);
      
      if (missingError) {
        console.error('Error fetching missing items count:', missingError);
        const errorMessage = `Failed to fetch missing items: ${missingError.message} (Code: ${missingError.code})`;
        throw new Error(errorMessage);
      }
      
      const totalMissing = missingData?.reduce((sum, session) => sum + (session.items_missing || 0), 0) || 0;
      
      return {
        totalSessions: totalCount || 0,
        totalDamaged,
        totalMissing,
        goodCondition: (totalCount || 0) - totalDamaged - totalMissing
      };
    } catch (err) {
      console.error('Failed to get unloading stats:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get unloading stats';
      setError(new Error(errorMessage));
      return {
        totalSessions: 0,
        totalDamaged: 0,
        totalMissing: 0,
        goodCondition: 0
      };
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, userBranch]);

  return {
    loading,
    error,
    getIncomingOGPLs,
    unloadOGPL,
    getCompletedUnloadings,
    getUnloadingStats
  };
}