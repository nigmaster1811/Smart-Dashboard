const USERS_KEY = 'smart-dashboard-users-v1';
const SESSION_KEY = 'smart-dashboard-session-v1';
const PTS_KEY = 'smart-dashboard-pts-v1';

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) ?? [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function getId() {
  return globalThis.crypto?.randomUUID?.() ?? `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/* =========================
   PTS STORAGE
========================= */

function loadPTS() {
  try {
    return JSON.parse(localStorage.getItem(PTS_KEY)) ?? {};
  } catch {
    return {};
  }
}

function savePTS(data) {
  localStorage.setItem(PTS_KEY, JSON.stringify(data));
}

/* =========================
   AUTH SERVICE
========================= */

export const authService = {
  seedDemoUserIfEmpty() {
    const users = loadUsers();
    if (users.length > 0) return;

    const demo = {
      id: getId(),
      name: 'Демо-пользователь',
      email: 'demo@smart.local',
      password: 'demo1234'
    };

    users.push(demo);
    saveUsers(users);

    saveSession({
      id: demo.id,
      name: demo.name,
      email: demo.email
    });
  },

  register({ name, email, password }) {
    const users = loadUsers();
    const safeEmail = normalizeEmail(email);

    if (!name || !safeEmail || !password) {
      return { ok: false, error: 'Заполните имя, email и пароль.' };
    }

    if (password.length < 4) {
      return { ok: false, error: 'Пароль должен быть не короче 4 символов.' };
    }

    if (users.some((u) => normalizeEmail(u.email) === safeEmail)) {
      return { ok: false, error: 'Пользователь с таким email уже существует.' };
    }

    const newUser = {
      id: getId(),
      name: String(name).trim(),
      email: safeEmail,
      password
    };

    users.push(newUser);
    saveUsers(users);

    saveSession({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    });

    return { ok: true, user: { id: newUser.id, name: newUser.name, email: newUser.email } };
  },

  login(email, password) {
    const users = loadUsers();
    const safeEmail = normalizeEmail(email);

    const user = users.find(
      (u) => normalizeEmail(u.email) === safeEmail && u.password === password
    );

    if (!user) {
      return { ok: false, error: 'Неверный email или пароль.' };
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    saveSession(sessionUser);

    return { ok: true, user: sessionUser };
  },

  logout() {
    clearSession();
  },

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  },

  updateCurrentUserName(name) {
    const current = this.getCurrentUser();
    if (!current) return null;

    const users = loadUsers();
    const index = users.findIndex((u) => u.id === current.id);
    if (index === -1) return null;

    users[index].name = String(name).trim();
    saveUsers(users);

    const updated = { ...current, name: users[index].name };
    saveSession(updated);

    return updated;
  },

  /* =========================
     PTS SYSTEM
  ========================= */

  getPTS() {
    const session = this.getCurrentUser();
    if (!session) return 0;

    const pts = loadPTS();
    return pts[session.id] ?? 0;
  },

  addPTS(amount) {
    const session = this.getCurrentUser();
    if (!session) return 0;

    const pts = loadPTS();

    if (!pts[session.id]) {
      pts[session.id] = 0;
    }

    pts[session.id] += amount;

    savePTS(pts);

    window.dispatchEvent(new Event('ptsUpdated'));

    return pts[session.id];
  },

  setPTS(amount) {
    const session = this.getCurrentUser();
    if (!session) return 0;

    const pts = loadPTS();
    pts[session.id] = amount;

    savePTS(pts);

    window.dispatchEvent(new Event('ptsUpdated'));

    return pts[session.id];
  }
};
