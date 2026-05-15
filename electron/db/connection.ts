import { app } from 'electron';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { SCHEMA_SQL } from './schema';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

export function initDatabase(): Database.Database {
  if (db) return db;

  const userDataDir = app.getPath('userData');
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

  const dbPath = path.join(userDataDir, 'lottery.db');
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  // Run schema (idempotent — all CREATE IF NOT EXISTS)
  db.exec(SCHEMA_SQL);

  console.log(`[db] Initialized at ${dbPath}`);
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('[db] Closed');
  }
}
