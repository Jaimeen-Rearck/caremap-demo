import { SQLiteDatabase } from 'expo-sqlite';
import { up as upV1, down as downV1 } from './v1/migration_v1';
import { up as upV2, down as downV2 } from './v2/migration_v2';

export interface Migration {
  up: (db: SQLiteDatabase) => Promise<void>;
  down: (db: SQLiteDatabase) => Promise<void>;
}

export interface MigrationVersion extends Migration {
  version: number;
}

export const migrations: MigrationVersion[] = [
  {
    version: 1,
    up: upV1,
    down: downV1,
  },
  {
    version: 2,
    up: upV2,
    down: downV2,
  },
];

export const getLatestVersion = (): number => {
  return migrations[migrations.length - 1].version;
};

export const getMigrationPath = (
  currentVersion: number,
  targetVersion: number
): MigrationVersion[] => {
  if (currentVersion === targetVersion) return [];

  const isUpgrade = targetVersion > currentVersion;
  const relevantMigrations = migrations
    .filter((m) => {
      if (isUpgrade) {
        return m.version > currentVersion && m.version <= targetVersion;
      } else {
        return m.version <= currentVersion && m.version > targetVersion;
      }
    })
    .sort((a, b) => (isUpgrade ? a.version - b.version : b.version - a.version));

  return relevantMigrations;
}; 