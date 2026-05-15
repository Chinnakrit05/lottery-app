// Schema as an inline string so it gets bundled by tsc (no need to copy .sql)
// Kept in sync with electron/db/schema.sql for reference.

export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS rounds (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL,
  draw_date       TEXT,
  status          TEXT    NOT NULL DEFAULT 'open',
  rate_2_top      REAL    NOT NULL DEFAULT 70,
  rate_2_bottom   REAL    NOT NULL DEFAULT 70,
  rate_3_top      REAL    NOT NULL DEFAULT 500,
  rate_3_tod      REAL    NOT NULL DEFAULT 100,
  deduct_percent  REAL    NOT NULL DEFAULT 30,
  win_2_top       TEXT,
  win_2_bottom    TEXT,
  win_3_top       TEXT,
  win_3_top2      TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  phone       TEXT,
  note        TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

CREATE TABLE IF NOT EXISTS tickets (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id     INTEGER NOT NULL,
  customer_id  INTEGER,
  number       TEXT    NOT NULL,
  bet_type     TEXT    NOT NULL CHECK (bet_type IN ('2_top','2_bottom','3_top','3_tod')),
  price        REAL    NOT NULL CHECK (price > 0),
  buyer_name   TEXT,
  note         TEXT,
  is_reverse   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tickets_round ON tickets(round_id);
CREATE INDEX IF NOT EXISTS idx_tickets_customer ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(number, bet_type);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(round_id, created_at DESC);

CREATE TRIGGER IF NOT EXISTS set_updated_at_rounds
AFTER UPDATE ON rounds
FOR EACH ROW
BEGIN
  UPDATE rounds SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS set_updated_at_customers
AFTER UPDATE ON customers
FOR EACH ROW
BEGIN
  UPDATE customers SET updated_at = datetime('now') WHERE id = NEW.id;
END;
`;
