import { PatientGoal } from '@/services/database/migrations/v1/schema_v1';
import { PatientGoalModel } from '@/services/database/models/PatientGoalModel';
import { logger } from '@/services/logging/logger';
import { getCurrentTimestamp } from '@/services/core/utils';
import { isExistingPatientById } from '@/services/core/PatientService';
import { useModel } from '@/services/database/BaseModel';

// Single shared instance of model
const patientGoalModel = new PatientGoalModel();

export const isExistingPatientGoal = async (id: number): Promise<boolean> => {
    const existingGoal = await getPatientGoal(id);
    return !!existingGoal;
}

export const createPatientGoal = async (goal: Partial<PatientGoal>): Promise<PatientGoal | null> => {
    return useModel(patientGoalModel, async (model) => {
        if (!goal.patient_id || !(await isExistingPatientById(goal.patient_id))) {
            logger.debug("Cannot create patient goal: Patient does not exist", goal.patient_id);
            return null;
        }

        if (!goal.goal_description) {
            logger.debug("Cannot create patient goal: Goal description is required");
            return null;
        }

        const now = getCurrentTimestamp();
        const newGoal = {
            ...goal,
            created_date: now,
            updated_date: now,
            linked_health_system: goal.linked_health_system || false
        };

        const created = await model.insert(newGoal);
        logger.debug("Patient Goal created: ", created);
        return created;
    });
}

export const getPatientGoal = async (id: number): Promise<PatientGoal | null> => {
    return useModel(patientGoalModel, async (model) => {
        const result = await model.getFirstByFields({ id });
        logger.debug("DB Patient Goal data: ", result);
        return result;
    });
}

export const getPatientGoalsByPatientId = async (patientId: number): Promise<PatientGoal[]> => {
    return useModel(patientGoalModel, async (model) => {
        const results = await model.getByFields({ patient_id: patientId });
        logger.debug("DB Patient Goals for patient: ", results);
        return results;
    });
}

export const updatePatientGoal = async (goalUpdate: Partial<PatientGoal>, whereMap: Partial<PatientGoal>): Promise<PatientGoal | null> => {
    return useModel(patientGoalModel, async (model) => {
        const existingGoal = await model.getFirstByFields(whereMap);
        if (!existingGoal) {
            logger.debug("Patient Goal not found for update: ", whereMap);
            return null;
        }

        const updateData = {
            ...goalUpdate,
            updated_date: getCurrentTimestamp()
        };
        const updatedGoal = await model.updateByFields(updateData, whereMap);
        logger.debug("Updated Patient Goal: ", updatedGoal);
        return updatedGoal;
    });
}

export const deletePatientGoal = async (id: number): Promise<boolean> => {
    return useModel(patientGoalModel, async (model) => {
        if (!(await isExistingPatientGoal(id))) {
            logger.debug("Patient Goal not found for deletion: ", id);
            return false;
        }

        await model.deleteByFields({ id });
        logger.debug("Deleted Patient Goal: ", id);
        return true;
    });
} 