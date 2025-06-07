import { SQLiteDatabase } from 'expo-sqlite';
import { logger } from '../logging/logger';

export abstract class BaseModel<T> {

    protected db: SQLiteDatabase;
    protected tableName: string;

    constructor(db: SQLiteDatabase, tableName: string) {
        this.db = db;
        this.tableName = tableName;
    }

    // Wrapper method to run any SQL query safely inside a transaction using prepared statements
    protected async run(sql: string, params: any[] = []) {
        logger.debug("SQL: ", sql);
        logger.debug("Params: ", params);
        let result: any;
        await this.db.withTransactionAsync(async () => {
            const stmt = await this.db.prepareAsync(sql);
            try {
                result = await stmt.executeAsync(...params); // store the result
            } finally {
                await stmt.finalizeAsync(); // always finalize the statement
            }
        });

        return result;
    }

    async getAll(): Promise<T[]> {
        const sql = `SELECT * FROM ${this.tableName};`;
        console.log("SQL: ", sql);
        const result = await this.db.getAllAsync<T>(sql);
        console.log("Result: ", result.toString());
        return result;
    }

    async getByFields(fields: Partial<T>): Promise<T[]> {
        const keys = Object.keys(fields);
        const values = Object.values(fields);
        if (keys.length === 0) return [];
        const conditions = keys.map((key) => `${key} = ?`).join(' AND ');
        const sql = `SELECT * FROM ${this.tableName} WHERE ${conditions}`;
        const result = await this.run(sql, values);
        return result;
    }

    async insert(data: Partial<T>): Promise<void> {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(',');
        console.log(`Data: `, data);

        const sql = `INSERT INTO ${this.tableName} (${keys.join(',')}) VALUES (${placeholders})`;
        await this.run(sql, values);
    }

    async insertAll(data: Partial<T>[]): Promise<void> {
        if (data.length === 0) return;

        const keys = Object.keys(data[0]);
        const placeholders = `(${keys.map(() => '?').join(',')})`;
        const allPlaceholders = data.map(() => placeholders).join(', ');
        const values = data.flatMap(row => keys.map(key => row[key as keyof T]));

        const sql = `INSERT INTO ${this.tableName} (${keys.join(',')}) VALUES ${allPlaceholders};`;
        await this.run(sql, values);
    }

    async updateByFields(
        data: Partial<T>,         // fields to update
        conditions: Partial<T>    // where clause conditions
    ): Promise<void> {
        const setKeys = Object.keys(data);
        const setValues = Object.values(data);
        const setClause = setKeys.map(key => `${key} = ?`).join(', ');

        const whereKeys = Object.keys(conditions);
        const whereValues = Object.values(conditions);
        const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');

        const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${whereClause}`;
        const values = [...setValues, ...whereValues];

        await this.run(sql, values);
    }

    async deleteByFields(where: Partial<T>): Promise<void> {
        const keys = Object.keys(where);
        const values = Object.values(where);

        if (keys.length === 0) return;

        const whereClause = keys.map((key) => `${key} = ?`).join(' AND ');
        const sql = `DELETE FROM ${this.tableName} WHERE ${whereClause}`;

        await this.run(sql, values);
    }

}