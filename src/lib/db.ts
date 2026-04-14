import { createClient } from "@libsql/client";
import type { InStatement, TransactionMode } from "@libsql/client";

const syncUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

// On Vercel, the file system is read-only except for /tmp.
// However, an embedded replica in a serverless function is destroyed on every cold start.
// It's much safer to just connect directly to the remote Turso database if it exists,
// or use a temporary local file for development.

const client = syncUrl && authToken
  ? createClient({
      url: syncUrl,
      authToken: authToken,
    })
  : createClient({
      url: "file:/tmp/tuitiontracker.db",
    });

let initialized = false;

export async function execute(statement: InStatement) {
  return client.execute(statement);
}

export async function batch(statements: InStatement[], mode: TransactionMode = "write") {
  return client.batch(statements, mode);
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
  // Remote DB doesn't need explicit sync calls in serverless mode.
  // If we were using an embedded replica on a long-running server, we would sync here.
  return;
}