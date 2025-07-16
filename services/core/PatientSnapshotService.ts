import { PatientSnapshot } from '@/services/database/migrations/v1/schema_v1';
import { PatientSnapshotModel } from '@/services/database/models/PatientSnapshotModel';
import { logger } from '@/services/logging/logger';
import { getCurrentTimestamp } from '@/services/core/utils';
import { useModel } from '@/services/database/BaseModel';
import { isExistingPatientById } from '@/services/core/PatientService';

// Single shared instance of model
const patientSnapshotModel = new PatientSnapshotModel();

export const isExistingPatientSnapshot = async (id: number): Promise<boolean> => {
    const existingSnapshot = await getPatientSnapshot(id);
    return !!existingSnapshot;
}

export const createPatientSnapshot = async (snapshot: Partial<PatientSnapshot>): Promise<PatientSnapshot | null> => {
    return useModel(patientSnapshotModel, async (model) => {
        if (!snapshot.patient_id || !(await isExistingPatientById(snapshot.patient_id))) {
            logger.debug("Cannot create patient snapshot: Patient does not exist", snapshot.patient_id);
            return null;
        }

        const now = getCurrentTimestamp();
        const newSnapshot = {
            ...snapshot,
            created_date: now,
            updated_date: now
        };

        const created = await model.insert(newSnapshot);
        logger.debug("Patient Snapshot created: ", created);
        return created;
    });
}

export const getPatientSnapshot = async (id: number): Promise<PatientSnapshot | null> => {
    return useModel(patientSnapshotModel, async (model) => {
        const result = await model.getFirstByFields({ id });
        logger.debug("DB Patient Snapshot data: ", result);
        return result;
    });
}

export const getPatientSnapshotByPatientId = async (patientId: number): Promise<PatientSnapshot | null> => {
    return useModel(patientSnapshotModel, async (model) => {
        const result = await model.getFirstByFields({ patient_id: patientId });
        logger.debug("DB Patient Snapshot for patient: ", result);
        return result;
    });
}

export const updatePatientSnapshot = async (snapshotUpdate: Partial<PatientSnapshot>, whereMap: Partial<PatientSnapshot>): Promise<PatientSnapshot | null> => {
    return useModel(patientSnapshotModel, async (model) => {
        const existingSnapshot = await model.getFirstByFields(whereMap);
        if (!existingSnapshot) {
            logger.debug("Patient Snapshot not found for update: ", whereMap);
            return null;
        }

        const updateData = {
            ...snapshotUpdate,
            updated_date: getCurrentTimestamp()
        };
        const updatedSnapshot = await model.updateByFields(updateData, whereMap);
        logger.debug("Updated Patient Snapshot: ", updatedSnapshot);
        return updatedSnapshot;
    });
}

export const deletePatientSnapshot = async (id: number): Promise<boolean> => {
    return useModel(patientSnapshotModel, async (model) => {
        if (!(await isExistingPatientSnapshot(id))) {
            logger.debug("Patient Snapshot not found for deletion: ", id);
            return false;
        }

        await model.deleteByFields({ id });
        logger.debug("Deleted Patient Snapshot: ", id);
        return true;
    });
} 