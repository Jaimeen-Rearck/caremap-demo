import { PatientAllergy } from '@/services/database/migrations/v1/schema_v1';
import { PatientAllergyModel } from '@/services/database/models/PatientAllergyModel';
import { logger } from '@/services/logging/logger';
import { getCurrentTimestamp } from '@/services/core/utils';
import { isExistingPatientById } from '@/services/core/PatientService';
import { useModel } from '@/services/database/BaseModel';

// Single shared instance of model
const patientAllergyModel = new PatientAllergyModel();

export const isExistingPatientAllergy = async (id: number): Promise<boolean> => {
    const existingAllergy = await getPatientAllergy(id);
    return !!existingAllergy;
}

export const createPatientAllergy = async (allergy: Partial<PatientAllergy>): Promise<PatientAllergy | null> => {
    return useModel(patientAllergyModel, async (model) => {
        if (!allergy.patient_id || !(await isExistingPatientById(allergy.patient_id))) {
            logger.debug("Cannot create patient allergy: Patient does not exist", allergy.patient_id);
            return null;
        }

        if (!allergy.topic) {
            logger.debug("Cannot create patient allergy: Topic is required");
            return null;
        }

        const now = getCurrentTimestamp();
        const newAllergy = {
            ...allergy,
            created_date: now,
            updated_date: now,
            linked_health_system: allergy.linked_health_system || false,
            onset_date: allergy.onset_date || now
        };

        const created = await model.insert(newAllergy);
        logger.debug("Patient Allergy created: ", created);
        return created;
    });
}

export const getPatientAllergy = async (id: number): Promise<PatientAllergy | null> => {
    return useModel(patientAllergyModel, async (model) => {
        const result = await model.getFirstByFields({ id });
        logger.debug("DB Patient Allergy data: ", result);
        return result;
    });
}

export const getPatientAllergiesByPatientId = async (patientId: number): Promise<PatientAllergy[]> => {
    return useModel(patientAllergyModel, async (model) => {
        const results = await model.getByFields({ patient_id: patientId });
        logger.debug("DB Patient Allergies for patient: ", results);
        return results;
    });
}

export const updatePatientAllergy = async (allergyUpdate: Partial<PatientAllergy>, whereMap: Partial<PatientAllergy>): Promise<PatientAllergy | null> => {
    return useModel(patientAllergyModel, async (model) => {
        const existingAllergy = await model.getFirstByFields(whereMap);
        if (!existingAllergy) {
            logger.debug("Patient Allergy not found for update: ", whereMap);
            return null;
        }

        const updateData = {
            ...allergyUpdate,
            updated_date: getCurrentTimestamp()
        };
        const updatedAllergy = await model.updateByFields(updateData, whereMap);
        logger.debug("Updated Patient Allergy: ", updatedAllergy);
        return updatedAllergy;
    });
}

export const deletePatientAllergy = async (id: number): Promise<boolean> => {
    return useModel(patientAllergyModel, async (model) => {
        if (!(await isExistingPatientAllergy(id))) {
            logger.debug("Patient Allergy not found for deletion: ", id);
            return false;
        }

        await model.deleteByFields({ id });
        logger.debug("Deleted Patient Allergy: ", id);
        return true;
    });
} 