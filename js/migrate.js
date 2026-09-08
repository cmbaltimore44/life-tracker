import { supabase } from './supabaseClient.js';

const IMPORTED_FLAG = 'kanban.importedToSupabase';

export async function maybeImportLocalData(userId) {
  if (localStorage.getItem(IMPORTED_FLAG)) return;

  const rawCategories = localStorage.getItem('kanban.categories');
  const rawTasks = localStorage.getItem('kanban.tasks');
  if (!rawCategories && !rawTasks) {
    localStorage.setItem(IMPORTED_FLAG, '1');
    return;
  }

  const { count, error: countError } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true });
  if (countError) throw countError;
  if (count > 0) {
    localStorage.setItem(IMPORTED_FLAG, '1');
    return;
  }

  const wantsImport = confirm(
    'We found a task board saved on this device. Import it into your account now?'
  );
  localStorage.setItem(IMPORTED_FLAG, '1');
  if (!wantsImport) return;

  const oldCategories = safeParse(rawCategories, []);
  const oldTasks = safeParse(rawTasks, []);
  const categoryIdMap = new Map();

  if (oldCategories.length) {
    const rows = oldCategories.map((c, index) => {
      const newId = crypto.randomUUID();
      categoryIdMap.set(c.id, newId);
      return {
        id: newId,
        user_id: userId,
        name: c.name,
        color: c.color,
        sort_order: index,
      };
    });
    const { error } = await supabase.from('categories').insert(rows);
    if (error) throw error;
  }

  if (oldTasks.length) {
    const rows = oldTasks.map((t, index) => ({
      id: crypto.randomUUID(),
      user_id: userId,
      category_id: t.categoryId ? categoryIdMap.get(t.categoryId) || null : null,
      title: t.title,
      notes: t.notes || null,
      status: t.column || 'todo',
      due_date: t.dueDate || null,
      priority: t.priority || 'medium',
      sort_order: index,
    }));
    const { error } = await supabase.from('tasks').insert(rows);
    if (error) throw error;
  }
}

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}
