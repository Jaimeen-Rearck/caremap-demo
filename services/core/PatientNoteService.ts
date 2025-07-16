import { PatientNote } from '@/services/database/migrations/v1/schema_v1';
import { PatientNoteModel } from '@/services/database/models/PatientNoteModel';
import { logger } from '@/services/logging/logger';
import { getCurrentTimestamp } from '@/services/core/utils';
import { isExistingPatientById } from '@/services/core/PatientService';
import { useModel } from '@/services/database/BaseModel';

// Single shared instance of model
const patientNoteModel = new PatientNoteModel();

export const isExistingPatientNote = async (id: number): Promise<boolean> => {
    const existingNote = await getPatientNote(id);
    return !!existingNote;
}

export const createPatientNote = async (note: Partial<PatientNote>): Promise<PatientNote | null> => {
    return useModel(patientNoteModel, async (model) => {
        if (!note.patient_id || !(await isExistingPatientById(note.patient_id))) {
            logger.debug("Cannot create patient note: Patient does not exist", note.patient_id);
            return null;
        }

        if (!note.topic) {
            logger.debug("Cannot create patient note: Topic is required");
            return null;
        }

        const now = getCurrentTimestamp();
        const newNote = {
            ...note,
            created_date: now,
            updated_date: now
        };

        const created = await model.insert(newNote);
        logger.debug("Patient Note created: ", created);
        return created;
    });
}

export const getPatientNote = async (id: number): Promise<PatientNote | null> => {
    return useModel(patientNoteModel, async (model) => {
        const result = await model.getFirstByFields({ id });
        logger.debug("DB Patient Note data: ", result);
        return result;
    });
}

export const getPatientNotesByPatientId = async (patientId: number): Promise<PatientNote[]> => {
    return useModel(patientNoteModel, async (model) => {
        const results = await model.getByFields({ patient_id: patientId });
        logger.debug("DB Patient Notes for patient: ", results);
        return results;
    });
}

export const updatePatientNote = async (noteUpdate: Partial<PatientNote>, whereMap: Partial<PatientNote>): Promise<PatientNote | null> => {
    return useModel(patientNoteModel, async (model) => {
        const existingNote = await model.getFirstByFields(whereMap);
        if (!existingNote) {
            logger.debug("Patient Note not found for update: ", whereMap);
            return null;
        }

        const updateData = {
            ...noteUpdate,
            updated_date: getCurrentTimestamp()
        };
        const updatedNote = await model.updateByFields(updateData, whereMap);
        logger.debug("Updated Patient Note: ", updatedNote);
        return updatedNote;
    });
}

export const deletePatientNote = async (id: number): Promise<boolean> => {
    return useModel(patientNoteModel, async (model) => {
        if (!(await isExistingPatientNote(id))) {
            logger.debug("Patient Note not found for deletion: ", id);
            return false;
        }

        await model.deleteByFields({ id });
        logger.debug("Deleted Patient Note: ", id);
        return true;
    });
} 