import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Article, CustomerArticleRate } from '@/types';

export function useArticles(branchId?: string) {
  const [articles, setArticles]   = useState<Article[]>([]);
  const [loading, setLoading]     = useState<boolean>(false);
  const [error, setError]         = useState<Error | null>(null);

  // 1) Fetch the list of articles (filtered by branchId if provided)
  // 2) Fetch one article by ID
const getArticle = useCallback(async (id: string): Promise<Article> => {
  const { data, error } = await supabase
    .from<Article>('articles')
    .select(`
      id,
      branch_id,
      name,
      description,
      base_rate,
      created_at,
      updated_at,
      hsn_code,
      tax_rate,
      unit_of_measure,
      min_quantity,
      is_fragile,
      requires_special_handling,
      notes,
      branch:branches(name)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  // pull out the branch name
  return {
    ...data,
    branch_name: data.branch?.name ?? null,
  };
}, []);

// 5) Fetch all customer‐specific rates for a given article
const getCustomerRates = useCallback(
  async (articleId: string): Promise<CustomerArticleRate[]> => {
    const { data, error } = await supabase
      .from('customer_article_rates')
      .select(`
        id,
        customer_id,
        rate,
        customer:customers(id,name,type)       -- pull in customer metadata
      `)
      .eq('article_id', articleId);

    if (error) throw error;

    // reshape into the shape your components expect
    return (data || []).map((r) => ({
      id: r.id,
      customer_id: r.customer_id,
      customer_name: r.customer?.name ?? 'Unknown',
      customer_type: (r.customer?.type as 'individual'|'corporate') || 'individual',
      rate: r.rate,
    }));
  },
  []
);

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // First try a simple query to debug
      let simpleQuery = supabase
        .from('articles')
        .select('id, name, description, base_rate, branch_id, created_at, updated_at')
        .order('name', { ascending: true });

      if (branchId) {
        simpleQuery = simpleQuery.eq('branch_id', branchId);
      }

      const { data: simpleData, error: simpleError } = await simpleQuery;

      if (simpleError) {
        console.error('Simple articles query error:', simpleError);
        throw simpleError;
      }

      // Now try the full query with all columns
      let query = supabase
        .from('articles')
        .select(`
          id,
          branch_id,
          name,
          description,
          base_rate,
          created_at,
          updated_at,
          hsn_code,
          tax_rate,
          unit_of_measure,
          min_quantity,
          is_fragile,
          requires_special_handling,
          notes,
          branch:branches(name)
        `)
        .order('name', { ascending: true });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error: sbError } = await query;
      if (sbError) {
        console.error('Full articles query error:', sbError);
        // Fall back to simple data if full query fails
        const transformedData = simpleData?.map(article => ({
          ...article,
          branch_name: null,
          hsn_code: null,
          tax_rate: null,
          unit_of_measure: null,
          min_quantity: 1,
          is_fragile: false,
          requires_special_handling: false,
          notes: null
        })) || [];
        
        setArticles(transformedData);
        throw sbError;
      }

      // Transform the data to match our Article type
      const transformedData = data?.map(article => ({
        ...article,
        branch_name: article.branch?.name
      })) || [];

      setArticles(transformedData);
    } catch (err) {
      console.error('useArticles.loadArticles error:', err);
      setError(err instanceof Error ? err : new Error('Failed to load articles'));
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  // reload whenever branchId changes
  useEffect(() => {
    loadArticles();
  }, [loadArticles]);


  // 2) Create a new article
  async function createArticle(input: Omit<Article, 'id'|'created_at'|'updated_at'>) {
    try {
      setLoading(true);

      // First try a simple insert with required fields only
      const { data: simpleData, error: simpleError } = await supabase
        .from('articles')
        .insert({
          name: input.name,
          description: input.description || '',
          base_rate: input.base_rate,
          branch_id: input.branch_id,
        })
        .select('id')
        .single();
        
      if (simpleError) {
        console.error('Simple article insert error:', simpleError);
        throw simpleError;
      }

      // Now try to update with all fields
      const { data, error: sbError } = await supabase
        .from('articles')
        .update({
          ...input,
          hsn_code: input.hsn_code || null,
          tax_rate: input.tax_rate || null,
          unit_of_measure: input.unit_of_measure || null,
          min_quantity: input.min_quantity || 1,
          is_fragile: input.is_fragile || false,
          requires_special_handling: input.requires_special_handling || false,
          notes: input.notes || null
        })
        .eq('id', simpleData.id)
        .select(`
          id,
          branch_id,
          name,
          description,
          base_rate,
          created_at,
          updated_at,
          hsn_code,
          tax_rate,
          unit_of_measure,
          min_quantity,
          is_fragile,
          requires_special_handling,
          notes,
          branch:branches(name)
        `)
        .single();

      if (sbError) {
        console.error('Full article update error:', sbError);
        // If update fails, fetch the basic article
        const { data: basicArticle, error: fetchError } = await supabase
          .from('articles')
          .select('*')
          .eq('id', simpleData.id)
          .single();
          
        if (fetchError) throw fetchError;
        
        const basicTransformedData = {
          ...basicArticle,
          branch_name: null
        };
        
        setArticles(prev => [...prev, basicTransformedData]);
        return basicTransformedData;
      }
      
      // Transform the data to match our Article type
      const transformedData = {
        ...data,
        branch_name: data.branch?.name
      };
      
      setArticles(prev => [...prev, transformedData]);
      return transformedData;
    } catch (err) {
      console.error('Failed to create article:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  // 3) Update an existing article
  async function updateArticle(id: string, updates: Partial<Article>) {
    try {
      setLoading(true);

      const { data, error: sbError } = await supabase
        .from('articles')
        .update(updates)
        .eq('id', id)
        .select(`
          id,
          branch_id,
          name,
          description,
          base_rate,
          created_at,
          updated_at,
          hsn_code,
          tax_rate,
          unit_of_measure,
          min_quantity,
          is_fragile,
          requires_special_handling,
          notes,
          branch:branches(name)
        `)
        .single();

      if (sbError) throw sbError;
      
      // Transform the data to match our Article type
      const transformedData = {
        ...data,
        branch_name: data.branch?.name
      };
      
      setArticles(prev => prev.map(a => (a.id === id ? transformedData : a)));
      return transformedData;
    } catch (err) {
      console.error('Failed to update article:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  // 4) Delete an article
  async function deleteArticle(id: string) {
    try {
      setLoading(true);
      
      // Check if article is used in any bookings
      const { count, error: countError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', id);
      
      if (countError) throw countError;
      
      if (count && count > 0) {
        throw new Error('Cannot delete article that is used in bookings');
      }
      
      const { error: sbError } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (sbError) throw sbError;
      setArticles(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to delete article:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  // 6) Upsert (insert or update) a specific customer-article rate
  async function updateCustomerRate(
    customerId: string,
    articleId: string,
    rate: number
  ) {
    try {
      setLoading(true);
      const payload = { customer_id: customerId, article_id: articleId, rate };
      const { data, error: sbError } = await supabase
        .from('customer_article_rates')
        .upsert(payload, { onConflict: 'customer_id,article_id' })
        .select()
        .single();

      if (sbError) throw sbError;
      return data;
    } catch (err) {
      console.error('Failed to update customer rate:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    articles,
    loading,
    error,
    refresh: loadArticles,
    createArticle,
    updateArticle,
    deleteArticle,
    getCustomerRates,
    updateCustomerRate,
    getArticle,
  };
}
