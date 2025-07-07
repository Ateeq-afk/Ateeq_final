import { supabase } from '../supabaseClient';

interface LRGenerationOptions {
  isQuotation?: boolean;
}

export async function generateLRNumber(branchId: string, options: LRGenerationOptions = {}): Promise<string> {
  try {
    // Get branch and organization information
    let branchPrefix = 'DC'; // Default prefix
    let orgCode = 'DES'; // Default organization code
    
    if (branchId) {
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .select(`
          name,
          code,
          organization_id,
          organizations (
            name,
            organization_codes (
              code
            )
          )
        `)
        .eq('id', branchId)
        .single();
      
      if (!branchError && branch) {
        // Extract first 3 letters from branch name
        if (branch.name) {
          branchPrefix = branch.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
        }
        
        // Get organization code
        if (branch.organizations?.organization_codes?.[0]?.code) {
          orgCode = branch.organizations.organization_codes[0].code.toUpperCase();
        }
      }
    }
    
    // Get the current date
    const date = new Date();
    const year = date.getFullYear().toString(); // Full year for better clarity
    
    // Determine prefix based on type
    const typePrefix = options.isQuotation ? 'QT' : branchPrefix;
    const lrPrefix = options.isQuotation 
      ? `${typePrefix}-${branchPrefix}-${year}`
      : `${branchPrefix}-${orgCode}-${year}`;
    
    // Use a transaction-like approach with retry logic
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      // Get the latest LR number for this prefix
      const { data: latestLR, error: lrError } = await supabase
        .from('bookings')
        .select('lr_number')
        .ilike('lr_number', `${lrPrefix}-%`)
        .order('lr_number', { ascending: false })
        .limit(1);
      
      if (lrError) {
        console.error('Error fetching latest LR:', lrError);
        throw new Error('Failed to fetch latest LR number');
      }
      
      // Generate sequence number
      let sequence = 1;
      if (latestLR && latestLR.length > 0) {
        const parts = latestLR[0].lr_number.split('-');
        const lastSequence = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1;
        }
      }
      
      const lrNumber = `${lrPrefix}-${sequence.toString().padStart(5, '0')}`;
      
      // Atomic uniqueness check using database function
      const { data: reserveResult, error: reserveError } = await supabase
        .rpc('reserve_lr_number', { 
          lr_number: lrNumber,
          branch_id: branchId 
        });
      
      if (reserveError) {
        // If it's a unique constraint violation, try next sequence
        if (reserveError.code === '23505') {
          console.warn(`LR number ${lrNumber} already exists, retrying...`);
          continue;
        }
        console.error('Error reserving LR number:', reserveError);
        throw new Error('Failed to reserve LR number');
      }
      
      if (reserveResult) {
        // Successfully reserved the LR number
        return lrNumber;
      }
      
      // If reserve_result is false, LR already exists, try again
      console.warn(`LR number ${lrNumber} already exists, retrying...`);
    }
    
    // If we've exhausted all attempts, add a random suffix
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${lrPrefix}-${randomSuffix}`;
    
  } catch (err) {
    console.error('Failed to generate LR number:', err);
    throw err instanceof Error ? err : new Error('Failed to generate LR number');
  }
}