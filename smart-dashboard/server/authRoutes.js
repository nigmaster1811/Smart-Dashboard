import express from "express";
import { readDB, writeDB, generateId } from "./db.js";

const router = express.Router();

/**
 * Нормализация email
 */
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * REGISTER
 */
router.post("/register", (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Заполните все поля" });
  }

  const db = readDB();
  const users = db.users;

  const safeEmail = normalizeEmail(email);

  const existingUser = users.find(
    (u) => normalizeEmail(u.email) === safeEmail
  );

  if (existingUser) {
    return res.status(400).json({ error: "Пользователь уже существует" });
  }

  const newUser = {
    id: generateId(),
    email: safeEmail,
    name: String(name).trim(),
    password, // (в учебном проекте без хеширования)
    totalPoints: 0
  };

  users.push(newUser);
  writeDB(db);

  return res.json({
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      totalPoints: newUser.totalPoints
    }
  });
});

/**
 * LOGIN
 */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Введите email и пароль" });
  }

  const db = readDB();
  const users = db.users;

  const safeEmail = normalizeEmail(email);

  const user = users.find(
    (u) =>
      normalizeEmail(u.email) === safeEmail &&
      u.password === password
  );

  if (!user) {
    return res.status(400).json({ error: "Неверный email или пароль" });
  }

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      totalPoints: user.totalPoints
    }
  });
});

/**
 * GET CURRENT USER (для будущего tracker + session restore)
 */
router.get("/user/:id", (req, res) => {
  const db = readDB();

  const user = db.users.find((u) => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    totalPoints: user.totalPoints
  });
});

export default router;