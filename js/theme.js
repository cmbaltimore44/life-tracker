const STORAGE_THEME = 'kanban.theme';

export function initTheme(toggleBtn) {
  applyTheme(localStorage.getItem(STORAGE_THEME) === 'dark' ? 'dark' : 'light', toggleBtn);
  toggleBtn.addEventListener('click', () => {
    const current = localStorage.getItem(STORAGE_THEME) === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_THEME, next);
    applyTheme(next, toggleBtn);
  });
}

function applyTheme(theme, toggleBtn) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    toggleBtn.textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    toggleBtn.textContent = '🌙';
  }
}
