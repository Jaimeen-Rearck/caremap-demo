import { Contact } from "@/services/database/migrations/v1/schema_v1";
import { ContactModel } from "@/services/database/models/ContactModel";
import { logger } from "@/services/logging/logger";
import { getCurrentTimestamp } from "@/services/core/utils";
import { useModel } from "@/services/database/BaseModel";
import { isExistingPatientById } from "@/services/core/PatientService";

// Single shared instance of model
const contactModel = new ContactModel();

const checkUniqueFields = async (
  model: ContactModel,
  contactData: Partial<Contact>,
  excludeId?: number
): Promise<void> => {
  // Only check phone number uniqueness (email is optional and not unique)
  if (contactData.phone_number) {
    const phoneHolder = await model.getFirstByFields({
      phone_number: contactData.phone_number,
    });
    if (phoneHolder && (phoneHolder as any).id !== excludeId) {
      throw new Error("Phone number already exists");
    }
  }
};

export const createContact = async (
  contact: Partial<Contact>,
  patientId: number
): Promise<Contact | null> => {
  return useModel(contactModel, async (model) => {
    try {
      if (!(await isExistingPatientById(patientId))) {
        logger.debug("Patient not found for contact creation:", patientId);
        return null;
      }

      if (!contact.first_name || !contact.phone_number) {
        throw new Error(
          "Missing required fields: first_name and phone_number are mandatory"
        );
      }

      await checkUniqueFields(model, contact);

      const now = getCurrentTimestamp();
      const newContact = {
        ...contact,
        patient_id: patientId,
        created_date: now,
        updated_date: now,
      };

      const created = await model.insert(newContact);
      logger.debug("Contact created:", created);
      return created;
    } catch (error) {
      logger.debug("Error creating contact:", error);
      throw error;
    }
  });
};

export const updateContact = async (
  contactUpdate: Partial<Contact>,
  whereMap: Partial<Contact>
): Promise<Contact | null> => {
  return useModel(contactModel, async (model) => {
    try {
      const existingContact = await model.getFirstByFields(whereMap);
      if (!existingContact) {
        logger.debug("Contact not found for update:", whereMap);
        return null;
      }

      await checkUniqueFields(
        model,
        contactUpdate,
        (existingContact as any).id
      );

      const updateData = {
        ...existingContact,
        ...contactUpdate,
        updated_date: getCurrentTimestamp(),
      };

      const updatedContact = await model.updateByFields(updateData, whereMap);
      logger.debug("Updated Contact:", updatedContact);
      return updatedContact;
    } catch (error) {
      logger.debug("Error updating contact:", error);
      throw error;
    }
  });
};

export const deleteContact = async (id: number): Promise<boolean> => {
  return useModel(contactModel, async (model) => {
    try {
      const existing = await model.getFirstByFields({ id });
      if (!existing) {
        logger.debug("Contact not found for deletion:", id);
        return false;
      }

      await model.deleteByFields({ id });
      logger.debug("Deleted Contact:", id);
      return true;
    } catch (error) {
      logger.debug("Error deleting contact:", error);
      throw error;
    }
  });
};

export const getContactById = async (id: number): Promise<Contact | null> => {
  return useModel(contactModel, async (model) => {
    try {
      const result = await model.getFirstByFields({ id });
      logger.debug("DB Contact data:", result);
      return result;
    } catch (error) {
      logger.debug("Error fetching contact:", error);
      return null;
    }
  });
};

export const getAllContactsByPatientId = async (
  patientId: number
): Promise<Contact[]> => {
  return useModel(contactModel, async (model) => {
    try {
      if (!(await isExistingPatientById(patientId))) {
        logger.debug("Patient not found for contacts retrieval:", patientId);
        return [];
      }

      const results = await model.getByFields({ patient_id: patientId });
      logger.debug("DB Contacts for patient:", results);
      return results;
    } catch (error) {
      logger.debug("Error fetching contacts by patient ID:", error);
      return [];
    }
  });
};
