import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';

const DB_NAME = 'runtracker.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Shared, lazily-opened connection. Safe to call from the UI and from the background task. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await db.execAsync(CREATE_TABLES_SQL);
      return db;
    });
  }
  return dbPromise;
}
