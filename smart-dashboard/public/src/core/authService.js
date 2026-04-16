const USERS_KEY = "smart-dashboard-users-v1";
const SESSION_KEY = "smart-dashboard-session-v1";
const PTS_KEY = "smart-dashboard-pts-v1";

/* =========================
   DB HELPERS
========================= */

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

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function getId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `id_${Date.now()}_${Math.random().toString(16).slice(2)}`
  );
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/* =========================
   AUTH SERVICE
========================= */

export const authService = {
  /* DEMO USER */
  seedDemoUserIfEmpty() {
    const users = loadUsers();

    // ❗ важно: если есть хоть 1 пользователь — НЕ трогаем базу
    if (users.length > 0) return;

    const demo = {
      id: getId(),
      name: "Демо-пользователь",
      email: "demo@smart.local",
      password: "demo1234"
    };

    users.push(demo);
    saveUsers(users);

    // не обязательно логинить автоматически, но можно
    saveSession({
      id: demo.id,
      name: demo.name,
      email: demo.email
    });
  },

  /* REGISTER */
  register({ name, email, password }) {
    const users = loadUsers();
    const safeEmail = normalizeEmail(email);

    if (!name || !safeEmail || !password) {
      return { ok: false, error: "Заполните все поля" };
    }

    if (password.length < 4) {
      return { ok: false, error: "Пароль слишком короткий" };
    }

    const exists = users.some(
      (u) => normalizeEmail(u.email) === safeEmail
    );

    if (exists) {
      return { ok: false, error: "Пользователь уже существует" };
    }

    const newUser = {
      id: getId(),
      name: String(name).trim(),
      email: safeEmail,
      password
    };

    // 🔥 ВАЖНО: добавляем в ТУ ЖЕ БАЗУ
    users.push(newUser);
    saveUsers(users);

    saveSession({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    });

    return { ok: true, user: newUser };
  },

  /* LOGIN */
  login(email, password) {
    const users = loadUsers();
    const safeEmail = normalizeEmail(email);

    const user = users.find(
      (u) => normalizeEmail(u.email) === safeEmail && u.password === password
    );

    if (!user) {
      return { ok: false, error: "Неверный email или пароль" };
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
    return getSession();
  },

  /* =========================
     PTS (НЕ ТРОГАЕМ)
  ========================= */

  getPTS() {
    const user = getSession();
    if (!user) return 0;

    const pts = JSON.parse(localStorage.getItem(PTS_KEY)) || {};
    return pts[user.id] ?? 0;
  },

  addPTS(amount) {
    const user = getSession();
    if (!user) return 0;

    const pts = JSON.parse(localStorage.getItem(PTS_KEY)) || {};
    pts[user.id] = (pts[user.id] || 0) + amount;

    localStorage.setItem(PTS_KEY, JSON.stringify(pts));
    window.dispatchEvent(new Event("ptsUpdated"));

    return pts[user.id];
  },

  setPTS(amount) {
    const user = getSession();
    if (!user) return 0;

    const pts = JSON.parse(localStorage.getItem(PTS_KEY)) || {};
    pts[user.id] = amount;

    localStorage.setItem(PTS_KEY, JSON.stringify(pts));
    window.dispatchEvent(new Event("ptsUpdated"));

    return pts[user.id];
  }
};