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

/**
 * If a previous version stored data under a different productName folder
 * (e.g. "LotteryApp" before rename to "Love Number"), migrate it on first launch.
 */
function migrateLegacyData(currentDbPath: string) {
  if (fs.existsSync(currentDbPath)) return; // already have data — nothing to do
  const userDataDir = path.dirname(currentDbPath);
  const parent = path.dirname(userDataDir);
  const legacyNames = ['LotteryApp', 'lottery-app'];
  for (const legacy of legacyNames) {
    const legacyDir = path.join(parent, legacy);
    const legacyDb = path.join(legacyDir, 'lottery.db');
    if (fs.existsSync(legacyDb)) {
      console.log(`[db] Migrating data from legacy folder: ${legacyDir}`);
      try {
        fs.copyFileSync(legacyDb, currentDbPath);
        // Copy WAL/SHM files if present
        for (const suffix of ['-wal', '-shm']) {
          const src = legacyDb + suffix;
          if (fs.existsSync(src)) fs.copyFileSync(src, currentDbPath + suffix);
        }
        console.log('[db] Legacy data migrated successfully');
        return;
      } catch (e) {
        console.error('[db] Legacy migration failed:', e);
      }
    }
  }
}

export function initDatabase(): Database.Database {
  if (db) return db;

  const userDataDir = app.getPath('userData');
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

  const dbPath = path.join(userDataDir, 'lottery.db');

  // Auto-migrate from older productName folder if exists
  migrateLegacyData(dbPath);

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
