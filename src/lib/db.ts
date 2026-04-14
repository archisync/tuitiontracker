import { createClient } from "@libsql/client";
import type { InStatement, TransactionMode } from "@libsql/client";
import { mkdirSync } from "node:fs";

mkdirSync(".data", { recursive: true });

const localUrl = "file:./.data/tuitiontracker.db";
const syncUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const localClient = createClient({ url: localUrl });

const replicaSyncClient = (() => {
  if (!syncUrl) {
    return null;
  }

  try {
    return createClient({
      url: localUrl,
      syncUrl,
      authToken,
    });
  } catch {
    return null;
  }
})();

let initialized = false;

export async function execute(statement: InStatement) {
  return localClient.execute(statement);
}

export async function batch(statements: InStatement[], mode: TransactionMode = "write") {
  return localClient.batch(statements, mode);
}

export async function ensureSchema() {
  if (initialized) {
    return;
  }

  await batch(
    [
      "PRAGMA foreign_keys = ON;",
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        student_count INTEGER NOT NULL DEFAULT 1,
        student1 TEXT NOT NULL DEFAULT 'Student 1',
        student2 TEXT NOT NULL DEFAULT 'Student 2',
        student3 TEXT NOT NULL DEFAULT 'Student 3'
      );`,
      "INSERT OR IGNORE INTO settings (id) VALUES (1);",
      `CREATE TABLE IF NOT EXISTS months (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        label TEXT NOT NULL,
        UNIQUE(year, month)
      );`,
      `CREATE TABLE IF NOT EXISTS days (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
        date_iso TEXT NOT NULL,
        day_name TEXT NOT NULL,
        UNIQUE(month_id, date_iso)
      );`,
      `CREATE TABLE IF NOT EXISTS cycles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_index INTEGER NOT NULL,
        student_name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        payment_given INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS class_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
        student_index INTEGER NOT NULL,
        student_name TEXT NOT NULL,
        date_iso TEXT NOT NULL,
        day_name TEXT NOT NULL,
        archived_cycle_id INTEGER REFERENCES cycles(id),
        UNIQUE(day_id, student_index)
      );`,
      `CREATE TABLE IF NOT EXISTS cycle_classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cycle_id INTEGER NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
        class_number INTEGER NOT NULL,
        date_iso TEXT NOT NULL,
        day_name TEXT NOT NULL,
        student_name TEXT NOT NULL
      );`,
    ].map((sql) => ({ sql })),
    "write",
  );

  initialized = true;
}

export function triggerBackgroundSync() {
  if (!replicaSyncClient) {
    return;
  }

  queueMicrotask(() => {
    replicaSyncClient.sync().catch(() => {
      // Best-effort background sync only.
    });
  });
}
