import { supabase } from '../supabaseClient.js';

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

export async function fetchSearchIndex() {
  const [tasks, projects, books, quotes, routines] = await Promise.all([
    supabase.from('tasks').select('id, title, notes').then(unwrap),
    supabase.from('projects').select('id, name, notes, status').then(unwrap),
    supabase.from('books').select('id, title, author, notes').then(unwrap),
    supabase.from('quotes').select('id, quote_text, attribution, book_id').then(unwrap),
    supabase.from('routines').select('id, name, time_of_day').then(unwrap),
  ]);
  return { tasks, projects, books, quotes, routines };
}
