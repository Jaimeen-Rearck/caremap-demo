import { PatientEquipment } from '@/services/database/migrations/v1/schema_v1';
import { PatientEquipmentModel } from '@/services/database/models/PatientEquipmentModel';
import { logger } from '@/services/logging/logger';
import { getCurrentTimestamp } from '@/services/core/utils';
import { isExistingPatientById } from '@/services/core/PatientService';
import { useModel } from '@/services/database/BaseModel';

// Single shared instance of model
const patientEquipmentModel = new PatientEquipmentModel();

export const isExistingPatientEquipment = async (id: number): Promise<boolean> => {
    const existingEquipment = await getPatientEquipment(id);
    return !!existingEquipment;
}

export const createPatientEquipment = async (equipment: Partial<PatientEquipment>): Promise<PatientEquipment | null> => {
    return useModel(patientEquipmentModel, async (model) => {
        if (!equipment.patient_id || !(await isExistingPatientById(equipment.patient_id))) {
            logger.debug("Cannot create patient equipment: Patient does not exist", equipment.patient_id);
            return null;
        }

        if (!equipment.equipment_name) {
            logger.debug("Cannot create patient equipment: Equipment name is required");
            return null;
        }

        const now = getCurrentTimestamp();
        const newEquipment = {
            ...equipment,
            created_date: now,
            updated_date: now,
            linked_health_system: equipment.linked_health_system || false
        };

        const created = await model.insert(newEquipment);
        logger.debug("Patient Equipment created: ", created);
        return created;
    });
}

export const getPatientEquipment = async (id: number): Promise<PatientEquipment | null> => {
    return useModel(patientEquipmentModel, async (model) => {
        const result = await model.getFirstByFields({ id });
        logger.debug("DB Patient Equipment data: ", result);
        return result;
    });
}

export const getPatientEquipmentsByPatientId = async (patientId: number): Promise<PatientEquipment[]> => {
    return useModel(patientEquipmentModel, async (model) => {
        const results = await model.getByFields({ patient_id: patientId });
        logger.debug("DB Patient Equipment for patient: ", results);
        return results;
    });
}

export const updatePatientEquipment = async (equipmentUpdate: Partial<PatientEquipment>, whereMap: Partial<PatientEquipment>): Promise<PatientEquipment | null> => {
    return useModel(patientEquipmentModel, async (model) => {
        const existingEquipment = await model.getFirstByFields(whereMap);
        if (!existingEquipment) {
            logger.debug("Patient Equipment not found for update: ", whereMap);
            return null;
        }

        const updateData = {
            ...equipmentUpdate,
            updated_date: getCurrentTimestamp()
        };
        const updatedEquipment = await model.updateByFields(updateData, whereMap);
        logger.debug("Updated Patient Equipment: ", updatedEquipment);
        return updatedEquipment;
    });
}

export const deletePatientEquipment = async (id: number): Promise<boolean> => {
    return useModel(patientEquipmentModel, async (model) => {
        if (!(await isExistingPatientEquipment(id))) {
            logger.debug("Patient Equipment not found for deletion: ", id);
            return false;
        }

        await model.deleteByFields({ id });
        logger.debug("Deleted Patient Equipment: ", id);
        return true;
    });
} 