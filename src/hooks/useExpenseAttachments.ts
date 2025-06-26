import { supabase } from '@/lib/supabaseClient';

export async function uploadExpenseAttachment(expenseId: string, file: File): Promise<string> {
  const filePath = `${expenseId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage
    .from('expense_attachments')
    .upload(filePath, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('expense_attachments').getPublicUrl(filePath);
  const { error: insertError } = await supabase
    .from('expense_attachments')
    .insert({ expense_id: expenseId, file_url: data.publicUrl, original_name: file.name });
  if (insertError) throw insertError;
  return data.publicUrl;
}

export async function getExpenseAttachments(expenseId: string) {
  const { data, error } = await supabase
    .from('expense_attachments')
    .select('*')
    .eq('expense_id', expenseId);
  if (error) throw error;
  return data || [];
}
