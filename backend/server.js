import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Basic health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'DesiCargo API Server', 
    status: 'running', 
    version: '1.0.0',
    supabase: supabaseUrl ? 'Connected' : 'Not configured'
  });
});

// Test Supabase connection
app.get('/api/test', async (req, res) => {
  try {
    const { data, error } = await supabase.from('organizations').select('count');
    if (error) throw error;
    res.json({ success: true, message: 'Supabase connected successfully' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Add warehouse endpoints
app.get('/api/warehouses', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/warehouses', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .insert([req.body])
      .select()
      .single();
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/warehouses/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/warehouses/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('warehouses')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Warehouse locations endpoints
app.get('/api/locations', async (req, res) => {
  try {
    const { warehouse_id } = req.query;
    let query = supabase.from('warehouse_locations').select('*');
    
    if (warehouse_id) {
      query = query.eq('warehouse_id', warehouse_id);
    }
    
    const { data, error } = await query.order('location_code');
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/locations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('warehouse_locations')
      .insert([req.body])
      .select()
      .single();
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add branches endpoint for loading page
app.get('/api/branches', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('name');
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bookings endpoints
app.get('/api/bookings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, sender:sender_id(name, mobile), receiver:receiver_id(name, mobile), article:article_id(name), from_branch:from_branch(name), to_branch:to_branch(name)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([req.body])
      .select()
      .single();
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Customers endpoint
app.get('/api/customers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Articles endpoint  
app.get('/api/articles', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('name');
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// LR number generation endpoint
app.post('/api/lr/generate', async (req, res) => {
  try {
    const { branch_id } = req.body;
    // Generate a unique LR number - in production this would be more sophisticated
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const lrNumber = `LR${timestamp}${random}`;
    
    res.json({ success: true, data: { lr_number: lrNumber } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
});