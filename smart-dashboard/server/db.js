import fs from "fs";

const DB_PATH = "./server/db.json";

// чтение базы
export function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

// запись базы
export function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// генератор ID
export function generateId() {
  return "id_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}