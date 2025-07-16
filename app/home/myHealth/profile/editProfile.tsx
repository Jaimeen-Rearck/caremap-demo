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
import { ShowAlert } from "@/services/common/ShowAlert";
import { updatePatient } from "@/services/core/PatientService";
import { calculateAge } from "@/services/core/utils";
import { Patient } from "@/services/database/migrations/v1/schema_v1";
import { logger } from "@/services/logging/logger";
import { ROUTES } from "@/utils/route";
import palette from "@/utils/theme/color";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { Camera, ChevronDownIcon } from "lucide-react-native";
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
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  useEffect(() => {
    logger.debug("Edit Patient: ", patient);
    if (!patient) {
      console.error("Error", "No patient found. Please try again.");
      router.replace(ROUTES.MY_HEALTH);
      return;
    }
    setNewPatient(patient);
    setLoading(false);
  }, [patient]);

  const getDisplayName = (patient: Patient): string => {
    return `${patient.first_name} ${patient.middle_name ? patient.middle_name + ' ' : ''}${patient.last_name}`;
  };

  const handleConfirm = (date: Date) => {
    setNewPatient((prev) =>
      prev
        ? {
            ...prev,
            date_of_birth: date
          }
        : prev
    );
    setDatePickerVisibility(false);
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
          relationship: newPatient?.relationship,
          gender: newPatient?.gender,
          date_of_birth: newPatient?.date_of_birth,
        },
        { id: patient?.id }
      );

      if (!updatedPatient) {
        throw new Error("Error updating Patient Profile!");
      }

      setPatientData(updatedPatient);

      // Temporary Alert - To be replaced with component
      ShowAlert("i", "Patient data updated.");

      router.replace(ROUTES.MY_HEALTH);
    } catch (err) {
      logger.debug(" Save Error: ", err);
      ShowAlert("e", "Error saving or updating data.");
    }
  };

  if (loading || !user || !newPatient) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  function LabeledDisplayField({
    label,
    value,
  }: {
    label: string;
    value: string;
  }) {
    return (
      <View className="mb-4">
        <Text className="text-gray-500 text-sm mb-1">{label}</Text>
        <View className="border border-gray-300 rounded-lg p-3 bg-gray-100">
          <Text className="text-gray-700">{value}</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View style={{ backgroundColor: palette.primary }} className="py-2">
        <Text className="text-xl text-white font-bold text-center">
          Edit Profile
        </Text>

        <View className="flex-row mb-5 items-center justify-start px-4 ">
          <Avatar size="xl">
            <AvatarImage source={{ uri: patient?.profile_picture }} />
            <View className="absolute bottom-0 right-0 bg-white rounded-full p-1 ">
              <Icon as={Camera} size="sm" className="text-black" />
            </View>
          </Avatar>
          <View className="ml-16">
            <Text className="text-lg text-white font-semibold">
              {getDisplayName(newPatient)}
            </Text>
            <Text className="text-white">Age: {calculateAge(newPatient.date_of_birth) ?? 'Not set'}</Text>
            <Text className="text-white">Weight: {newPatient.weight ? `${newPatient.weight} kg` : 'Not set'}</Text>
          </View>
        </View>
      </View>
      <View className="p-4">
        <LabeledDisplayField
          label="Name"
          value={getDisplayName(newPatient)}
        />

        <View className="mb-4">
          <Text className="text-gray-500 text-sm mb-1">Birthdate</Text>
          <TouchableOpacity
            className="border flex flex-row justify-between items-center border-gray-300 rounded-lg p-3"
            onPress={() => setDatePickerVisibility(true)}
          >
            <Text className="text-gray-700">
              {newPatient.date_of_birth
                ? format(newPatient.date_of_birth, "yyyy-MM-dd")
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

        <LabeledDisplayField
          label="Age"
          value={calculateAge(newPatient.date_of_birth) ? `${calculateAge(newPatient.date_of_birth)} years` : "Not specified"}
        />

        <View className="mb-4">
          <Text className="text-gray-500 text-sm mb-1">Weight (in Kg)</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 text-gray-700"
            keyboardType="numeric"
            value={newPatient?.weight?.toString() ?? ""}
            onChangeText={(text) =>
              setNewPatient((prev) =>
                prev ? { ...prev, weight: parseFloat(text) } : prev
              )
            }
          />
        </View>

        <View className="mb-4">
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
              className="flex flex-row justify-between items-center "
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
                <SelectItem label="Self" value="self" />
                <SelectItem label="Parent" value="parent" />
                <SelectItem label="Child" value="child" />
                <SelectItem label="Spouse" value="spouse" />
                <SelectItem label="Sibling" value="sibling" />
                <SelectItem label="Grandparent" value="grandparent" />
                <SelectItem label="Grandchild" value="grandchild" />
                <SelectItem label="Relative" value="relative" />
                <SelectItem label="Friend" value="friend" />
                <SelectItem label="Guardian" value="guardian" />
                <SelectItem label="Other" value="other" />
              </SelectContent>
            </SelectPortal>
          </Select>
        </View>

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
              className="flex flex-row justify-between items-center "
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

        <TouchableOpacity
          style={{ backgroundColor: palette.primary }}
          className=" py-3 rounded-lg"
          onPress={handleSave}
        >
          <Text className="text-white font-bold text-center">Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
