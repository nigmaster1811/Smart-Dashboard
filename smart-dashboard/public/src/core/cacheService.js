const PREFIX = 'smart-dashboard-cache-v1';

export const cacheService = {
  set(key, value) {
    localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(value));
  },

  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(`${PREFIX}:${key}`);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  remove(key) {
    localStorage.removeItem(`${PREFIX}:${key}`);
  },

  clearAll() {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(`${PREFIX}:`))
      .forEach((key) => localStorage.removeItem(key));
  }
};