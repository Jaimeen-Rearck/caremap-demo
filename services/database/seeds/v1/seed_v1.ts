import { SQLiteDatabase } from "expo-sqlite";
import { tables } from "@/services/database/migrations/v1/schema_v1";
import { 
    samplePatientSnapshots, 
    samplePatientConditions, 
    samplePatientEquipment,
    samplePatientGoals,
    samplePatientEmergencyCare,
    samplePatientAllergies,
    samplePatientMedications,
    samplePatientNotes
} from "@/services/database/seeds/v1/sample_data";
import { logger } from "@/services/logging/logger";

// To escape single quotes in SQL strings to prevent SQL injection
const escapeSQL = (str: string | undefined) => (str || '').replace(/'/g, "''");

export async function seedDatabase(db: SQLiteDatabase) {
    try {
        // Insert patient snapshots
        for (const snapshot of samplePatientSnapshots) {
            if (!snapshot.patient_id) continue;
            await db.execAsync(
                `INSERT INTO ${tables.PATIENT_SNAPSHOT} (
                    patient_id, 
                    patient_overview, 
                    health_issues,
                    created_date,
                    updated_date
                ) VALUES (
                    ${snapshot.patient_id},
                    '${escapeSQL(snapshot.patient_overview)}',
                    '${escapeSQL(snapshot.health_issues)}',
                    '${snapshot.created_date?.toISOString() || new Date().toISOString()}',
                    '${snapshot.updated_date?.toISOString() || new Date().toISOString()}'
                )`
            );
        }

        // Insert patient conditions
        for (const condition of samplePatientConditions) {
            if (!condition.patient_id || !condition.condition_name) continue;
            await db.execAsync(
                `INSERT INTO ${tables.PATIENT_CONDITION} (
                    patient_id,
                    condition_name,
                    linked_health_system,
                    created_date,
                    updated_date
                ) VALUES (
                    ${condition.patient_id},
                    '${escapeSQL(condition.condition_name)}',
                    ${condition.linked_health_system ? 1 : 0},
                    '${condition.created_date?.toISOString() || new Date().toISOString()}',
                    '${condition.updated_date?.toISOString() || new Date().toISOString()}'
                )`
            );
        }

        // Insert patient equipment
        for (const equipment of samplePatientEquipment) {
            if (!equipment.patient_id || !equipment.equipment_name) continue;
            await db.execAsync(
                `INSERT INTO ${tables.PATIENT_EQUIPMENT} (
                    patient_id,
                    equipment_name,
                    equipment_description,
                    linked_health_system,
                    created_date,
                    updated_date
                ) VALUES (
                    ${equipment.patient_id},
                    '${escapeSQL(equipment.equipment_name)}',
                    '${escapeSQL(equipment.equipment_description)}',
                    ${equipment.linked_health_system ? 1 : 0},
                    '${equipment.created_date?.toISOString() || new Date().toISOString()}',
                    '${equipment.updated_date?.toISOString() || new Date().toISOString()}'
                )`
            );
        }

        // Insert patient goals
        for (const goal of samplePatientGoals) {
            if (!goal.patient_id || !goal.goal_description) continue;
            await db.execAsync(
                `INSERT INTO ${tables.PATIENT_GOAL} (
                    patient_id,
                    goal_description,
                    target_date,
                    status,
                    linked_health_system,
                    created_date,
                    updated_date
                ) VALUES (
                    ${goal.patient_id},
                    '${escapeSQL(goal.goal_description)}',
                    '${goal.target_date?.toISOString() || new Date().toISOString()}',
                    '${escapeSQL(goal.status)}',
                    ${goal.linked_health_system ? 1 : 0},
                    '${goal.created_date?.toISOString() || new Date().toISOString()}',
                    '${goal.updated_date?.toISOString() || new Date().toISOString()}'
                )`
            );
        }

        // Insert patient emergency care
        for (const emergency of samplePatientEmergencyCare) {
            if (!emergency.patient_id || !emergency.topic) continue;
            await db.execAsync(
                `INSERT INTO ${tables.PATIENT_EMERGENCY_CARE} (
                    patient_id,
                    topic,
                    details,
                    linked_health_system,
                    created_date,
                    updated_date
                ) VALUES (
                    ${emergency.patient_id},
                    '${escapeSQL(emergency.topic)}',
                    '${escapeSQL(emergency.details)}',
                    ${emergency.linked_health_system ? 1 : 0},
                    '${emergency.created_date?.toISOString() || new Date().toISOString()}',
                    '${emergency.updated_date?.toISOString() || new Date().toISOString()}'
                )`
            );
        }

        // Insert patient allergies
        for (const allergy of samplePatientAllergies) {
            if (!allergy.patient_id || !allergy.topic) continue;
            await db.execAsync(
                `INSERT INTO ${tables.PATIENT_ALLERGY} (
                    patient_id,
                    topic,
                    details,
                    severity,
                    onset_date,
                    linked_health_system,
                    created_date,
                    updated_date
                ) VALUES (
                    ${allergy.patient_id},
                    '${escapeSQL(allergy.topic)}',
                    '${escapeSQL(allergy.details)}',
                    '${escapeSQL(allergy.severity)}',
                    '${allergy.onset_date?.toISOString() || new Date().toISOString()}',
                    ${allergy.linked_health_system ? 1 : 0},
                    '${allergy.created_date?.toISOString() || new Date().toISOString()}',
                    '${allergy.updated_date?.toISOString() || new Date().toISOString()}'
                )`
            );
        }

        // Insert patient medications
        for (const medication of samplePatientMedications) {
            if (!medication.patient_id || !medication.name) continue;
            await db.execAsync(
                `INSERT INTO ${tables.PATIENT_MEDICATION} (
                    patient_id,
                    name,
                    details,
                    linked_health_system,
                    created_date,
                    updated_date
                ) VALUES (
                    ${medication.patient_id},
                    '${escapeSQL(medication.name)}',
                    '${escapeSQL(medication.details)}',
                    ${medication.linked_health_system ? 1 : 0},
                    '${medication.created_date?.toISOString() || new Date().toISOString()}',
                    '${medication.updated_date?.toISOString() || new Date().toISOString()}'
                )`
            );
        }

        // Insert patient notes
        for (const note of samplePatientNotes) {
            if (!note.patient_id || !note.topic) continue;
            await db.execAsync(
                `INSERT INTO ${tables.PATIENT_NOTE} (
                    patient_id,
                    topic,
                    details,
                    reminder_date,
                    created_date,
                    updated_date
                ) VALUES (
                    ${note.patient_id},
                    '${escapeSQL(note.topic)}',
                    '${escapeSQL(note.details)}',
                    '${note.reminder_date || new Date().toISOString()}',
                    '${note.created_date || new Date().toISOString()}',
                    '${note.updated_date || new Date().toISOString()}'
                )`
            );
        }

        logger.debug('Sample data seeded successfully.');
    } catch (error) {
        logger.debug('Error seeding data:', error);
    }
}; 