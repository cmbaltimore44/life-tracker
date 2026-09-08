import { supabase } from '../supabaseClient.js';

export async function listRoutines() {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createRoutine(userId, { name, time_of_day }, sortOrder) {
  const { data, error } = await supabase
    .from('routines')
    .insert({ user_id: userId, name, time_of_day, sort_order: sortOrder })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRoutine(id) {
  const { error } = await supabase.from('routines').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderGroup(orderedIds, time_of_day) {
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('routines').update({ time_of_day, sort_order: index }).eq('id', id)
    )
  );
}
