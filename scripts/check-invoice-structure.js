import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkInvoiceStructure() {
  console.log('🔍 Checking existing invoices table structure...\n');

  try {
    // Get a sample record to see the structure
    const { data: sample, error: sampleError } = await supabase
      .from('invoices')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Error getting sample data:', sampleError.message);
      return;
    }

    console.log('📋 Invoices table structure:');
    
    if (sample && sample.length > 0) {
      const columns = Object.keys(sample[0]);
      console.log('✅ Columns found:', columns.join(', '));
      
      // Check for key columns we need
      const requiredColumns = ['branch_id', 'organization_id', 'customer_id', 'invoice_number', 'total_amount'];
      console.log('\n🔍 Checking for required columns:');
      
      requiredColumns.forEach(col => {
        if (columns.includes(col)) {
          console.log(`   ✅ ${col}: exists`);
        } else {
          console.log(`   ❌ ${col}: missing`);
        }
      });
      
      console.log('\n📊 Sample record structure:');
      console.log(JSON.stringify(sample[0], null, 2));
      
    } else {
      console.log('📭 Table is empty, cannot check structure from data');
      
      // Try to insert and then rollback to see the structure
      console.log('🧪 Testing table structure by attempting insert...');
      
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          branch_id: 'test',
          organization_id: 'test', 
          customer_id: 'test',
          invoice_number: 'TEST-001',
          total_amount: 100
        })
        .select();
        
      if (error) {
        console.log('❌ Insert failed (this helps us see the structure):');
        console.log('Error:', error.message);
        
        // Parse the error to understand missing columns
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.log('💡 This confirms the table structure is incomplete');
        }
      } else {
        console.log('✅ Insert succeeded, deleting test record...');
        
        // Delete the test record
        await supabase
          .from('invoices')
          .delete()
          .eq('invoice_number', 'TEST-001');
          
        console.log('✅ Test record deleted');
      }
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkInvoiceStructure().catch(console.error);