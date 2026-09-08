import { supabase } from '../supabaseClient.js';

export async function listCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createCategory(userId, { name, color }, sortOrder) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ user_id: userId, name, color, sort_order: sortOrder })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderCategories(orderedIds) {
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('categories').update({ sort_order: index }).eq('id', id)
    )
  );
}
