const toastRootId = 'sd-toast-root';

function ensureToastRoot() {
  let root = document.getElementById(toastRootId);
  if (!root) {
    root = document.createElement('div');
    root.id = toastRootId;
    root.className = 'toast-root';
    document.body.appendChild(root);
  }
  return root;
}

function showToast(message, type = 'info') {
  const root = ensureToastRoot();
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = message;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-visible'));

  setTimeout(() => {
    el.classList.remove('is-visible');
    setTimeout(() => el.remove(), 250);
  }, 2600);
}

export const notificationService = {
  async requestPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    return Notification.requestPermission();
  },

  async notify(title, options = {}) {
    const permission = await this.requestPermission();
    if (permission === 'granted') {
      new Notification(title, options);
      return true;
    }

    showToast(options.body || title, 'info');
    return false;
  },

  success(message) {
    showToast(message, 'success');
  },

  warn(message) {
    showToast(message, 'warning');
  },

  error(message) {
    showToast(message, 'error');
  }
};