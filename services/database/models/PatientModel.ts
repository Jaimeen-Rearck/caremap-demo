import { SQLiteDatabase } from 'expo-sqlite';
import { BaseModel } from '../BaseModel';
import { Patient, Schema } from '../version_manager';
import { logger } from '../../logging/logger';

export class PatientModel extends BaseModel<typeof Patient> {
  constructor(db: SQLiteDatabase) {
    super(db, Schema.tables.PATIENT);
  }

  async getPatientByUserId(userId: string): Promise<typeof Patient | null> {
    const result = await this.db.getFirstAsync<typeof Patient>(
      `SELECT * FROM ${Schema.tables.PATIENT} WHERE user_id = ?`,
      [userId]
    );
    logger.debug('Patient query result:', result);
    return result;
  }

  async insert(data: Partial<typeof Patient>): Promise<void> {
    // Handle both v1 and v2 schema fields
    const insertData = { ...data };
    if (data.first_name && data.last_name) {
      // If using v2 schema fields, combine them for v1 compatibility
      insertData.name = `${data.first_name} ${data.last_name}`;
    }
    
    const keys = Object.keys(insertData);
    const values = Object.values(insertData);
    const placeholders = keys.map(() => '?').join(',');
    
    const sql = `INSERT INTO ${this.tableName} (${keys.join(',')}) VALUES (${placeholders})`;
    logger.debug('Insert SQL:', sql);
    logger.debug('Insert values:', values);
    
    await this.run(sql, values);
  }
}


