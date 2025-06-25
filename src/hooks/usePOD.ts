import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/hooks/useBookings';

export function usePOD() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { showSuccess, showError } = useNotificationSystem();
  const { getCurrentUserBranch } = useAuth();
  const { updateBookingStatus } = useBookings();
  const userBranch = getCurrentUserBranch();

  // Get bookings that need POD
  const getPendingPODBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const effectiveBranchId = userBranch?.id;
      
      if (!effectiveBranchId) {
        console.warn('No branch ID available for pending POD bookings');
        return [];
      }
      
      console.log('Getting bookings pending POD, branchId:', effectiveBranchId);
      
      // Get bookings that are delivered but awaiting POD
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
        .eq('to_branch', effectiveBranchId)
        .eq('status', 'delivered')
        .eq('pod_status', 'pending')
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error('Error fetching bookings pending POD:', fetchError);
        const errorMessage = `Failed to fetch pending POD bookings: ${fetchError.message} (Code: ${fetchError.code})`;
        throw new Error(errorMessage);
      }
      
      console.log('Bookings pending POD:', data?.length);
      return data || [];
    } catch (err) {
      console.error('Failed to get bookings pending POD:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get bookings pending POD';
      setError(new Error(errorMessage));
      return [];
    } finally {
      setLoading(false);
    }
  }, [userBranch]);

  // Submit POD for a booking
  const submitPOD = async (data: {
    bookingId: string;
    receiverName: string;
    receiverPhone: string;
    receiverDesignation?: string;
    signatureImage?: string;
    photoEvidence?: string;
    remarks?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Submitting POD:', data);
      
      // 1. Create POD record
      const { data: podRecord, error: podError } = await supabase
        .from('pod_records')
        .insert({
          booking_id: data.bookingId,
          delivered_by: 'Admin User', // In a real app, this would be the current user
          receiver_name: data.receiverName,
          receiver_phone: data.receiverPhone,
          receiver_designation: data.receiverDesignation,
          signature_image_url: data.signatureImage,
          photo_evidence_url: data.photoEvidence,
          remarks: data.remarks
        })
        .select()
        .single();
      
      if (podError) {
        console.error('Error creating POD record:', podError);
        const errorMessage = `Failed to create POD record: ${podError.message} (Code: ${podError.code})`;
        throw new Error(errorMessage);
      }
      
      console.log('POD record created:', podRecord);
      
      // 2. Update booking status
      await updateBookingStatus(
        data.bookingId, 
        'delivered', 
        { 
          pod_status: 'completed',
          pod_record_id: podRecord.id,
          delivery_date: new Date().toISOString().split('T')[0],
          pod_data: {
            receiverName: data.receiverName,
            receiverPhone: data.receiverPhone,
            receiverDesignation: data.receiverDesignation,
            signatureImage: data.signatureImage,
            photoEvidence: data.photoEvidence,
            remarks: data.remarks,
            deliveredAt: new Date().toISOString()
          }
        }
      );
      
      showSuccess('POD Submitted', 'Proof of delivery has been recorded successfully');
      return podRecord;
    } catch (err) {
      console.error('Failed to submit POD:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit POD';
      setError(new Error(errorMessage));
      showError('POD Submission Failed', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get POD history
  const getPODHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const effectiveBranchId = userBranch?.id;
      
      if (!effectiveBranchId) {
        console.warn('No branch ID available for POD history');
        return [];
      }
      
      console.log('Getting POD history, branchId:', effectiveBranchId);
      
      const { data, error: fetchError } = await supabase
        .from('pod_records')
        .select(`
          *,
          booking:bookings(
            *,
            sender:customers!sender_id(id, name, mobile, email, type),
            receiver:customers!receiver_id(id, name, mobile, email, type),
            article:articles(id, name, description, base_rate),
            from_branch_details:branches!from_branch(id, name, city, state),
            to_branch_details:branches!to_branch(id, name, city, state)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error('Error fetching POD history:', fetchError);
        const errorMessage = `Failed to fetch POD history: ${fetchError.message} (Code: ${fetchError.code})`;
        throw new Error(errorMessage);
      }
      
      // Filter to only include PODs for bookings delivered to this branch
      const filteredData = data?.filter(pod => 
        pod.booking?.to_branch === effectiveBranchId
      ) || [];
      
      console.log('POD history:', filteredData.length);
      return filteredData;
    } catch (err) {
      console.error('Failed to get POD history:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get POD history';
      setError(new Error(errorMessage));
      return [];
    } finally {
      setLoading(false);
    }
  }, [userBranch]);

  // Get POD statistics
  const getPODStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const effectiveBranchId = userBranch?.id;
      
      if (!effectiveBranchId) {
        console.warn('No branch ID available for POD stats');
        return {
          totalDelivered: 0,
          totalPending: 0,
          withSignature: 0,
          withPhoto: 0,
          completionRate: 0
        };
      }
      
      console.log('Getting POD stats, branchId:', effectiveBranchId);
      
      // Get total delivered bookings
      const { count: totalDelivered, error: deliveredError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('to_branch', effectiveBranchId)
        .eq('status', 'delivered');
      
      if (deliveredError) {
        console.error('Error fetching total delivered count:', deliveredError);
        const errorMessage = `Failed to fetch delivered count: ${deliveredError.message} (Code: ${deliveredError.code})`;
        throw new Error(errorMessage);
      }
      
      // Get total pending PODs
      const { count: totalPending, error: pendingError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('to_branch', effectiveBranchId)
        .eq('status', 'delivered')
        .eq('pod_status', 'pending');
      
      if (pendingError) {
        console.error('Error fetching pending POD count:', pendingError);
        const errorMessage = `Failed to fetch pending POD count: ${pendingError.message} (Code: ${pendingError.code})`;
        throw new Error(errorMessage);
      }
      
      // Get total PODs with signature
      const { data: podData, error: podError } = await supabase
        .from('pod_records')
        .select('id, signature_image_url, photo_evidence_url')
        .not('signature_image_url', 'is', null);
      
      if (podError) {
        console.error('Error fetching POD signature count:', podError);
        const errorMessage = `Failed to fetch POD signature count: ${podError.message} (Code: ${podError.code})`;
        throw new Error(errorMessage);
      }
      
      const withSignature = podData?.length || 0;
      const withPhoto = podData?.filter(pod => pod.photo_evidence_url).length || 0;
      
      return {
        totalDelivered: totalDelivered || 0,
        totalPending: totalPending || 0,
        withSignature,
        withPhoto,
        completionRate: totalDelivered ? (withSignature / totalDelivered) * 100 : 0
      };
    } catch (err) {
      console.error('Failed to get POD stats:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get POD stats';
      setError(new Error(errorMessage));
      return {
        totalDelivered: 0,
        totalPending: 0,
        withSignature: 0,
        withPhoto: 0,
        completionRate: 0
      };
    } finally {
      setLoading(false);
    }
  }, [userBranch]);

  return {
    loading,
    error,
    getPendingPODBookings,
    submitPOD,
    getPODHistory,
    getPODStats
  };
}