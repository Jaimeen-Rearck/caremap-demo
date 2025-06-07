import { SQLiteDatabase } from 'expo-sqlite';
import { MigrationManager } from './migrations/manager';

class DatabaseService {
  private static instance: DatabaseService;
  private db?: SQLiteDatabase;
  private migrationManager?: MigrationManager;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public setDatabase(db: SQLiteDatabase): void {
    this.db = db;
    this.migrationManager = new MigrationManager(db);
  }

  public getDatabase(): SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call setDatabase first.');
    }
    return this.db;
  }

  public async initialize(): Promise<void> {
    if (!this.migrationManager) {
      throw new Error('Database not initialized. Call setDatabase first.');
    }

    try {
      await this.migrationManager.migrate();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  public async migrateToVersion(version: number): Promise<void> {
    if (!this.migrationManager) {
      throw new Error('Database not initialized. Call setDatabase first.');
    }

    try {
      await this.migrationManager.migrate(version);
    } catch (error) {
      console.error(`Failed to migrate to version ${version}:`, error);
      throw error;
    }
  }
}

// Current database version
export const DB_VERSION = 2;

// Database configuration
export const DB_CONFIG = {
  name: 'caremap.db',
  version: DB_VERSION,  
};

export default DatabaseService;