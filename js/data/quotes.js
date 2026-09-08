import { supabase } from '../supabaseClient.js';

export async function listQuotes() {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function listQuotesForBook(bookId) {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('book_id', bookId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createQuote(userId, fields, sortOrder) {
  const { data, error } = await supabase
    .from('quotes')
    .insert({ user_id: userId, sort_order: sortOrder, ...fields })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateQuote(id, fields) {
  const { data, error } = await supabase
    .from('quotes')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteQuote(id) {
  const { error } = await supabase.from('quotes').delete().eq('id', id);
  if (error) throw error;
}

export async function pickRandomQuote() {
  const { data, error } = await supabase.from('quotes').select('id, quote_text, attribution, book_id');
  if (error) throw error;
  if (!data.length) return null;
  return data[Math.floor(Math.random() * data.length)];
}

// Composes the display attribution from the book's *current* title rather
// than baking a title snapshot into the stored value, so renaming a book
// can never desync it from quotes that reference it.
export function formatAttribution(quote, books) {
  const raw = quote.attribution || '';
  if (!quote.book_id) return raw;
  const book = books.find((b) => b.id === quote.book_id);
  if (!book) return raw;
  return raw ? `${book.title} - ${raw}` : book.title;
}
