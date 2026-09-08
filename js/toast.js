const ICONS = { error: '✕', success: '✓', info: 'i' };

let container = null;

function ensureContainer() {
  if (container) return container;
  container = document.createElement('div');
  container.className = 'toast-container';
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-atomic', 'true');
  document.body.appendChild(container);
  return container;
}

export function showToast(message, { type = 'info', duration = 4500 } = {}) {
  const host = ensureContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.textContent = ICONS[type] || ICONS.info;
  toast.appendChild(icon);

  const text = document.createElement('span');
  text.className = 'toast-message';
  text.textContent = message;
  toast.appendChild(text);

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'toast-close';
  close.setAttribute('aria-label', 'Dismiss');
  close.textContent = '×';
  toast.appendChild(close);

  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    clearTimeout(timer);
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 200);
  };
  close.addEventListener('click', dismiss);

  host.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-visible'));
  const timer = setTimeout(dismiss, duration);

  return dismiss;
}

export function showError(err) {
  console.error(err);
  showToast(err?.message || 'Something went wrong talking to the server.', {
    type: 'error',
    duration: 6000,
  });
}
