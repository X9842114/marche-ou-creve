import { createClient, type Client } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

const globalForDb = globalThis as unknown as {
  __mocDb?: Client;
  __mocDbReady?: Promise<void>;
};

function resolveDbUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const file = path.join(dataDir, "marche-ou-creve.db");
  return `file:${file}`;
}

export function getDb(): Client {
  if (!globalForDb.__mocDb) {
    globalForDb.__mocDb = createClient({ url: resolveDbUrl() });
  }
  return globalForDb.__mocDb;
}

async function migrate(db: Client) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      mode TEXT NOT NULL DEFAULT 'inscription',
      updated_at TEXT NOT NULL,
      mixer_at TEXT,
      show_drawn INTEGER NOT NULL DEFAULT 0,
      revision INTEGER NOT NULL DEFAULT 1
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      matricule TEXT NOT NULL UNIQUE,
      id_unique TEXT NOT NULL UNIQUE,
      district TEXT NOT NULL,
      registered_at TEXT NOT NULL,
      selected INTEGER NOT NULL DEFAULT 0,
      warnings INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'en_course'
    )
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_participants_district
    ON participants(district)
  `);

  // Migration douce si ancienne table sans revision
  try {
    await db.execute(
      `ALTER TABLE settings ADD COLUMN revision INTEGER NOT NULL DEFAULT 1`
    );
  } catch {
    // colonne déjà présente
  }

  const existing = await db.execute(`SELECT id FROM settings WHERE id = 1`);
  if (existing.rows.length === 0) {
    await db.execute({
      sql: `INSERT INTO settings (id, mode, updated_at, mixer_at, show_drawn, revision)
            VALUES (1, 'inscription', ?, NULL, 0, 1)`,
      args: [new Date().toISOString()],
    });
  }
}

export async function ensureDb(): Promise<Client> {
  const db = getDb();
  if (!globalForDb.__mocDbReady) {
    globalForDb.__mocDbReady = migrate(db);
  }
  await globalForDb.__mocDbReady;
  return db;
}

export async function bumpRevision(db: Client): Promise<number> {
  await db.execute({
    sql: `UPDATE settings SET revision = revision + 1, updated_at = ? WHERE id = 1`,
    args: [new Date().toISOString()],
  });
  const res = await db.execute(`SELECT revision FROM settings WHERE id = 1`);
  return Number(res.rows[0]?.revision ?? 1);
}
