import { PatientEmergencyCare } from '@/services/database/migrations/v1/schema_v1';
import { PatientEmergencyCareModel } from '@/services/database/models/PatientEmergencyCareModel';
import { logger } from '@/services/logging/logger';
import { getCurrentTimestamp } from '@/services/core/utils';
import { isExistingPatientById } from '@/services/core/PatientService';
import { useModel } from '@/services/database/BaseModel';

// Single shared instance of model
const patientEmergencyCareModel = new PatientEmergencyCareModel();

export const isExistingPatientEmergencyCare = async (id: number): Promise<boolean> => {
    const existingEmergencyCare = await getPatientEmergencyCare(id);
    return !!existingEmergencyCare;
}

export const createPatientEmergencyCare = async (emergencyCare: Partial<PatientEmergencyCare>): Promise<PatientEmergencyCare | null> => {
    return useModel(patientEmergencyCareModel, async (model) => {
        if (!emergencyCare.patient_id || !(await isExistingPatientById(emergencyCare.patient_id))) {
            logger.debug("Cannot create patient emergency care: Patient does not exist", emergencyCare.patient_id);
            return null;
        }

        if (!emergencyCare.topic) {
            logger.debug("Cannot create patient emergency care: Topic is required");
            return null;
        }

        const now = getCurrentTimestamp();
        const newEmergencyCare = {
            ...emergencyCare,
            created_date: now,
            updated_date: now,
            linked_health_system: emergencyCare.linked_health_system || false
        };

        const created = await model.insert(newEmergencyCare);
        logger.debug("Patient Emergency Care created: ", created);
        return created;
    });
}

export const getPatientEmergencyCare = async (id: number): Promise<PatientEmergencyCare | null> => {
    return useModel(patientEmergencyCareModel, async (model) => {
        const result = await model.getFirstByFields({ id });
        logger.debug("DB Patient Emergency Care data: ", result);
        return result;
    });
}

export const getPatientEmergencyCaresByPatientId = async (patientId: number): Promise<PatientEmergencyCare[]> => {
    return useModel(patientEmergencyCareModel, async (model) => {
        const results = await model.getByFields({ patient_id: patientId });
        logger.debug("DB Patient Emergency Care records for patient: ", results);
        return results;
    });
}

export const updatePatientEmergencyCare = async (emergencyCareUpdate: Partial<PatientEmergencyCare>, whereMap: Partial<PatientEmergencyCare>): Promise<PatientEmergencyCare | null> => {
    return useModel(patientEmergencyCareModel, async (model) => {
        const existingEmergencyCare = await model.getFirstByFields(whereMap);
        if (!existingEmergencyCare) {
            logger.debug("Patient Emergency Care not found for update: ", whereMap);
            return null;
        }

        const updateData = {
            ...emergencyCareUpdate,
            updated_date: getCurrentTimestamp()
        };
        const updatedEmergencyCare = await model.updateByFields(updateData, whereMap);
        logger.debug("Updated Patient Emergency Care: ", updatedEmergencyCare);
        return updatedEmergencyCare;
    });
}

export const deletePatientEmergencyCare = async (id: number): Promise<boolean> => {
    return useModel(patientEmergencyCareModel, async (model) => {
        if (!(await isExistingPatientEmergencyCare(id))) {
            logger.debug("Patient Emergency Care not found for deletion: ", id);
            return false;
        }

        await model.deleteByFields({ id });
        logger.debug("Deleted Patient Emergency Care: ", id);
        return true;
    });
} 