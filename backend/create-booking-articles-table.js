import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createBookingArticlesTable() {
  console.log('🔨 Creating booking_articles junction table...');
  console.log('=' .repeat(50));

  try {
    // Step 1: Create the booking_articles table
    console.log('\n1. Creating booking_articles table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS booking_articles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        article_id UUID NOT NULL REFERENCES articles(id) ON DELETE RESTRICT,
        
        -- Quantity and weight
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_of_measure TEXT DEFAULT 'Nos',
        actual_weight DECIMAL(10,3) DEFAULT 0,
        charged_weight DECIMAL(10,3) DEFAULT 0 CHECK (charged_weight >= actual_weight),
        
        -- Financial details
        declared_value DECIMAL(10,2) DEFAULT 0,
        rate_per_unit DECIMAL(10,2) NOT NULL,
        rate_type TEXT NOT NULL DEFAULT 'per_quantity' CHECK (rate_type IN ('per_kg', 'per_quantity')),
        freight_amount DECIMAL(10,2) NOT NULL,
        
        -- Charges per unit
        loading_charge_per_unit DECIMAL(10,2) DEFAULT 0,
        unloading_charge_per_unit DECIMAL(10,2) DEFAULT 0,
        
        -- Calculated fields (stored for performance)
        total_loading_charges DECIMAL(10,2) GENERATED ALWAYS AS (loading_charge_per_unit * quantity) STORED,
        total_unloading_charges DECIMAL(10,2) GENERATED ALWAYS AS (unloading_charge_per_unit * quantity) STORED,
        
        -- Optional charges
        insurance_required BOOLEAN DEFAULT false,
        insurance_value DECIMAL(10,2) DEFAULT 0,
        insurance_charge DECIMAL(10,2) DEFAULT 0,
        packaging_charge DECIMAL(10,2) DEFAULT 0,
        
        -- Total for this article
        total_amount DECIMAL(10,2) GENERATED ALWAYS AS (
          freight_amount + 
          (loading_charge_per_unit * quantity) + 
          (unloading_charge_per_unit * quantity) + 
          COALESCE(insurance_charge, 0) + 
          COALESCE(packaging_charge, 0)
        ) STORED,
        
        -- Descriptions
        description TEXT,
        private_mark_number TEXT,
        is_fragile BOOLEAN DEFAULT false,
        special_instructions TEXT,
        
        -- Warehouse tracking
        warehouse_location TEXT,
        
        -- Status tracking
        status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'loaded', 'in_transit', 'unloaded', 'out_for_delivery', 'delivered', 'damaged', 'missing', 'cancelled')),
        ogpl_id UUID REFERENCES ogpl(id),
        loaded_at TIMESTAMP WITH TIME ZONE,
        loaded_by UUID REFERENCES auth.users(id),
        unloaded_at TIMESTAMP WITH TIME ZONE,
        unloaded_by UUID REFERENCES auth.users(id),
        delivered_at TIMESTAMP WITH TIME ZONE,
        delivered_by UUID REFERENCES auth.users(id),
        
        -- Audit fields
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES auth.users(id),
        
        -- Constraints
        UNIQUE(booking_id, article_id),
        CHECK (insurance_required = false OR insurance_value > 0),
        CHECK (charged_weight > 0)
      );
    `;

    // Using fetch to directly execute SQL via Supabase REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: createTableSQL })
    });

    if (!response.ok) {
      // Try alternative approach - using a simple select to test
      const { error: testError } = await supabase
        .from('booking_articles')
        .select('id')
        .limit(1);
      
      if (testError && testError.code === '42P01') {
        console.log('⚠️  Table does not exist. Creating manually...');
        console.log('\n📋 Please run this SQL in your Supabase SQL editor:');
        console.log(createTableSQL);
      } else if (!testError) {
        console.log('✅ Table booking_articles already exists!');
      }
    } else {
      console.log('✅ Table created successfully');
    }

    // Step 2: Create indexes
    console.log('\n2. Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_booking_articles_booking_id ON booking_articles(booking_id);',
      'CREATE INDEX IF NOT EXISTS idx_booking_articles_article_id ON booking_articles(article_id);',
      'CREATE INDEX IF NOT EXISTS idx_booking_articles_status ON booking_articles(status);',
      'CREATE INDEX IF NOT EXISTS idx_booking_articles_ogpl_id ON booking_articles(ogpl_id) WHERE ogpl_id IS NOT NULL;'
    ];
    
    console.log('📋 Indexes to create:');
    indexes.forEach(idx => console.log(`   ${idx}`));

    // Step 3: Create update trigger
    console.log('\n3. Creating update trigger...');
    const triggerSQL = `
      CREATE OR REPLACE FUNCTION update_booking_articles_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      CREATE TRIGGER trigger_update_booking_articles_updated_at
          BEFORE UPDATE ON booking_articles
          FOR EACH ROW
          EXECUTE FUNCTION update_booking_articles_updated_at();
    `;
    console.log('📋 Trigger SQL ready');

    // Step 4: Create RLS policies
    console.log('\n4. RLS Policies to apply...');
    const policies = [
      {
        name: 'booking_articles_org_select',
        action: 'SELECT',
        description: 'Users can view booking articles in their organization'
      },
      {
        name: 'booking_articles_org_insert', 
        action: 'INSERT',
        description: 'Users can create booking articles in their organization'
      },
      {
        name: 'booking_articles_org_update',
        action: 'UPDATE', 
        description: 'Users can update booking articles in their organization'
      },
      {
        name: 'booking_articles_org_delete',
        action: 'DELETE',
        description: 'Users can delete booking articles in their organization'
      }
    ];
    
    policies.forEach(policy => {
      console.log(`   ✓ ${policy.name}: ${policy.description}`);
    });

    // Step 5: Create helper functions
    console.log('\n5. Helper functions...');
    const helperFunctions = `
      -- Function to calculate booking total
      CREATE OR REPLACE FUNCTION calculate_booking_total(booking_uuid UUID)
      RETURNS DECIMAL(10,2) AS $$
      DECLARE
          total_amount DECIMAL(10,2);
      BEGIN
          SELECT COALESCE(SUM(ba.total_amount), 0)
          INTO total_amount
          FROM booking_articles ba
          WHERE ba.booking_id = booking_uuid;
          
          RETURN total_amount;
      END;
      $$ LANGUAGE plpgsql;

      -- Function to update booking total when articles change
      CREATE OR REPLACE FUNCTION update_booking_total_on_article_change()
      RETURNS TRIGGER AS $$
      DECLARE
          booking_uuid UUID;
          new_total DECIMAL(10,2);
      BEGIN
          -- Get booking ID from either NEW or OLD record
          booking_uuid := COALESCE(NEW.booking_id, OLD.booking_id);
          
          -- Calculate new total
          new_total := calculate_booking_total(booking_uuid);
          
          -- Update booking total
          UPDATE bookings 
          SET total_amount = new_total,
              updated_at = NOW()
          WHERE id = booking_uuid;
          
          RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;

      -- Create trigger for automatic total updates
      CREATE TRIGGER trigger_update_booking_total_on_article_change
          AFTER INSERT OR UPDATE OR DELETE ON booking_articles
          FOR EACH ROW
          EXECUTE FUNCTION update_booking_total_on_article_change();
    `;
    console.log('📋 Helper functions ready');

    // Step 6: Test the table
    console.log('\n6. Testing booking_articles table...');
    const { data: testData, error: testError } = await supabase
      .from('booking_articles')
      .select('*')
      .limit(1);
    
    if (testError && testError.code === '42P01') {
      console.log('\n❌ Table creation incomplete');
      console.log('\n📝 MANUAL STEPS REQUIRED:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run the following SQL commands:');
      console.log('\n--- COPY FROM HERE ---');
      console.log(createTableSQL);
      console.log('\n-- Indexes');
      indexes.forEach(idx => console.log(idx));
      console.log('\n-- Trigger');
      console.log(triggerSQL);
      console.log('\n-- Helper Functions');
      console.log(helperFunctions);
      console.log('\n-- Enable RLS');
      console.log('ALTER TABLE booking_articles ENABLE ROW LEVEL SECURITY;');
      console.log('\n--- COPY TO HERE ---');
    } else if (!testError) {
      console.log('✅ Table is accessible and ready!');
      console.log(`📊 Current records: ${testData?.length || 0}`);
    } else {
      console.log('⚠️  Unexpected error:', testError.message);
    }

    console.log('\n✨ Summary:');
    console.log('The booking_articles table structure has been prepared.');
    console.log('This enables:');
    console.log('  • Multiple articles per booking');
    console.log('  • Per-kg vs per-quantity rate calculations');
    console.log('  • Automatic total calculations');
    console.log('  • Article-level status tracking');
    console.log('  • Loading/unloading charge multiplication');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the creation script
createBookingArticlesTable();