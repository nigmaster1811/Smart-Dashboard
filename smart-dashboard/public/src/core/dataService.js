import { cacheService } from './cacheService.js';

const DB_KEY = 'smart-dashboard-db-v1';

function uid(prefix = 'id') {
  return `${prefix}_${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function nowISO() {
  return new Date().toISOString();
}

function loadDb() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY)) ?? { users: {} };
  } catch {
    return { users: {} };
  }
}

function saveDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function ensureUserState(db, userId) {
  if (!db.users[userId]) {
    db.users[userId] = {
      profile: {
        totalPoints: 0,
        level: 1,
        badges: [],
        lastActive: nowISO()
      },
      tasks: [],
      notes: [],
      activityLog: []
    };
  }
  return db.users[userId];
}

function pointsToLevel(points) {
  return Math.max(1, Math.floor(points / 100) + 1);
}

function badgeList(state) {
  const badges = [];
  if (state.profile.totalPoints >= 20) badges.push('Первый шаг');
  if (state.profile.totalPoints >= 100) badges.push('Серия успеха');
  if (state.tasks.filter((t) => t.status === 'done').length >= 5) badges.push('Пять побед');
  if (state.tasks.some((t) => (t.streak || 0) >= 3)) badges.push('Стрик 3');
  if (state.notes.length >= 5) badges.push('Мыслитель');
  return [...new Set(badges)];
}

function addLog(state, action, pointsEarned = 0, meta = {}) {
  state.activityLog.unshift({
    id: uid('log'),
    action,
    pointsEarned,
    timestamp: nowISO(),
    meta
  });
  state.activityLog = state.activityLog.slice(0, 100);
}

function updateProfile(state) {
  state.profile.totalPoints = Number(state.profile.totalPoints || 0);
  state.profile.level = pointsToLevel(state.profile.totalPoints);
  state.profile.badges = badgeList(state);
  state.profile.lastActive = nowISO();
}

function taskPointsByType(type) {
  switch (type) {
    case 'health':
      return 12;
    case 'home':
      return 8;
    default:
      return 10;
  }
}

function streakUpdate(task, status, date) {
  if (!task.history) task.history = [];
  task.history.unshift({ status, date });
  task.history = task.history.slice(0, 30);

  if (status === 'done') {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.toISOString().slice(0, 10);

    const lastDone = task.history.find((h) => h.status === 'done' && h.date !== date);
    if (lastDone && lastDone.date === y) {
      task.streak = (task.streak || 0) + 1;
    } else {
      task.streak = Math.max(1, task.streak || 1);
    }
  }

  if (status === 'missed') {
    task.streak = 0;
  }
}

function getState(userId) {
  const db = loadDb();
  return ensureUserState(db, userId);
}

function persistState(userId, state) {
  const db = loadDb();
  db.users[userId] = state;
  saveDb(db);
  cacheService.set(`snapshot:${userId}`, state);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export const dataService = {
  getProfile(userId) {
    const state = getState(userId);
    updateProfile(state);
    persistState(userId, state);
    return clone(state.profile);
  },

  getTasks(userId) {
    const state = getState(userId);
    return clone(state.tasks.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)));
  },

  getNotes(userId) {
    const state = getState(userId);
    return clone(state.notes.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)));
  },

  getActivityLog(userId) {
    const state = getState(userId);
    return clone(state.activityLog);
  },

  createTask(userId, payload) {
    const state = getState(userId);
    const task = {
      id: uid('task'),
      userId,
      title: String(payload.title || '').trim(),
      type: payload.type || 'custom',
      status: payload.status || 'todo',
      date: payload.date || todayISO(),
      points: Number(payload.points ?? taskPointsByType(payload.type || 'custom')),
      streak: 0,
      history: [],
      createdAt: nowISO(),
      updatedAt: nowISO()
    };

    if (!task.title) return { ok: false, error: 'Название задачи обязательно.' };

    state.tasks.unshift(task);
    addLog(state, 'task_created', 0, { taskId: task.id, title: task.title });
    updateProfile(state);
    persistState(userId, state);
    return { ok: true, task: clone(task) };
  },

  updateTask(userId, taskId, patch) {
    const state = getState(userId);
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return { ok: false, error: 'Задача не найдена.' };

    task.title = patch.title !== undefined ? String(patch.title).trim() : task.title;
    task.type = patch.type !== undefined ? patch.type : task.type;
    task.date = patch.date !== undefined ? patch.date : task.date;
    task.status = patch.status !== undefined ? patch.status : task.status;
    task.points = patch.points !== undefined ? Number(patch.points) : task.points;
    task.updatedAt = nowISO();

    if (!task.title) return { ok: false, error: 'Название задачи не может быть пустым.' };

    addLog(state, 'task_updated', 0, { taskId: task.id });
    updateProfile(state);
    persistState(userId, state);
    return { ok: true, task: clone(task) };
  },

  deleteTask(userId, taskId) {
    const state = getState(userId);
    const before = state.tasks.length;
    state.tasks = state.tasks.filter((t) => t.id !== taskId);

    if (state.tasks.length === before) return { ok: false, error: 'Задача не найдена.' };

    addLog(state, 'task_deleted', 0, { taskId });
    updateProfile(state);
    persistState(userId, state);
    return { ok: true };
  },

  setTaskStatus(userId, taskId, status) {
    const state = getState(userId);
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return { ok: false, error: 'Задача не найдена.' };

    const prev = task.status;
    task.status = status;
    task.updatedAt = nowISO();

    streakUpdate(task, status, todayISO());

    let earned = 0;
    if (status === 'done' && prev !== 'done') {
      earned = task.points || taskPointsByType(task.type);
      state.profile.totalPoints += earned;
    }

    if (status === 'missed' && prev === 'done') {
      state.profile.totalPoints = Math.max(0, state.profile.totalPoints - Math.round((task.points || 10) / 2));
    }

    addLog(state, 'task_status_changed', earned, { taskId, status });
    updateProfile(state);
    persistState(userId, state);
    return { ok: true, task: clone(task), earned };
  },

  createNote(userId, payload) {
    const state = getState(userId);
    const content = String(payload.content || '').trim();

    if (!content) return { ok: false, error: 'Текст заметки обязателен.' };

    const note = {
      id: uid('note'),
      userId,
      content,
      type: payload.type || 'text',
      date: payload.date || todayISO(),
      points: Number(payload.points ?? 3),
      createdAt: nowISO(),
      updatedAt: nowISO()
    };

    state.notes.unshift(note);
    state.profile.totalPoints += note.points;
    addLog(state, 'note_created', note.points, { noteId: note.id });
    updateProfile(state);
    persistState(userId, state);

    return { ok: true, note: clone(note) };
  },

  updateNote(userId, noteId, patch) {
    const state = getState(userId);
    const note = state.notes.find((n) => n.id === noteId);
    if (!note) return { ok: false, error: 'Заметка не найдена.' };

    if (patch.content !== undefined) {
      const content = String(patch.content).trim();
      if (!content) return { ok: false, error: 'Заметка не может быть пустой.' };
      note.content = content;
    }

    note.type = patch.type !== undefined ? patch.type : note.type;
    note.updatedAt = nowISO();

    addLog(state, 'note_updated', 0, { noteId });
    updateProfile(state);
    persistState(userId, state);
    return { ok: true, note: clone(note) };
  },

  deleteNote(userId, noteId) {
    const state = getState(userId);
    const index = state.notes.findIndex((n) => n.id === noteId);
    if (index === -1) return { ok: false, error: 'Заметка не найдена.' };

    const removed = state.notes[index];
    state.notes.splice(index, 1);

    addLog(state, 'note_deleted', 0, { noteId });
    updateProfile(state);
    persistState(userId, state);
    return { ok: true, note: clone(removed) };
  },

  getDashboard(userId) {
    const state = getState(userId);
    updateProfile(state);
    persistState(userId, state);

    const tasks = state.tasks;
    const notes = state.notes;
    const done = tasks.filter((t) => t.status === 'done').length;
    const missed = tasks.filter((t) => t.status === 'missed').length;
    const todo = tasks.filter((t) => t.status === 'todo').length;

    const byType = tasks.reduce(
      (acc, task) => {
        acc[task.type] = (acc[task.type] || 0) + 1;
        return acc;
      },
      { home: 0, health: 0, custom: 0 }
    );

    const byStatus = { done, missed, todo };

    const recentLogs = clone(state.activityLog.slice(0, 8));

    return {
      profile: clone(state.profile),
      tasksCount: tasks.length,
      notesCount: notes.length,
      completedTasks: done,
      missedTasks: missed,
      todoTasks: todo,
      tasksByType: byType,
      tasksByStatus: byStatus,
      recentLogs,
      bestStreak: tasks.reduce((max, t) => Math.max(max, t.streak || 0), 0)
    };
  }
};