import * as SQLite from 'expo-sqlite'
import { migration001 } from './migrations/001_initial'
import { migration002 } from './migrations/002_grocery_is_purchased'

let db: SQLite.SQLiteDatabase | null = null

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('nutriassistant.db')
    await db.execAsync('PRAGMA journal_mode = WAL;')
    await db.execAsync('PRAGMA foreign_keys = ON;')
  }
  return db
}

export async function runMigrations(): Promise<void> {
  const database = await getDatabase()

  // Track which migrations have run
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      run_at TEXT NOT NULL
    );
  `)

  let ran: { name: string }[] = []
  try {
    ran = await database.getAllAsync<{ name: string }>('SELECT name FROM migrations')
  } catch {
    // Stale migrations table from a previous dev session — reset it
    console.warn('[DB] Stale migrations table detected, resetting')
    await database.execAsync('DROP TABLE IF EXISTS migrations')
    await database.execAsync(`
      CREATE TABLE migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        run_at TEXT NOT NULL
      );
    `)
    ran = []
  }
  const ranNames = new Set(ran.map((r) => r.name))

  if (!ranNames.has('001_initial')) {
    await database.execAsync(migration001)
    await database.runAsync(
      'INSERT INTO migrations (name, run_at) VALUES (?, ?)',
      ['001_initial', new Date().toISOString()]
    )
    console.log('[DB] Migration 001_initial completed')
  }

  if (!ranNames.has('002_grocery_is_purchased')) {
    try {
      await database.execAsync(migration002)
    } catch {
      // Column may already exist on fresh installs — safe to ignore
    }
    await database.runAsync(
      'INSERT INTO migrations (name, run_at) VALUES (?, ?)',
      ['002_grocery_is_purchased', new Date().toISOString()]
    )
    console.log('[DB] Migration 002_grocery_is_purchased completed')
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync()
    db = null
  }
}
