import { SQLiteDatabase } from "expo-sqlite";
import { tables } from "./schema_v2";
import { logger } from "@/services/logging/logger";

async function addColumnIfNotExists(db: SQLiteDatabase, table: string, column: string, type: string) {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table});`);
  if (!columns.some(col => col.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`);
  }
}

export const up = async (db: SQLiteDatabase) => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${tables.USER} (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      picture TEXT,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ${tables.PATIENT} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      birthdate TEXT,
      gender TEXT,
      phone TEXT,
      address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES ${tables.USER}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.PATIENT_SNAPSHOT} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      summary TEXT,
      health_issues TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES ${tables.PATIENT}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.MEDICAL_CONDITION} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      condition_name TEXT NOT NULL,
      source TEXT,
      diagnosed_date TEXT,
      notes TEXT,
      FOREIGN KEY (patient_id) REFERENCES ${tables.PATIENT}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.MEDICAL_EQUIPMENT} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      equipment_name TEXT NOT NULL,
      usage_description TEXT,
      is_daily_use INTEGER NOT NULL DEFAULT 0,
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES ${tables.PATIENT}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.HIGH_LEVEL_GOAL} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      goal_title TEXT NOT NULL,
      description TEXT,
      target_date TEXT,
      source TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES ${tables.PATIENT}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.GOAL_PROGRESS} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      note TEXT,
      FOREIGN KEY (goal_id) REFERENCES ${tables.HIGH_LEVEL_GOAL}(id) ON DELETE CASCADE
    );
  `);

  await addColumnIfNotExists(db, tables.USER, 'password_hash', 'TEXT');
  await addColumnIfNotExists(db, tables.USER, 'created_at', "TEXT DEFAULT (datetime('now'))");
  await addColumnIfNotExists(db, tables.PATIENT, 'first_name', 'TEXT');
  await addColumnIfNotExists(db, tables.PATIENT, 'last_name', 'TEXT');
  await addColumnIfNotExists(db, tables.PATIENT, 'phone', 'TEXT');
  await addColumnIfNotExists(db, tables.PATIENT, 'address', 'TEXT');
  await addColumnIfNotExists(db, tables.PATIENT, 'created_at', "TEXT DEFAULT (datetime('now'))");

  logger.debug('V2 migration completed successfully');
};

export const down = async (db: SQLiteDatabase) => {
  const patientColumns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tables.PATIENT});`);
  const hasFirstName = patientColumns.some(col => col.name === 'first_name');
  const hasLastName = patientColumns.some(col => col.name === 'last_name');

   
  let patientBackupSelect = `
    SELECT 
      p.id,
      p.user_id,
      ${hasFirstName && hasLastName
        ? `p.first_name || ' ' || p.last_name`
        : `p.name`} AS name,
      NULL as age,
      NULL as relationship,
      NULL as weight,
      NULL as height,
      p.gender,
      p.birthdate
    FROM ${tables.PATIENT} p
  `;

  await db.execAsync(`
    CREATE TEMPORARY TABLE user_backup AS
    SELECT id, email, name, picture FROM ${tables.USER};
  `);

  await db.execAsync(`CREATE TEMPORARY TABLE patient_backup AS ${patientBackupSelect};`);
 
  await db.execAsync(`
    DROP TABLE IF EXISTS ${tables.GOAL_PROGRESS};
    DROP TABLE IF EXISTS ${tables.HIGH_LEVEL_GOAL};
    DROP TABLE IF EXISTS ${tables.MEDICAL_EQUIPMENT};
    DROP TABLE IF EXISTS ${tables.MEDICAL_CONDITION};
    DROP TABLE IF EXISTS ${tables.PATIENT_SNAPSHOT};
    DROP TABLE IF EXISTS ${tables.PATIENT};
    DROP TABLE IF EXISTS ${tables.USER};

    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      picture TEXT
    );

    CREATE TABLE patients (
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

    INSERT INTO users (id, email, name, picture)
    SELECT id, email, name, picture FROM user_backup;

    INSERT INTO patients (user_id, name, age, relationship, weight, height, gender, birthdate)
    SELECT user_id, name, age, relationship, weight, height, gender, birthdate FROM patient_backup;

    DROP TABLE IF EXISTS user_backup;
    DROP TABLE IF EXISTS patient_backup;
  `);

  logger.debug('V2 migration reverted successfully');
};
