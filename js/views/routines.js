import * as routinesApi from '../data/routines.js';
import * as completionsApi from '../data/completions.js';
import { showError, showToast } from '../toast.js';

const GROUPS = ['morning', 'afternoon', 'evening'];

let userId = null;
let routines = [];
let completions = new Map();

const lists = {};
const forms = {};
let routineCountEl = null;

function cacheElements() {
  GROUPS.forEach((tod) => {
    lists[tod] = document.getElementById('list-' + tod);
    forms[tod] = document.querySelector(`.routine-add-form[data-tod="${tod}"]`);
  });
  routineCountEl = document.getElementById('routine-count');
}

function renderAll() {
  GROUPS.forEach(renderGroup);
  routineCountEl.textContent = routines.length
    ? `${routines.length} routine${routines.length === 1 ? '' : 's'}`
    : '';
}

function renderGroup(tod) {
  const container = lists[tod];
  container.innerHTML = '';
  const groupRoutines = routines
    .filter((r) => r.time_of_day === tod)
    .sort((a, b) => a.sort_order - b.sort_order);

  groupRoutines.forEach((routine) => container.appendChild(renderRow(routine)));
}

function renderRow(routine) {
  const today = completionsApi.todayISO();
  const dates = completions.get(routine.id) || new Set();
  const isDone = dates.has(today);
  const streak = completionsApi.computeStreak(dates, today);

  const row = document.createElement('li');
  row.className = 'routine-row' + (isDone ? ' completed' : '');
  row.draggable = true;
  row.dataset.id = routine.id;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'routine-check';
  checkbox.checked = isDone;
  checkbox.addEventListener('change', () => toggleCompletion(routine, checkbox.checked));
  row.appendChild(checkbox);

  const name = document.createElement('span');
  name.className = 'routine-name';
  name.textContent = routine.name;
  row.appendChild(name);

  if (streak > 0) {
    const streakBadge = document.createElement('span');
    streakBadge.className = 'routine-streak';
    streakBadge.textContent = `🔥 ${streak}`;
    row.appendChild(streakBadge);
  }

  const remove = document.createElement('button');
  remove.className = 'routine-remove';
  remove.textContent = '×';
  remove.title = 'Remove routine';
  remove.addEventListener('click', () => removeRoutine(routine.id));
  row.appendChild(remove);

  row.addEventListener('dragstart', () => row.classList.add('dragging'));
  row.addEventListener('dragend', () => {
    row.classList.remove('dragging');
    persistOrderFromDOM(row.closest('.routine-list').dataset.tod);
  });

  return row;
}

async function toggleCompletion(routine, checked) {
  const today = completionsApi.todayISO();
  const dates = completions.get(routine.id) || new Set();
  try {
    if (checked) {
      await completionsApi.markComplete(userId, routine.id, today);
      dates.add(today);
    } else {
      await completionsApi.markIncomplete(routine.id, today);
      dates.delete(today);
    }
    completions.set(routine.id, dates);
    renderGroup(routine.time_of_day);
  } catch (err) {
    showError(err);
    // The browser already flipped the checkbox on click; re-render from the
    // unchanged in-memory state so the UI doesn't silently disagree with the server.
    renderGroup(routine.time_of_day);
  }
}

async function removeRoutine(id) {
  try {
    await routinesApi.deleteRoutine(id);
    routines = routines.filter((r) => r.id !== id);
    completions.delete(id);
    renderAll();
    showToast('Routine deleted.', { type: 'success' });
  } catch (err) {
    showError(err);
  }
}

function persistOrderFromDOM(tod) {
  const orderedIds = Array.from(lists[tod].querySelectorAll('.routine-row')).map((r) => r.dataset.id);
  routinesApi
    .reorderGroup(orderedIds, tod)
    .then(refreshRoutines)
    .catch(showError);
}

function wireDragTargets() {
  GROUPS.forEach((tod) => {
    lists[tod].addEventListener('dragover', (e) => {
      e.preventDefault();
      const dragging = document.querySelector('.routine-row.dragging');
      if (!dragging) return;
      const container = lists[tod];
      const afterElement = getRowAfter(container, e.clientY);
      if (afterElement) container.insertBefore(dragging, afterElement);
      else container.appendChild(dragging);
    });
  });
}

function getRowAfter(container, y) {
  const rows = Array.from(container.querySelectorAll('.routine-row:not(.dragging)'));
  return rows.find((row) => {
    const rect = row.getBoundingClientRect();
    return y - rect.top < rect.height / 2;
  });
}

function wireAddForms() {
  GROUPS.forEach((tod) => {
    forms[tod].addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = forms[tod].querySelector('input');
      const name = input.value.trim();
      if (!name) return;
      const sortOrder = routines.filter((r) => r.time_of_day === tod).length;
      try {
        const created = await routinesApi.createRoutine(userId, { name, time_of_day: tod }, sortOrder);
        routines.push(created);
        input.value = '';
        renderAll();
      } catch (err) {
        showError(err);
      }
    });
  });
}

export function highlightRoutine(id) {
  const row = document.querySelector(`.routine-row[data-id="${id}"]`);
  if (!row) return;
  row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  row.classList.add('flash-highlight');
  setTimeout(() => row.classList.remove('flash-highlight'), 1500);
}

export async function initRoutines(uid) {
  userId = uid;
  cacheElements();
  wireDragTargets();
  wireAddForms();
  await refreshRoutines();
}

export async function refreshRoutines() {
  try {
    [routines, completions] = await Promise.all([routinesApi.listRoutines(), completionsApi.listCompletions()]);
  } catch (err) {
    showError(err);
    return;
  }
  renderAll();
}
