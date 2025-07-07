import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard';
import { useCurrentBranch } from './useCurrentBranch';

export function useDashboardMetrics() {
  const { currentBranch } = useCurrentBranch();

  return useQuery({
    queryKey: ['dashboard-metrics', currentBranch?.id],
    queryFn: () => dashboardService.getMetrics(currentBranch?.id),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

export function useDashboardTrends(days: number = 30) {
  const { currentBranch } = useCurrentBranch();

  return useQuery({
    queryKey: ['dashboard-trends', currentBranch?.id, days],
    queryFn: () => dashboardService.getTrends(days, currentBranch?.id),
    staleTime: 300000, // Consider data stale after 5 minutes
  });
}

export function useRevenueBreakdown() {
  const { currentBranch } = useCurrentBranch();

  return useQuery({
    queryKey: ['revenue-breakdown', currentBranch?.id],
    queryFn: () => dashboardService.getRevenueBreakdown(currentBranch?.id),
    staleTime: 300000, // Consider data stale after 5 minutes
  });
}

export function useRecentActivities(limit: number = 10) {
  const { currentBranch } = useCurrentBranch();

  return useQuery({
    queryKey: ['recent-activities', currentBranch?.id, limit],
    queryFn: () => dashboardService.getRecentActivities(limit, currentBranch?.id),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
  });
}