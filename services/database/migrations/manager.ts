import { SQLiteDatabase } from 'expo-sqlite';
import { getMigrationPath, getLatestVersion } from './index';
import { logger } from '@/services/logging/logger';

interface UserVersion {
  user_version: number;
}

export class MigrationManager {
  private db: SQLiteDatabase;

  constructor(db: SQLiteDatabase) {
    this.db = db;
  }

  private async getCurrentVersion(): Promise<number> {
    try {
      const result = await this.db.getAllAsync<UserVersion>('PRAGMA user_version;');
      return result[0]?.user_version ?? 0;
    } catch (error) {
      console.error('Error getting current version:', error);
      throw error;
    }
  }

  private async setVersion(version: number): Promise<void> {
    try {
      await this.db.runAsync(`PRAGMA user_version = ${version};`);
    } catch (error) {
      console.error('Error setting version:', error);
      throw error;
    }
  }

  async migrate(targetVersion?: number): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const finalVersion = targetVersion ?? getLatestVersion();

    if (currentVersion === finalVersion) {
      logger.debug('Database is already at the target version:', finalVersion);
      return;
    }

    logger.debug(`Migrating database from version ${currentVersion} to ${finalVersion}`);
    const migrationPath = getMigrationPath(currentVersion, finalVersion);

    for (const migration of migrationPath) {
      logger.debug(`Running ${finalVersion > currentVersion ? 'up' : 'down'} migration for version ${migration.version}`);
      
      if (finalVersion > currentVersion) {
        await migration.up(this.db);
      } else {
        await migration.down(this.db);
      }

      await this.setVersion(migration.version);
      logger.debug(`Successfully migrated to version ${migration.version}`);
    }

    logger.debug('Migration completed successfully');
  }
} 