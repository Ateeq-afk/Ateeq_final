import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function setupInitialData() {
  
  try {
    // 1. Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .upsert({
        name: 'K2K Logistics',
        description: 'Leading logistics and transportation company',
        website: 'www.k2klogistics.com',
        status: 'active'
      }, { 
        onConflict: 'name',
        ignoreDuplicates: false
      })
      .select()
      .single();
    
    if (orgError) {
      console.error('❌ Error creating organization:', orgError.message);
      return;
    }
    
    
    // 2. Create organization code
    const { error: codeError } = await supabase
      .from('organization_codes')
      .upsert({
        organization_id: org.id,
        code: 'k2k-logistics',
        is_active: true
      }, { 
        onConflict: 'code',
        ignoreDuplicates: true
      });
    
    if (codeError) {
    } else {
    }
    
    // 3. Create branches
    const branches = [
      {
        name: 'Mumbai Central',
        code: 'MUM',
        address: '123 Business District, Andheri East',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400069',
        phone: '+91-22-1234-5678',
        email: 'mumbai@k2klogistics.com',
        organization_id: org.id,
        is_active: true
      },
      {
        name: 'Delhi Hub',
        code: 'DEL',
        address: '456 Industrial Area, Gurgaon',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110037',
        phone: '+91-11-9876-5432',
        email: 'delhi@k2klogistics.com',
        organization_id: org.id,
        is_active: true
      },
      {
        name: 'Bangalore South',
        code: 'BLR',
        address: '789 Tech Park, Electronic City',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560100',
        phone: '+91-80-5555-1234',
        email: 'bangalore@k2klogistics.com',
        organization_id: org.id,
        is_active: true
      },
      {
        name: 'Chennai Port',
        code: 'CHE',
        address: '321 Harbor Road, Port Area',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        phone: '+91-44-7777-8888',
        email: 'chennai@k2klogistics.com',
        organization_id: org.id,
        is_active: true
      }
    ];
    
    for (const branch of branches) {
      const { error } = await supabase
        .from('branches')
        .upsert(branch, { 
          onConflict: 'organization_id,code',
          ignoreDuplicates: false
        });
      
      if (error) {
      } else {
      }
    }
    
    
  } catch (error) {
    console.error('❌ Error setting up initial data:', error.message);
  }
}

setupInitialData();