import { supabase } from '../supabaseClient.js';

export function todayISO() {
  return toISO(new Date());
}

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(dateISO, delta) {
  const d = new Date(dateISO + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return toISO(d);
}

export async function listCompletions() {
  const { data, error } = await supabase
    .from('routine_completions')
    .select('routine_id, completed_date');
  if (error) throw error;

  const byRoutine = new Map();
  for (const row of data) {
    if (!byRoutine.has(row.routine_id)) byRoutine.set(row.routine_id, new Set());
    byRoutine.get(row.routine_id).add(row.completed_date);
  }
  return byRoutine;
}

export async function markComplete(userId, routineId, dateISO) {
  const { error } = await supabase
    .from('routine_completions')
    .insert({ user_id: userId, routine_id: routineId, completed_date: dateISO });
  if (error) throw error;
}

export async function markIncomplete(routineId, dateISO) {
  const { error } = await supabase
    .from('routine_completions')
    .delete()
    .eq('routine_id', routineId)
    .eq('completed_date', dateISO);
  if (error) throw error;
}

// Grace-period streak: a routine not yet checked off today still shows
// yesterday's streak, so it doesn't look reset before the day is over.
export function computeStreak(completedDateSet, todayDateISO) {
  let cursor = todayDateISO;
  if (!completedDateSet.has(cursor)) {
    cursor = addDays(cursor, -1);
    if (!completedDateSet.has(cursor)) return 0;
  }
  let streak = 0;
  while (completedDateSet.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
