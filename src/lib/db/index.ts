import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { initializeDatabase } from "./schema";

let instance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (instance) return instance;

  const dbPath = process.env.DATABASE_PATH || "./data/pingmart.db";
  const dir = path.dirname(dbPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  instance = new Database(dbPath);
  instance.pragma("journal_mode = WAL");
  instance.pragma("busy_timeout = 5000");
  instance.pragma("synchronous = NORMAL");
  instance.pragma("foreign_keys = ON");

  initializeDatabase(instance);

  return instance;
}
