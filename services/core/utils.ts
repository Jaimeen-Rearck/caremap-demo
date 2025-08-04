import { differenceInYears } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { logger } from '../logging/logger';
import { Patient } from '../database/migrations/v1/schema_v1';

export type ImagePickerResult = {
    base64Image: string | undefined;
    error: string | null;
};

export const pickImageFromLibrary = async (): Promise<ImagePickerResult> => {
    try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            return {
                base64Image: undefined,
                error: 'Camera roll permissions not granted'
            };
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        //success case
        if (!result.canceled && result.assets[0].base64) {
            return {
                base64Image: `data:image/jpeg;base64,${result.assets[0].base64}`,
                error: null
            };
        }

        //user cancelled case
        return {
            base64Image: undefined,
            error: "User cancelled the action"
        };
    } catch (error) {
        logger.debug('Error picking image:', error);
        //error case
        return {
            base64Image: undefined,
            error: 'Failed to pick image'
        };
    }
};



// Helper function to get current timestamp
export function getCurrentTimestamp(): Date {
    return new Date();
}

// Helper function to calculateAge based on given date.
export const calculateAge = (date: Date | undefined | null): number | null => {
    if (!date) return null;
    try {
        const today = new Date();
        return differenceInYears(today, date);
    } catch (error) {
        console.error("Error calculating age:", error);
        return null;
    }
};

// Function to get display name from patient object in the format "First Middle Last"
 export const getDisplayName = (patient: Patient): string => {
    return `${patient.first_name} ${
      patient.middle_name ? patient.middle_name + " " : ""
    }${patient.last_name}`;
  };
