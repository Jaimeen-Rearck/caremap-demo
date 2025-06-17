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
      const isUpgrade = finalVersion > currentVersion;
      logger.debug(`Running ${isUpgrade ? 'up' : 'down'} migration for version ${migration.version}`);
      
      if (isUpgrade) {
        await migration.up(this.db);
        await this.setVersion(migration.version);
      } else {
        await migration.down(this.db);
        // For downgrades, set the version to the previous version
        const targetVersionForStep = migration.version - 1;
        await this.setVersion(targetVersionForStep);
      }
      
      logger.debug(`Successfully migrated ${isUpgrade ? 'to' : 'from'} version ${migration.version}`);
    }
    const versionAfterMigration = await this.getCurrentVersion();
    logger.debug(`Current database version: ${versionAfterMigration}`);

    // Ensure we're at the correct final version
    await this.setVersion(finalVersion);
    logger.debug('Migration completed successfully');
  }
}