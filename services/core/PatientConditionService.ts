import { PatientCondition } from '@/services/database/migrations/v1/schema_v1';
import { PatientConditionModel } from '@/services/database/models/PatientConditionModel';
import { logger } from '@/services/logging/logger';
import { getCurrentTimestamp } from '@/services/core/utils';
import { isExistingPatientById } from '@/services/core/PatientService';
import { useModel } from '@/services/database/BaseModel';

// Single shared instance of model
const patientConditionModel = new PatientConditionModel();

export const isExistingPatientCondition = async (id: number): Promise<boolean> => {
    const existingCondition = await getPatientCondition(id);
    return !!existingCondition;
}

export const createPatientCondition = async (condition: Partial<PatientCondition>): Promise<PatientCondition | null> => {
    return useModel(patientConditionModel, async (model) => {
        if (!condition.patient_id || !(await isExistingPatientById(condition.patient_id))) {
            logger.debug("Cannot create patient condition: Patient does not exist", condition.patient_id);
            return null;
        }

        if (!condition.condition_name) {
            logger.debug("Cannot create patient condition: Condition name is required");
            return null;
        }

        const now = getCurrentTimestamp();
        const newCondition = {
            ...condition,
            created_date: now,
            updated_date: now,
            linked_health_system: condition.linked_health_system || false
        };

        const created = await model.insert(newCondition);
        logger.debug("Patient Condition created: ", created);
        return created;
    });
}

export const getPatientCondition = async (id: number): Promise<PatientCondition | null> => {
    return useModel(patientConditionModel, async (model) => {
        const result = await model.getFirstByFields({ id });
        logger.debug("DB Patient Condition data: ", result);
        return result;
    });
}

export const getPatientConditionsByPatientId = async (patientId: number): Promise<PatientCondition[]> => {
    return useModel(patientConditionModel, async (model) => {
        const results = await model.getByFields({ patient_id: patientId });
        logger.debug("DB Patient Conditions for patient: ", results);
        return results;
    });
}

export const updatePatientCondition = async (conditionUpdate: Partial<PatientCondition>, whereMap: Partial<PatientCondition>): Promise<PatientCondition | null> => {
    return useModel(patientConditionModel, async (model) => {
        const existingCondition = await model.getFirstByFields(whereMap);
        if (!existingCondition) {
            logger.debug("Patient Condition not found for update: ", whereMap);
            return null;
        }

        const updateData = {
            ...conditionUpdate,
            updated_date: getCurrentTimestamp()
        };
        const updatedCondition = await model.updateByFields(updateData, whereMap);
        logger.debug("Updated Patient Condition: ", updatedCondition);
        return updatedCondition;
    });
}

export const deletePatientCondition = async (id: number): Promise<boolean> => {
    return useModel(patientConditionModel, async (model) => {
        if (!(await isExistingPatientCondition(id))) {
            logger.debug("Patient Condition not found for deletion: ", id);
            return false;
        }

        await model.deleteByFields({ id });
        logger.debug("Deleted Patient Condition: ", id);
        return true;
    });
} 