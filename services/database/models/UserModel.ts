import { SQLiteDatabase } from 'expo-sqlite';
import { BaseModel } from '../BaseModel';
import { User, Schema } from '../version_manager';
import { logger } from '../../logging/logger';

export class UserModel extends BaseModel<typeof User> {
  constructor(db: SQLiteDatabase) {
    super(db, Schema.tables.USER);
  }

  async getUser(email: string): Promise<typeof User | null> {
    const result = await this.db.getFirstAsync<typeof User>(
      `SELECT * FROM ${Schema.tables.USER} WHERE email = ?`,
      [email]
    );
    logger.debug('User query result:', result);
    return result;
  }
}