import { tables } from "@/services/database/migrations/v1/schema_v1";
import trackData from "@/services/database/seeds/v1/track_seed.json";
import { logger } from "@/services/logging/logger";
import { SQLiteDatabase } from "expo-sqlite";

// Destructure arrays from JSON
const {
    sampleTrackCategories,
    sampleTrackItems,
    sampleQuestions,
    sampleResponseOptions,
} = trackData as any;

// To escape single quotes in SQL strings to prevent SQL injection
const escapeSQL = (str: string | undefined) => (str || '').replace(/'/g, "''");

export async function seedTrackDatabase(db: SQLiteDatabase) {
    try {
        // Insert track categories
        for (const category of sampleTrackCategories) {
            if (!category.name) continue;
            await db.execAsync(
                `INSERT INTO ${tables.TRACK_CATEGORY} (
                    name,
                    created_date,
                    updated_date
                ) VALUES (
                    '${escapeSQL(category.name)}',
                    '${new Date().toISOString()}',
                    '${new Date().toISOString()}'
                )`
            );
        }

        // Insert track items
        for (const item of sampleTrackItems) {
            if (!item.category_id || !item.name) continue;
            await db.execAsync(
                `INSERT INTO ${tables.TRACK_ITEM} (
                    category_id,
                    name,
                    created_date,
                    updated_date
                ) VALUES (
                    ${item.category_id},
                    '${escapeSQL(item.name)}',
                    '${new Date().toISOString()}',
                    '${new Date().toISOString()}'
                )`
            );
        }

        // Insert questions
        for (const question of sampleQuestions) {
            if (!question.item_id || !question.text || !question.type) continue;
            await db.execAsync(
                `INSERT INTO ${tables.QUESTION} (
                    item_id,
                    text,
                    type,
                    instructions,
                    required,
                    summary_template,
                    created_date,
                    updated_date
                ) VALUES (
                    ${question.item_id},
                    '${escapeSQL(question.text)}',
                    '${escapeSQL(question.type)}',
                    NULL,
                    ${question.required ? 1 : 0},
                    '${escapeSQL(question.summary_template)}',
                    '${new Date().toISOString()}',
                    '${new Date().toISOString()}'
                )`
            );
        }

        // Insert response options
        for (const option of sampleResponseOptions) {
            if (!option.question_id || !option.text) continue;
            await db.execAsync(
                `INSERT INTO ${tables.RESPONSE_OPTION} (
                    question_id,
                    text,
                    created_date,
                    updated_date
                ) VALUES (
                    ${option.question_id},
                    '${escapeSQL(option.text)}',
                    '${new Date().toISOString()}',
                    '${new Date().toISOString()}'
                )`
            );
        }

        logger.debug('Track sample data seeded successfully.');
    } catch (error) {
        logger.debug('Error seeding track data:', error);
    }
}; 