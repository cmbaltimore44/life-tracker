import { supabase } from '../supabaseClient.js';

export async function listProjectTasks(projectId) {
  const { data, error } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

export async function listTaskCounts() {
  const { data, error } = await supabase.from('project_tasks').select('project_id, done');
  if (error) throw error;
  return data;
}

export async function reorderProjectTasks(orderedIds) {
  await Promise.all(
    orderedIds.map((id, index) => supabase.from('project_tasks').update({ sort_order: index }).eq('id', id))
  );
}

export async function createProjectTask(userId, projectId, title, sortOrder) {
  const { data, error } = await supabase
    .from('project_tasks')
    .insert({ user_id: userId, project_id: projectId, title, sort_order: sortOrder })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProjectTask(id, fields) {
  const { data, error } = await supabase
    .from('project_tasks')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProjectTask(id) {
  const { error } = await supabase.from('project_tasks').delete().eq('id', id);
  if (error) throw error;
}
