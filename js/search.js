import { fetchSearchIndex } from './data/search.js';
import { showError } from './toast.js';
import { openTaskModal, refreshBoard } from './views/board.js';
import { openQuoteResult } from './views/library.js';
import { highlightRoutine } from './views/routines.js';

const PROJECT_STATUS_LABELS = { not_started: 'Not Started', in_progress: 'In Progress', done: 'Done' };
const TIME_OF_DAY_LABELS = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };
const TYPE_ORDER = ['task', 'project', 'book', 'quote', 'routine'];
const TYPE_LABELS = { task: 'Tasks', project: 'Projects', book: 'Books', quote: 'Quotes', routine: 'Routines' };
const MAX_PER_GROUP = 8;

const el = {};
let index = [];
let renderedItems = [];
let activeIndex = -1;

function cacheElements() {
  Object.assign(el, {
    fab: document.getElementById('search-fab'),
    overlay: document.getElementById('search-modal-overlay'),
    input: document.getElementById('search-modal-input'),
    results: document.getElementById('search-results'),
  });
}

function buildIndex({ tasks, projects, books, quotes, routines }) {
  const items = [];
  tasks.forEach((t) =>
    items.push({
      type: 'task',
      id: t.id,
      title: t.title,
      subtitle: t.notes || '',
      searchText: `${t.title} ${t.notes || ''}`.toLowerCase(),
      raw: t,
    })
  );
  projects.forEach((p) =>
    items.push({
      type: 'project',
      id: p.id,
      title: p.name,
      subtitle: PROJECT_STATUS_LABELS[p.status] || '',
      searchText: `${p.name} ${p.notes || ''}`.toLowerCase(),
      raw: p,
    })
  );
  books.forEach((b) =>
    items.push({
      type: 'book',
      id: b.id,
      title: b.title,
      subtitle: b.author || '',
      searchText: `${b.title} ${b.author || ''} ${b.notes || ''}`.toLowerCase(),
      raw: b,
    })
  );
  quotes.forEach((q) =>
    items.push({
      type: 'quote',
      id: q.id,
      title: q.quote_text,
      subtitle: q.attribution || '',
      searchText: `${q.quote_text} ${q.attribution || ''}`.toLowerCase(),
      raw: q,
    })
  );
  routines.forEach((r) =>
    items.push({
      type: 'routine',
      id: r.id,
      title: r.name,
      subtitle: TIME_OF_DAY_LABELS[r.time_of_day] || '',
      searchText: r.name.toLowerCase(),
      raw: r,
    })
  );
  return items;
}

function renderHint(text) {
  el.results.innerHTML = '';
  const hint = document.createElement('div');
  hint.className = 'empty-hint';
  hint.textContent = text;
  el.results.appendChild(hint);
}

function setActive(newIndex) {
  const rows = el.results.querySelectorAll('.search-result-row');
  rows.forEach((r) => r.classList.remove('active'));
  if (newIndex < 0 || newIndex >= rows.length) {
    activeIndex = -1;
    return;
  }
  activeIndex = newIndex;
  rows[activeIndex].classList.add('active');
  rows[activeIndex].scrollIntoView({ block: 'nearest' });
}

function renderResults(term) {
  el.results.innerHTML = '';
  renderedItems = [];
  const q = term.trim().toLowerCase();
  if (!q) {
    renderHint('Start typing to search tasks, projects, books, quotes, and routines.');
    return;
  }

  TYPE_ORDER.forEach((type) => {
    const matches = index
      .filter((item) => item.type === type && item.searchText.includes(q))
      .sort((a, b) => {
        const aRank = a.title.toLowerCase().includes(q) ? 0 : 1;
        const bRank = b.title.toLowerCase().includes(q) ? 0 : 1;
        return aRank - bRank;
      })
      .slice(0, MAX_PER_GROUP);
    if (matches.length === 0) return;

    const label = document.createElement('div');
    label.className = 'search-result-group-label';
    label.textContent = TYPE_LABELS[type];
    el.results.appendChild(label);

    matches.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'search-result-row';

      const title = document.createElement('div');
      title.className = 'search-result-title';
      title.textContent = item.title;
      row.appendChild(title);

      if (item.subtitle) {
        const subtitle = document.createElement('div');
        subtitle.className = 'search-result-subtitle';
        subtitle.textContent = item.subtitle;
        row.appendChild(subtitle);
      }

      row.addEventListener('click', () => selectResult(item));
      el.results.appendChild(row);
      renderedItems.push(item);
    });
  });

  if (renderedItems.length === 0) {
    renderHint('No matches.');
    return;
  }
  setActive(0);
}

async function selectResult(item) {
  close();
  try {
    if (item.type === 'project') {
      location.hash = '#/projects/' + item.id;
    } else if (item.type === 'book') {
      location.hash = '#/library/books/' + item.id;
    } else if (item.type === 'task') {
      location.hash = '#/board';
      await refreshBoard();
      openTaskModal(item.id);
    } else if (item.type === 'quote') {
      await openQuoteResult(item.id, item.raw.book_id);
    } else if (item.type === 'routine') {
      location.hash = '#/routines';
      highlightRoutine(item.id);
    }
  } catch (err) {
    showError(err);
  }
}

export async function open() {
  el.overlay.classList.add('open');
  el.input.value = '';
  renderHint('Loading…');
  el.input.focus();
  try {
    const raw = await fetchSearchIndex();
    index = buildIndex(raw);
  } catch (err) {
    showError(err);
    index = [];
  }
  renderResults('');
}

function close() {
  el.overlay.classList.remove('open');
}

export function initSearch() {
  cacheElements();

  el.fab.addEventListener('click', open);

  el.overlay.addEventListener('click', (e) => {
    if (e.target === el.overlay) close();
  });

  el.input.addEventListener('input', () => renderResults(el.input.value));

  el.input.addEventListener('keydown', (e) => {
    const rows = el.results.querySelectorAll('.search-result-row');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (rows.length) setActive((activeIndex + 1) % rows.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (rows.length) setActive((activeIndex - 1 + rows.length) % rows.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && renderedItems[activeIndex]) selectResult(renderedItems[activeIndex]);
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      open();
    } else if (e.key === 'Escape' && el.overlay.classList.contains('open')) {
      close();
    }
  });
}
