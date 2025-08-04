import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import { LabeledTextInput } from "@/components/shared/labeledTextInput";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { CalendarDaysIcon, Icon } from "@/components/ui/icon";
import {
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
} from "@/components/ui/select";
import { PatientContext } from "@/context/PatientContext";
import { UserContext } from "@/context/UserContext";
import { updatePatient } from "@/services/core/PatientService";
import { calculateAge, getDisplayName,pickImageFromLibrary } from "@/services/core/utils";
import { Patient } from "@/services/database/migrations/v1/schema_v1";
import { logger } from "@/services/logging/logger";
import { ROUTES } from "@/utils/route";
import palette from "@/utils/theme/color";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { Camera, ChevronDownIcon, User } from "lucide-react-native";
import React, { useContext, useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditProfilePage() {
  const { user } = useContext(UserContext);
  const { patient, setPatientData } = useContext(PatientContext);
  const [newPatient, setNewPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [showImageDialog, setShowImageDialog] = useState(false);

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const showToast = useCustomToast();
  useEffect(() => {
    logger.debug("Edit Patient: ", patient);
    if (!patient) {
      router.replace(ROUTES.MY_HEALTH);
      return;
    }
    setNewPatient({
      ...patient,
      weight_unit: patient.weight_unit ?? "lbs",
    });
    setLoading(false);
  }, [patient]);

  const handleConfirm = (date: Date) => {
    setNewPatient((prev) =>
      prev
        ? {
            ...prev,
            date_of_birth: date,
          }
        : prev
    );
    setDatePickerVisibility(false);
  };


const handleImagePress = () => {
  setShowImageDialog(true);
};
  const handlePickImage = async () => {
    const result = await pickImageFromLibrary();
    
    if (result.error) {
      showToast({
  title: "Error",
  description: `Failed to pick image. ${result.error}`,
  action: "error", 
});
      return;
    }

    if (result.base64Image) {
      setNewPatient(prev => 
        prev ? { ...prev, profile_picture: result.base64Image } : prev
      );
    }
  };
  const handleSave = async () => {
    if (!user) return;

    let updatedPatient;

    try {
      if (!patient?.id) {
        throw new Error("Invalid patient ID.");
      }

      updatedPatient = await updatePatient(
        {
          weight: newPatient?.weight,
           weight_unit: newPatient?.weight_unit ?? "lbs",
          relationship: newPatient?.relationship,
          gender: newPatient?.gender,
          date_of_birth: newPatient?.date_of_birth,
           profile_picture: newPatient?.profile_picture,

        },
        { id: patient?.id }
      );

      if (!updatedPatient) {
        throw new Error("Error updating Patient Profile!");
      }

      setPatientData(updatedPatient);

      showToast({
        title: "Success",
        description: "Patient data updated.",
        action: "success",
      });
      router.replace(ROUTES.MY_HEALTH);
    } catch (err) {
      logger.debug(" Save Error: ", err);
      showToast({
        title: "Error",
        description: "Error saving or updating data.",
        action: "error",
      });
    }
  };

  if (loading || !user || !newPatient) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View style={{ backgroundColor: palette.primary }} className="py-2">
        <Text className="text-xl text-white font-bold text-center">
          Edit Profile
        </Text>

        <View className="flex-row mb-5 items-center justify-start px-4 ">
          
          <TouchableOpacity onPress={handleImagePress}>
            <Avatar size="xl">
              {/* {patient?.profile_picture ? (
              <AvatarImage source={{ uri: newPatient?.profile_picture }} />
            ) : (
              <View className="w-full h-full items-center justify-center bg-gray-200 rounded-full">
                <Icon as={User} size="xl" className="text-gray-500" />
              </View>
            )} */}
              <AvatarImage source={{ uri: newPatient?.profile_picture }} />
              <View className="absolute bottom-0 right-0 bg-white rounded-full p-1 ">
                <Icon as={Camera} size="sm" className="text-black" />
              </View>
            </Avatar>
            
          </TouchableOpacity>
          <View className="ml-16">
            <Text className="text-lg text-white font-semibold">
              {getDisplayName(newPatient)}
            </Text>
            <Text className="text-white">
              Age:{" "}
              {calculateAge(patient?.date_of_birth)
                ? `${calculateAge(patient?.date_of_birth)} years`
                : "Not set"}
            </Text>

            <Text className="text-white">
              Weight:{" "}
              {patient?.weight
                ? `${patient.weight} ${newPatient.weight_unit}`
                : "Not set"}
            </Text>
          </View>
        </View>
      </View>
      <View className="px-4 py-2">
        <LabeledTextInput
          label="First Name"
          value={newPatient.first_name}
          editable={!newPatient.first_name}
          onChangeText={(text) =>
            setNewPatient((prev) =>
              prev ? { ...prev, first_name: text } : prev
            )
          }
        />
        <LabeledTextInput
          label="Middle Name"
          value={newPatient.middle_name ?? ""}
          editable={!newPatient.middle_name}
          onChangeText={(text) =>
            setNewPatient((prev) =>
              prev ? { ...prev, middle_name: text } : prev
            )
          }
        />
        <LabeledTextInput
          label="Last Name"
          value={newPatient.last_name}
          editable={!newPatient.last_name}
          onChangeText={(text) =>
            setNewPatient((prev) =>
              prev ? { ...prev, last_name: text } : prev
            )
          }
        />

        <View className="mb-3">
          <Text className="text-gray-500 text-sm mb-1">Date of Birth</Text>
          <TouchableOpacity
            className="border flex flex-row justify-between items-center border-gray-300 rounded-lg p-2"
            onPress={() => setDatePickerVisibility(true)}
          >
            <Text className="text-gray-700">
              {newPatient.date_of_birth
                ? format(newPatient.date_of_birth, "MM-dd-yyyy")

                : "Select birthdate"}
            </Text>
            <Icon
              as={CalendarDaysIcon}
              className="text-typography-500 m-2 w-4 h-4"
            />
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirm}
            onCancel={() => setDatePickerVisibility(false)}
            maximumDate={new Date()}
          />
        </View>

        

        <LabeledTextInput
          label={`Weight in(${newPatient?.weight_unit})`}
          keyboardType="numeric"
          value={
            newPatient?.weight !== undefined && !isNaN(newPatient.weight)
              ? newPatient?.weight?.toString()
              : ""
          }
          onChangeText={(text) =>
            setNewPatient((prev) =>
              prev ? { ...prev, weight: parseFloat(text) } : prev
            )
          }
        />

        <View className="mb-3">
          <Text className="text-gray-500 text-sm mb-1">Relationship</Text>
          <Select
            selectedValue={newPatient?.relationship}
            onValueChange={(value) =>
              setNewPatient((prev) =>
                prev ? { ...prev, relationship: value } : prev
              )
            }
          >
            <SelectTrigger
              className="flex flex-row justify-between items-center"
              variant="outline"
              size="lg"
            >
              <SelectInput placeholder="Select relationship" />
              <SelectIcon className="mr-3" as={ChevronDownIcon} />
            </SelectTrigger>
            <SelectPortal>
              <SelectBackdrop />
              <SelectContent>
                <SelectDragIndicatorWrapper>
                  <SelectDragIndicator />
                </SelectDragIndicatorWrapper>
                {[
                  "self",
                  "parent",
                  "child",
                  "spouse",
                  "sibling",
                  "grandparent",
                  "grandchild",
                  "relative",
                  "friend",
                  "guardian",
                  "other",
                ].map((rel) => (
                  <SelectItem
                    key={rel}
                    label={rel.charAt(0).toUpperCase() + rel.slice(1)}
                    value={rel}
                  />
                ))}
              </SelectContent>
            </SelectPortal>
          </Select>
        </View>

        {/* Gender */}
        <View className="mb-6">
          <Text className="text-gray-500 text-sm mb-1">Gender</Text>
          <Select
            selectedValue={newPatient?.gender}
            onValueChange={(value) =>
              setNewPatient((prev) =>
                prev ? { ...prev, gender: value } : prev
              )
            }
          >
            <SelectTrigger
              className="flex flex-row justify-between items-center"
              variant="outline"
              size="lg"
            >
              <SelectInput placeholder="Select Gender" />
              <SelectIcon className="mr-3" as={ChevronDownIcon} />
            </SelectTrigger>
            <SelectPortal>
              <SelectBackdrop />
              <SelectContent>
                <SelectDragIndicatorWrapper>
                  <SelectDragIndicator />
                </SelectDragIndicatorWrapper>
                <SelectItem label="Male" value="male" />
                <SelectItem label="Female" value="female" />
                <SelectItem label="Other" value="other" />
              </SelectContent>
            </SelectPortal>
          </Select>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={{ backgroundColor: palette.primary }}
          className="py-3 rounded-lg"
          onPress={handleSave}
        >
          <Text className="text-white font-bold text-center">Save</Text>
        </TouchableOpacity>
      </View>
      <CustomAlertDialog
  isOpen={showImageDialog}
  onClose={() => setShowImageDialog(false)}
  title="Choose an option"
  description="How would you like to add a photo?"
  confirmText="Choose from Library"
  cancelText="Cancel"
  onConfirm={() => {
    setShowImageDialog(false);
    handlePickImage();
  }}
  confirmButtonProps={{
    style: { backgroundColor: palette.primary, marginLeft: 8 },
  }}
/>

    </SafeAreaView>
  );
}
