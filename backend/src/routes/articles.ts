import { Router } from 'express';
import { articleSchema, articleUpdateSchema, customerArticleRateSchema } from '../schemas';
import { supabase } from '../supabaseClient';
import { requireOrgBranch } from '../middleware/withOrgBranch';

const router = Router();

router.get('/', requireOrgBranch, async (req, res) => {
  const { orgId, branchId, role } = req as any;
  let query = supabase
    .from('articles')
    .select('*')
    .eq('organization_id', orgId);
  if (role !== 'admin') {
    query = query.eq('branch_id', branchId);
  }
  const { data, error } = await query;
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

router.post('/', requireOrgBranch, async (req, res) => {
  const parse = articleSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json(parse.error);
    return;
  }
  const payload = { ...parse.data };
  const { orgId, branchId, role } = req as any;
  payload['organization_id'] = orgId;
  if (role !== 'admin') {
    payload['branch_id'] = branchId;
  }
  const { data, error } = await supabase.from('articles').insert(payload).select();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json(data?.[0]);
});

// GET single article
router.get('/:id', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  let query = supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId);
    
  if (role !== 'admin') {
    query = query.eq('branch_id', branchId);
  }
  
  const { data, error } = await query.single();
  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Article not found' });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// UPDATE article
router.put('/:id', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  const parse = articleUpdateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });
  
  let query = supabase
    .from('articles')
    .update(parse.data)
    .eq('id', id)
    .eq('organization_id', orgId);
    
  if (role !== 'admin') {
    query = query.eq('branch_id', branchId);
  }
  
  const { data, error } = await query.select().single();
  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Article not found' });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// DELETE article
router.delete('/:id', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  // Check if article is used in any bookings
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select('id')
    .eq('article_id', id)
    .limit(1);
    
  if (bookingError) {
    return res.status(500).json({ error: bookingError.message });
  }
  
  if (bookings && bookings.length > 0) {
    return res.status(400).json({ error: 'Cannot delete article that is used in bookings' });
  }
  
  let query = supabase
    .from('articles')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);
    
  if (role !== 'admin') {
    query = query.eq('branch_id', branchId);
  }
  
  const { error } = await query;
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  res.status(204).send();
});

// Customer article rates endpoints

// GET customer rates for an article
router.get('/:id/rates', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  // First verify the article exists and user has access
  let articleQuery = supabase
    .from('articles')
    .select('id')
    .eq('id', id)
    .eq('organization_id', orgId);
    
  if (role !== 'admin') {
    articleQuery = articleQuery.eq('branch_id', branchId);
  }
  
  const { data: article, error: articleError } = await articleQuery.single();
  if (articleError) {
    return res.status(404).json({ error: 'Article not found' });
  }
  
  const { data, error } = await supabase
    .from('customer_article_rates')
    .select(`
      *,
      customer:customers(id, name, mobile)
    `)
    .eq('article_id', id);
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST/PUT customer rate for an article
router.post('/:id/rates', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  const parse = customerArticleRateSchema.safeParse({ ...req.body, article_id: id });
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });
  
  // First verify the article exists and user has access
  let articleQuery = supabase
    .from('articles')
    .select('id')
    .eq('id', id)
    .eq('organization_id', orgId);
    
  if (role !== 'admin') {
    articleQuery = articleQuery.eq('branch_id', branchId);
  }
  
  const { data: article, error: articleError } = await articleQuery.single();
  if (articleError) {
    return res.status(404).json({ error: 'Article not found' });
  }
  
  // Upsert the rate
  const { data, error } = await supabase
    .from('customer_article_rates')
    .upsert(parse.data, { onConflict: 'customer_id,article_id' })
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE customer rate for an article
router.delete('/:id/rates/:customerId', requireOrgBranch, async (req, res) => {
  const { id, customerId } = req.params;
  const { orgId, branchId, role } = req as any;
  
  // First verify the article exists and user has access
  let articleQuery = supabase
    .from('articles')
    .select('id')
    .eq('id', id)
    .eq('organization_id', orgId);
    
  if (role !== 'admin') {
    articleQuery = articleQuery.eq('branch_id', branchId);
  }
  
  const { data: article, error: articleError } = await articleQuery.single();
  if (articleError) {
    return res.status(404).json({ error: 'Article not found' });
  }
  
  const { error } = await supabase
    .from('customer_article_rates')
    .delete()
    .eq('article_id', id)
    .eq('customer_id', customerId);
    
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
