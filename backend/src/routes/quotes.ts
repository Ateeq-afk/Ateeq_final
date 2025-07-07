import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { supabase } from '../supabaseClient';

const router = Router();

// Quote Schema
const quoteSchema = z.object({
  customer_id: z.string().uuid(),
  rate_contract_id: z.string().uuid().optional(),
  valid_from: z.string(),
  valid_until: z.string(),
  from_location: z.string(),
  to_location: z.string(),
  estimated_volume: z.object({
    weight: z.number(),
    units: z.number(),
    articles: z.array(z.object({
      article_id: z.string().uuid(),
      quantity: z.number(),
      weight: z.number(),
    })),
  }),
  notes: z.string().optional(),
  terms_and_conditions: z.string().optional(),
});

// Apply authentication to all routes
router.use(authenticate);

// Get all quotes
router.get('/', async (req, res) => {
  try {
    const { customer_id, status, valid_only } = req.query;
    const user = req.user!;

    let query = supabase
      .from('quotes')
      .select(`
        *,
        customer:customers(id, name, code, phone, email),
        rate_contract:rate_contracts(id, contract_number),
        approved_by_user:users!quotes_approved_by_fkey(id, name),
        booking:bookings!quotes_converted_to_booking_id_fkey(id, booking_number)
      `)
      .eq('organization_id', user.organization_id);

    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (valid_only === 'true') {
      const today = new Date().toISOString().split('T')[0];
      query = query
        .gte('valid_until', today)
        .in('status', ['sent', 'approved']);
    }

    if (user.branch_id) {
      query = query.eq('branch_id', user.branch_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get quote by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        customer:customers(*),
        rate_contract:rate_contracts(*),
        approved_by_user:users!quotes_approved_by_fkey(id, name),
        booking:bookings!quotes_converted_to_booking_id_fkey(id, booking_number)
      `)
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create quote
router.post('/', async (req, res) => {
  try {
    const user = req.user!;
    const validatedData = quoteSchema.parse(req.body);

    // Generate quote number
    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', user.organization_id);

    const quoteNumber = `QT-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(6, '0')}`;

    // Calculate pricing based on rate contract
    let priceData = {
      base_amount: 0,
      surcharges: [],
      discounts: [],
      total_amount: 0,
    };

    if (validatedData.rate_contract_id) {
      // Calculate total weight and quantity
      const totalWeight = validatedData.estimated_volume.articles.reduce(
        (sum, article) => sum + article.weight,
        0
      );
      const totalQuantity = validatedData.estimated_volume.articles.reduce(
        (sum, article) => sum + article.quantity,
        0
      );

      // For simplicity, calculate based on total volume
      // In real scenario, you might calculate per article
      const { data: calcResult, error: calcError } = await supabase.rpc('calculate_contract_price', {
        p_rate_contract_id: validatedData.rate_contract_id,
        p_from_location: validatedData.from_location,
        p_to_location: validatedData.to_location,
        p_article_id: validatedData.estimated_volume.articles[0]?.article_id || null,
        p_weight: totalWeight,
        p_quantity: totalQuantity,
        p_booking_date: validatedData.valid_from,
      });

      if (!calcError && calcResult && calcResult.length > 0) {
        priceData = calcResult[0];
      }
    } else {
      // Manual pricing calculation without contract
      // This is a simplified version - you might want to add more logic
      priceData.base_amount = validatedData.estimated_volume.weight * 50; // Default rate
      priceData.total_amount = priceData.base_amount;
    }

    const { data, error } = await supabase
      .from('quotes')
      .insert({
        organization_id: user.organization_id,
        branch_id: user.branch_id,
        quote_number: quoteNumber,
        ...validatedData,
        base_amount: priceData.base_amount,
        surcharges: priceData.surcharges,
        discounts: priceData.discounts,
        total_amount: priceData.total_amount,
        status: 'draft',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update quote
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const updates = req.body;

    // Recalculate pricing if needed
    if (updates.estimated_volume || updates.rate_contract_id) {
      const { data: currentQuote } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', id)
        .single();

      const estimatedVolume = updates.estimated_volume || currentQuote.estimated_volume;
      const rateContractId = updates.rate_contract_id || currentQuote.rate_contract_id;

      if (rateContractId) {
        const totalWeight = estimatedVolume.articles.reduce(
          (sum, article) => sum + article.weight,
          0
        );
        const totalQuantity = estimatedVolume.articles.reduce(
          (sum, article) => sum + article.quantity,
          0
        );

        const { data: calcResult, error: calcError } = await supabase.rpc('calculate_contract_price', {
          p_rate_contract_id: rateContractId,
          p_from_location: updates.from_location || currentQuote.from_location,
          p_to_location: updates.to_location || currentQuote.to_location,
          p_article_id: estimatedVolume.articles[0]?.article_id || null,
          p_weight: totalWeight,
          p_quantity: totalQuantity,
          p_booking_date: updates.valid_from || currentQuote.valid_from,
        });

        if (!calcError && calcResult && calcResult.length > 0) {
          const priceData = calcResult[0];
          updates.base_amount = priceData.base_amount;
          updates.surcharges = priceData.surcharges;
          updates.discounts = priceData.discounts;
          updates.total_amount = priceData.total_amount;
        }
      }
    }

    const { data, error } = await supabase
      .from('quotes')
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
    console.error('Error updating quote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send quote to customer
router.post('/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const { data, error } = await supabase
      .from('quotes')
      .update({
        status: 'sent',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .eq('status', 'draft')
      .select()
      .single();

    if (error) throw error;

    // TODO: Implement email sending logic here

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error sending quote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve quote
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const { data, error } = await supabase
      .from('quotes')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .eq('status', 'sent')
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error approving quote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Convert quote to booking
router.post('/:id/convert-to-booking', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { booking_details } = req.body;

    // Get quote details
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .eq('status', 'approved')
      .single();

    if (quoteError) throw quoteError;

    // Create booking from quote
    // Note: This is a simplified version. You might need to adjust based on your booking schema
    const bookingData = {
      organization_id: user.organization_id,
      branch_id: user.branch_id,
      customer_id: quote.customer_id,
      rate_contract_id: quote.rate_contract_id,
      quote_id: quote.id,
      from_location: quote.from_location,
      to_location: quote.to_location,
      total_amount: quote.total_amount,
      payment_type: 'credit',
      booking_date: new Date().toISOString(),
      ...booking_details, // Additional details from request
    };

    // Generate booking number
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', user.organization_id);

    bookingData.booking_number = `BK-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(6, '0')}`;

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Update quote status
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'converted',
        converted_to_booking_id: booking.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({ success: true, data: { quote, booking } });
  } catch (error) {
    console.error('Error converting quote to booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reject quote
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { reason } = req.body;

    const { data, error } = await supabase
      .from('quotes')
      .update({
        status: 'rejected',
        notes: reason ? `Rejected: ${reason}` : 'Rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error rejecting quote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Duplicate quote
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    // Get original quote
    const { data: original, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .single();

    if (fetchError) throw fetchError;

    // Generate new quote number
    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', user.organization_id);

    const quoteNumber = `QT-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(6, '0')}`;

    // Create duplicate
    const { data, error } = await supabase
      .from('quotes')
      .insert({
        ...original,
        id: undefined,
        quote_number: quoteNumber,
        status: 'draft',
        approved_by: null,
        approved_at: null,
        converted_to_booking_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user.id,
        notes: `Duplicated from ${original.quote_number}`,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error duplicating quote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;