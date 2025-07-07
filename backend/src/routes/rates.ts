import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { supabase } from '../supabaseClient';

const router = Router();

// Rate Contract Schema
const rateContractSchema = z.object({
  contract_number: z.string(),
  customer_id: z.string().uuid(),
  contract_type: z.enum(['standard', 'special', 'volume', 'seasonal']),
  valid_from: z.string(),
  valid_until: z.string(),
  minimum_business_commitment: z.number().optional(),
  payment_terms: z.string().optional(),
  credit_limit: z.number().optional(),
  base_discount_percentage: z.number().optional(),
  notes: z.string().optional(),
  terms_and_conditions: z.string().optional(),
});

// Rate Slab Schema
const rateSlabSchema = z.object({
  rate_contract_id: z.string().uuid(),
  from_location: z.string(),
  to_location: z.string(),
  article_id: z.string().uuid().optional(),
  article_category: z.string().optional(),
  weight_from: z.number(),
  weight_to: z.number(),
  rate_per_kg: z.number().optional(),
  rate_per_unit: z.number().optional(),
  minimum_charge: z.number().optional(),
  charge_basis: z.enum(['weight', 'unit', 'fixed', 'whichever_higher']),
});

// Surcharge Rule Schema
const surchargeRuleSchema = z.object({
  rate_contract_id: z.string().uuid().optional(),
  surcharge_type: z.enum(['fuel', 'seasonal', 'congestion', 'toll', 'handling', 'insurance', 'cod', 'door_delivery', 'urgent']),
  calculation_method: z.enum(['percentage', 'fixed', 'per_kg', 'per_unit']),
  value: z.number(),
  min_amount: z.number().optional(),
  max_amount: z.number().optional(),
  applicable_routes: z.array(z.object({
    from: z.string(),
    to: z.string(),
  })).optional(),
  applicable_articles: z.array(z.string().uuid()).optional(),
  conditions: z.object({}).optional(),
  effective_from: z.string(),
  effective_until: z.string().optional(),
});

// Apply authentication to all routes
router.use(authenticate);

