import { logger } from "@/services/logging/logger";
import { SQLiteDatabase } from "expo-sqlite";

export const up = async (db: SQLiteDatabase) => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      picture TEXT
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      age INTEGER,
      relationship TEXT,
      weight REAL,
      height REAL,
      gender TEXT,
      birthdate TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  logger.debug(`Tables created.`);
};

export const down = async (db: SQLiteDatabase) => {
  await db.execAsync(`
    DROP TABLE IF EXISTS patients;
    DROP TABLE IF EXISTS users;
  `);

  logger.debug('V1 migration reverted successfully');
};