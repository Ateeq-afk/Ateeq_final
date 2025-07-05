import { supabase } from '../index';

export async function generateLRNumber(branchId: string): Promise<string> {
  try {
    // Get the branch code
    let branchCode = 'DC'; // Default code for DesiCargo
    
    if (branchId) {
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .select('code')
        .eq('id', branchId)
        .single();
      
      if (!branchError && branch && branch.code) {
        branchCode = branch.code.slice(0, 2).toUpperCase();
      }
    }
    
    // Get the current date
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2); // Last 2 digits of year
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Use a transaction-like approach with retry logic
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      // Get the latest LR number for this branch and month
      const { data: latestLR, error: lrError } = await supabase
        .from('bookings')
        .select('lr_number')
        .ilike('lr_number', `${branchCode}${year}${month}-%`)
        .order('lr_number', { ascending: false })
        .limit(1);
      
      if (lrError) {
        console.error('Error fetching latest LR:', lrError);
        throw new Error('Failed to fetch latest LR number');
      }
      
      // Generate sequence number
      let sequence = 1;
      if (latestLR && latestLR.length > 0) {
        const lastSequence = parseInt(latestLR[0].lr_number.split('-')[1]);
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1;
        }
      }
      
      const lrNumber = `${branchCode}${year}${month}-${sequence.toString().padStart(4, '0')}`;
      
      // Try to verify this LR number doesn't exist (race condition check)
      const { data: existing, error: checkError } = await supabase
        .from('bookings')
        .select('id')
        .eq('lr_number', lrNumber)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking LR existence:', checkError);
        continue;
      }
      
      if (!existing) {
        // LR number is unique, return it
        return lrNumber;
      }
      
      // If we reach here, there was a race condition, try again
      console.warn(`LR number ${lrNumber} already exists, retrying...`);
    }
    
    // If we've exhausted all attempts, add a random suffix
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${branchCode}${year}${month}-${randomSuffix}`;
    
  } catch (err) {
    console.error('Failed to generate LR number:', err);
    throw err instanceof Error ? err : new Error('Failed to generate LR number');
  }
}