import { useState, useEffect, useCallback } from 'react';
import { getCacheItem, setCacheItem, clearCacheItem } from '@/lib/cache';
import type { Organization } from '@/types';

const CACHE_KEY = 'selected_organization';

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(() => {
    return getCacheItem<string>(CACHE_KEY) || 'org1';
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading organizations...');
      
      // Mock organization data
      const mockOrganizations: Organization[] = [
        {
          id: 'org1',
          name: 'k2k-logistics',
          slug: 'k2k-logistics',
          display_name: 'K2K Logistics',
          client_code: 'K2KLOG',
          settings: {},
          usage_data: {
            bookings_count: 120,
            storage_used: 250,
            api_calls: 1500,
            users_count: 10
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          branches: 5,
          members: 8
        }
      ];
      
      setOrganizations(mockOrganizations);
      
      // If we have organizations but no selected org, select the first one
      if (mockOrganizations.length > 0 && !selectedOrganizationId) {
        setSelectedOrganizationId(mockOrganizations[0].id);
        setCacheItem(CACHE_KEY, mockOrganizations[0].id);
      }
      
      console.log('Organizations loaded:', mockOrganizations.length);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Failed to load organizations:', err);
      setError(err instanceof Error ? err : new Error('Failed to load organizations'));
      
      // Implement retry logic
      if (retryCount < maxRetries) {
        console.log(`Retrying organization load (attempt ${retryCount + 1}/${maxRetries})...`);
        setRetryCount(prev => prev + 1);
        setTimeout(loadOrganizations, 1000 * Math.pow(2, retryCount)); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  }, [retryCount, selectedOrganizationId]);

  useEffect(() => {
    let mounted = true;

    // Initial load
    loadOrganizations();

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CACHE_KEY) {
        setSelectedOrganizationId(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadOrganizations]);

  const selectOrganization = (id: string) => {
    setSelectedOrganizationId(id);
    setCacheItem(CACHE_KEY, id);
  };

  const createOrganization = async (data: Partial<Organization>) => {
    try {
      console.log('Creating organization:', data);
      
      // Create a mock organization
      const mockOrganization: Organization = {
        id: Math.random().toString(36).substring(2, 15),
        name: data.name || 'new-organization',
        slug: data.slug || 'new-organization',
        display_name: data.display_name || 'New Organization',
        client_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        settings: data.settings || {},
        usage_data: {
          bookings_count: 0,
          storage_used: 0,
          api_calls: 0,
          users_count: 1
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        branches: 0,
        members: 1
      };
      
      setOrganizations(prev => [mockOrganization, ...prev]);
      console.log('Organization created successfully:', mockOrganization);
      return mockOrganization;
    } catch (err) {
      console.error('Failed to create organization:', err);
      throw err instanceof Error ? err : new Error('Failed to create organization');
    }
  };

  const updateOrganization = async (id: string, updates: Partial<Organization>) => {
    try {
      console.log(`Updating organization ${id}:`, updates);
      
      // Update the local state
      setOrganizations(prev => 
        prev.map(org => org.id === id 
          ? { ...org, ...updates, updated_at: new Date().toISOString() } 
          : org
        )
      );
      
      const updatedOrg = organizations.find(o => o.id === id);
      if (!updatedOrg) throw new Error('Organization not found');
      
      console.log('Organization updated successfully:', { ...updatedOrg, ...updates });
      return { ...updatedOrg, ...updates };
    } catch (err) {
      console.error('Failed to update organization:', err);
      throw err instanceof Error ? err : new Error('Failed to update organization');
    }
  };

  const deleteOrganization = async (id: string) => {
    try {
      console.log(`Deleting organization ${id}`);
      
      // Update the local state
      setOrganizations(prev => prev.filter(org => org.id !== id));
      
      // If the deleted org was selected, clear selection
      if (selectedOrganizationId === id) {
        setSelectedOrganizationId(null);
        clearCacheItem(CACHE_KEY);
      }
      
      console.log('Organization deleted successfully');
    } catch (err) {
      console.error('Failed to delete organization:', err);
      throw err instanceof Error ? err : new Error('Failed to delete organization');
    }
  };

  return {
    organizations,
    selectedOrganizationId,
    selectOrganization,
    loading,
    error,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    refresh: () => {
      setRetryCount(0);
      return loadOrganizations();
    }
  };
}