// Get all rate contracts
router.get('/contracts', async (req, res) => {
  try {
    const { customer_id, status, active_only } = req.query;
    const user = req.user!;

    let query = supabase
      .from('rate_contracts')
      .select(`
        *,
        customer:customers(id, name, code),
        approved_by_user:users!rate_contracts_approved_by_fkey(id, name)
      `)
      .eq('organization_id', user.organization_id);

    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (active_only === 'true') {
      const today = new Date().toISOString().split('T')[0];
      query = query
        .eq('status', 'active')
        .lte('valid_from', today)
        .gte('valid_until', today);
    }

    if (user.branch_id) {
      query = query.or(`branch_id.eq.${user.branch_id},branch_id.is.null`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching rate contracts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get rate contract by ID with all details
router.get('/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    // Get contract
    const { data: contract, error: contractError } = await supabase
      .from('rate_contracts')
      .select(`
        *,
        customer:customers(id, name, code, gst, phone, email, address, city, state, pincode),
        approved_by_user:users!rate_contracts_approved_by_fkey(id, name)
      `)
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .single();

    if (contractError) throw contractError;

    // Get rate slabs
    const { data: slabs, error: slabsError } = await supabase
      .from('rate_slabs')
      .select(`
        *,
        article:articles(id, name, hsn_code)
      `)
      .eq('rate_contract_id', id)
      .order('from_location')
      .order('to_location')
      .order('weight_from');

    if (slabsError) throw slabsError;

    // Get surcharge rules
    const { data: surcharges, error: surchargesError } = await supabase
      .from('surcharge_rules')
      .select('*')
      .eq('rate_contract_id', id)
      .order('surcharge_type');

    if (surchargesError) throw surchargesError;

    res.json({
      success: true,
      data: {
        ...contract,
        rate_slabs: slabs || [],
        surcharge_rules: surcharges || [],
      },
    });
  } catch (error) {
    console.error('Error fetching rate contract details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create rate contract
router.post('/contracts', async (req, res) => {
  try {
    const user = req.user!;
    const validatedData = rateContractSchema.parse(req.body);

    const { data, error } = await supabase
      .from('rate_contracts')
      .insert({
        ...validatedData,
        organization_id: user.organization_id,
        branch_id: user.branch_id,
        created_by: user.id,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating rate contract:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update rate contract
router.put('/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const updates = req.body;

    const { data, error } = await supabase
      .from('rate_contracts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating rate contract:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve rate contract
router.post('/contracts/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    // Check if user has approval rights
    if (!['admin', 'superadmin'].includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    const { data, error } = await supabase
      .from('rate_contracts')
      .update({
        status: 'active',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .eq('status', 'pending_approval')
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error approving rate contract:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get rate slabs for a contract
router.get('/contracts/:id/slabs', async (req, res) => {
  try {
    const { id } = req.params;
    const { from_location, to_location, article_id } = req.query;

    let query = supabase
      .from('rate_slabs')
      .select(`
        *,
        article:articles(id, name, hsn_code)
      `)
      .eq('rate_contract_id', id)
      .eq('is_active', true);

    if (from_location) {
      query = query.eq('from_location', from_location);
    }

    if (to_location) {
      query = query.eq('to_location', to_location);
    }

    if (article_id) {
      query = query.or(`article_id.eq.${article_id},article_id.is.null`);
    }

    const { data, error } = await query.order('weight_from');

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching rate slabs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create rate slabs (bulk)
router.post('/contracts/:id/slabs', async (req, res) => {
  try {
    const { id } = req.params;
    const { slabs } = req.body;

    if (!Array.isArray(slabs)) {
      return res.status(400).json({ success: false, error: 'Slabs must be an array' });
    }

    const validatedSlabs = slabs.map(slab => ({
      ...rateSlabSchema.parse(slab),
      rate_contract_id: id,
    }));

    const { data, error } = await supabase
      .from('rate_slabs')
      .insert(validatedSlabs)
      .select();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating rate slabs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update rate slab
router.put('/slabs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('rate_slabs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating rate slab:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete rate slab
router.delete('/slabs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('rate_slabs')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting rate slab:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get surcharge rules
router.get('/surcharges', async (req, res) => {
  try {
    const user = req.user!;
    const { type, active_only } = req.query;

    let query = supabase
      .from('surcharge_rules')
      .select('*')
      .eq('organization_id', user.organization_id);

    if (type) {
      query = query.eq('surcharge_type', type);
    }

    if (active_only === 'true') {
      const today = new Date().toISOString().split('T')[0];
      query = query
        .eq('is_active', true)
        .lte('effective_from', today)
        .or(`effective_until.gte.${today},effective_until.is.null`);
    }

    const { data, error } = await query.order('surcharge_type');

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching surcharge rules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create surcharge rule
router.post('/surcharges', async (req, res) => {
  try {
    const user = req.user!;
    const validatedData = surchargeRuleSchema.parse(req.body);

    const { data, error } = await supabase
      .from('surcharge_rules')
      .insert({
        ...validatedData,
        organization_id: user.organization_id,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating surcharge rule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calculate price based on rate contract
router.post('/calculate-price', async (req, res) => {
  try {
    const {
      rate_contract_id,
      from_location,
      to_location,
      article_id,
      weight,
      quantity,
      booking_date,
    } = req.body;

    const { data, error } = await supabase.rpc('calculate_contract_price', {
      p_rate_contract_id: rate_contract_id,
      p_from_location: from_location,
      p_to_location: to_location,
      p_article_id: article_id,
      p_weight: weight,
      p_quantity: quantity,
      p_booking_date: booking_date || new Date().toISOString().split('T')[0],
    });

    if (error) throw error;

    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error calculating price:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get applicable rate for a booking
router.post('/get-applicable-rate', async (req, res) => {
  try {
    const user = req.user!;
    const {
      customer_id,
      from_location,
      to_location,
      article_id,
      weight,
      booking_date,
    } = req.body;

    // Find active rate contracts for the customer
    const { data: contracts, error: contractError } = await supabase
      .from('rate_contracts')
      .select('id')
      .eq('organization_id', user.organization_id)
      .eq('customer_id', customer_id)
      .eq('status', 'active')
      .lte('valid_from', booking_date || new Date().toISOString().split('T')[0])
      .gte('valid_until', booking_date || new Date().toISOString().split('T')[0]);

    if (contractError) throw contractError;

    if (!contracts || contracts.length === 0) {
      return res.json({
        success: true,
        data: { hasContract: false, message: 'No active rate contract found' },
      });
    }

    // Find applicable rate slab
    const { data: slabs, error: slabError } = await supabase
      .from('rate_slabs')
      .select('*, rate_contract:rate_contracts(*)')
      .in('rate_contract_id', contracts.map(c => c.id))
      .eq('from_location', from_location)
      .eq('to_location', to_location)
      .or(`article_id.eq.${article_id},article_id.is.null`)
      .lte('weight_from', weight)
      .gte('weight_to', weight)
      .eq('is_active', true)
      .order('article_id', { ascending: false, nullsFirst: false })
      .limit(1);

    if (slabError) throw slabError;

    if (!slabs || slabs.length === 0) {
      return res.json({
        success: true,
        data: { hasContract: true, hasRate: false, message: 'No applicable rate slab found' },
      });
    }

    res.json({
      success: true,
      data: {
        hasContract: true,
        hasRate: true,
        rate_contract: slabs[0].rate_contract,
        rate_slab: slabs[0],
      },
    });
  } catch (error) {
    console.error('Error getting applicable rate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;