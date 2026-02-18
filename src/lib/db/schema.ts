import type Database from "better-sqlite3";

export function initializeDatabase(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      domain TEXT NOT NULL,
      tld TEXT NOT NULL,
      chain TEXT NOT NULL DEFAULT 'ethereum',
      years INTEGER NOT NULL DEFAULT 1,
      price_usd REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
      pingpay_session_id TEXT,
      pingpay_payment_id TEXT,
      payment_amount REAL,
      owner_address TEXT,
      registration_error TEXT,
      registration_tx TEXT,
      swap_tx TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      paid_at TEXT,
      registered_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_domain ON orders(domain);
    CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(pingpay_session_id);

    CREATE TABLE IF NOT EXISTS order_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL REFERENCES orders(id),
      event_type TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id);
  `);
}
