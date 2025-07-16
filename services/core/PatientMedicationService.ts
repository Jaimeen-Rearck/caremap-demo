import { PatientMedication } from '@/services/database/migrations/v1/schema_v1';
import { PatientMedicationModel } from '@/services/database/models/PatientMedicationModel';
import { logger } from '@/services/logging/logger';
import { getCurrentTimestamp } from '@/services/core/utils';
import { isExistingPatientById } from '@/services/core/PatientService';
import { useModel } from '@/services/database/BaseModel';

// Single shared instance of model
const patientMedicationModel = new PatientMedicationModel();

export const isExistingPatientMedication = async (id: number): Promise<boolean> => {
    const existingMedication = await getPatientMedication(id);
    return !!existingMedication;
}

export const createPatientMedication = async (medication: Partial<PatientMedication>): Promise<PatientMedication | null> => {
    return useModel(patientMedicationModel, async (model) => {
        if (!medication.patient_id || !(await isExistingPatientById(medication.patient_id))) {
            logger.debug("Cannot create patient medication: Patient does not exist", medication.patient_id);
            return null;
        }

        if (!medication.name || !medication.details) {
            logger.debug("Cannot create patient medication: Name and details are required");
            return null;
        }

        const now = getCurrentTimestamp();
        const newMedication = {
            ...medication,
            created_date: now,
            updated_date: now,
            linked_health_system: medication.linked_health_system || false
        };

        const created = await model.insert(newMedication);
        logger.debug("Patient Medication created: ", created);
        return created;
    });
}

export const getPatientMedication = async (id: number): Promise<PatientMedication | null> => {
    return useModel(patientMedicationModel, async (model) => {
        const result = await model.getFirstByFields({ id });
        logger.debug("DB Patient Medication data: ", result);
        return result;
    });
}

export const getPatientMedicationsByPatientId = async (patientId: number): Promise<PatientMedication[]> => {
    return useModel(patientMedicationModel, async (model) => {
        const results = await model.getByFields({ patient_id: patientId });
        logger.debug("DB Patient Medications for patient: ", results);
        return results;
    });
}

export const updatePatientMedication = async (medicationUpdate: Partial<PatientMedication>, whereMap: Partial<PatientMedication>): Promise<PatientMedication | null> => {
    return useModel(patientMedicationModel, async (model) => {
        const existingMedication = await model.getFirstByFields(whereMap);
        if (!existingMedication) {
            logger.debug("Patient Medication not found for update: ", whereMap);
            return null;
        }

        const updateData = {
            ...medicationUpdate,
            updated_date: getCurrentTimestamp()
        };
        const updatedMedication = await model.updateByFields(updateData, whereMap);
        logger.debug("Updated Patient Medication: ", updatedMedication);
        return updatedMedication;
    });
}

export const deletePatientMedication = async (id: number): Promise<boolean> => {
    return useModel(patientMedicationModel, async (model) => {
        if (!(await isExistingPatientMedication(id))) {
            logger.debug("Patient Medication not found for deletion: ", id);
            return false;
        }

        await model.deleteByFields({ id });
        logger.debug("Deleted Patient Medication: ", id);
        return true;
    });
} 