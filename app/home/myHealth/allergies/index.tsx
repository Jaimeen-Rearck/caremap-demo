import ActionPopover from "@/components/shared/ActionPopover";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import Header from "@/components/shared/Header";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { PatientContext } from "@/context/PatientContext";
import {
  createPatientAllergy,
  deletePatientAllergy,
  getPatientAllergiesByPatientId,
  updatePatientAllergy,
} from "@/services/core/PatientAllergyService";
import { PatientAllergy } from "@/services/database/migrations/v1/schema_v1";
import { logger } from "@/services/logging/logger";
import palette from "@/utils/theme/color";
import React, { useContext, useEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Allergies() {
  const { patient } = useContext(PatientContext);
  const [patientAllergy, setPatientAllergy] = useState<PatientAllergy[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCondition, setEditingCondition] = useState<
    PatientAllergy | undefined
  >(undefined);

  // for Alert while delete
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [allergyToDelete, setAllergyToDelete] = useState<PatientAllergy | null>(
    null
  );

  // Custom toast
  const showToast = useCustomToast();

  async function fetchAllergies() {
    if (!patient?.id) {
      logger.debug("No patient id found");
      return;
    }
    try {
      const allergies = await getPatientAllergiesByPatientId(patient.id);
      setPatientAllergy(allergies);
    } catch (e) {
      logger.debug(`${e}`);
    }
  }

  useEffect(() => {
    fetchAllergies();
  }, [patient]);

  // Add/Update allergy
  const handleAddUpdateAllergy = async (allergy: PatientAllergy) => {
    if (!patient?.id) return;
    if (allergy.id) {
      //  edit exsiting allergy
      await updatePatientAllergy(
        {
          topic: allergy.topic,
          severity: allergy.severity,
          details: allergy.details,
        },
        { id: allergy.id }
      );
      await fetchAllergies();
      showToast({
        title: "Allergy updated",
        description: "Allergy updated successfully!",
      });
    } else {
      // Add new allergy
      await createPatientAllergy({
        patient_id: patient.id,
        topic: allergy.topic,
        details: allergy.details,
        severity: allergy.severity,
      });
      await fetchAllergies();
      showToast({
        title: "Allergy deleted",
        description: "Allergy deleted successfully!",
      });
    }
  };

  // open edit form
  const handleEditAllergy = (allergy: PatientAllergy) => {
    setEditingCondition(allergy);
    setShowAddForm(true);
  };

  if (showAddForm) {
    return (
      <AddAllergyPage
        onClose={() => {
          setShowAddForm(false);
          setEditingCondition(undefined);
        }}
        handleAddUpdateAllergy={handleAddUpdateAllergy}
        editingCondition={editingCondition}
      />
    );
  }

  // Format date for display
  function getFormattedConditionDate(condition: PatientAllergy): string {
    const showUpdated =
      condition.updated_date &&
      condition.updated_date !== condition.created_date;
    const dateToShow = showUpdated
      ? condition.updated_date
      : condition.created_date;
    return dateToShow
      ? new Date(dateToShow)
          .toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "2-digit",
          })
          .replace(/\//g, "-")
      : "";
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <Header title="Allergies" />

      <View className="px-6 pt-8 flex-1">
        <View>
          <Text
            className="text-lg font-semibold"
            style={{ color: palette.heading }}
          >
            Allergies (linked Health System)
          </Text>
          <Text className="text-gray-500">
            Select ones to review with your care team
          </Text>
          {/* hr */}
          <View className="h-px bg-gray-300 my-3" />
        </View>

        <View>
          <Text
            className="text-lg font-semibold"
            style={{ color: palette.heading }}
          >
            List your Allergies
          </Text>

          {/* hr */}
          <View className="h-px bg-gray-300 my-3" />
          <View>
            <FlatList
              data={patientAllergy}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={true}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => {
                const formattedDate = getFormattedConditionDate(item);
                return (
                  <View className="border border-gray-300 rounded-lg mb-3 px-3 py-3">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center space-x-2">
                        <Text className="text-lg ml-3 max-w-[220px] text-left">
                          {item.topic}
                        </Text>
                      </View>
                      <View className="flex-row">
                        <Text className="text-lg text-gray-500 mr-3">
                          {formattedDate}
                        </Text>

                        <ActionPopover
                          onEdit={() => {
                            handleEditAllergy(item);
                          }}
                          onDelete={() => {
                            setAllergyToDelete(item);
                            setShowAlertDialog(true);
                          }}
                        />
                      </View>
                    </View>
                    {item.details ? (
                      <View className="px-3 mt-1">
                        <Text className="text-base text-gray-700">
                          {item.details}
                        </Text>
                      </View>
                    ) : null}
                    {item.severity ? (
                      <View className="px-3 mt-1">
                        <Text className="text-base text-gray-700">
                          Severity: {item.severity}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              }}
              ListEmptyComponent={
                <Text className="text-gray-500">No Allergies found.</Text>
              }
              style={{ minHeight: 50, maxHeight: 300 }}
            />
          </View>
        </View>

        {/* hr */}
        <View className="h-px bg-gray-300 mb-2" />

        {/* Add Button */}
        <TouchableOpacity
          className="rounded-md py-3 items-center mt-1"
          onPress={() => setShowAddForm(true)}
          style={{ backgroundColor: palette.primary }}
        >
          <Text className="text-white font-medium text-lg">Add Allergy</Text>
        </TouchableOpacity>
      </View>

      <CustomAlertDialog
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        description={allergyToDelete?.topic}
        onConfirm={async () => {
          if (allergyToDelete) {
            await deletePatientAllergy(allergyToDelete.id);
            await fetchAllergies();
            showToast({
              title: "Allergy deleted",
              description: "Allergy has deleted successfully!",
            });
          }
          setShowAlertDialog(false);
          setAllergyToDelete(null);
        }}
      />
    </SafeAreaView>
  );
}

function AddAllergyPage({
  onClose,
  handleAddUpdateAllergy,
  editingCondition,
}: {
  onClose: () => void;
  handleAddUpdateAllergy: (allergy: PatientAllergy) => void;
  editingCondition?: PatientAllergy;
}) {
  const [topic, setTopic] = useState(editingCondition?.topic || "");
  const [details, setDetails] = useState(editingCondition?.details || "");

  const [severity, setSeverity] = useState<string | undefined>(
    editingCondition?.severity || ""
  );

  const handleSave = () => {
    if (topic.trim()) {
      handleAddUpdateAllergy({
        ...(editingCondition?.id ? { id: editingCondition.id } : {}),
        topic: topic.trim(),
        details: details.trim(),
        ...(severity ? { severity } : {}),
      } as PatientAllergy);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <Header title="Allergies" onBackPress={onClose} />

        <View className="px-6 py-8">
          <Text
            className="text-lg font-medium mb-3"
            style={{ color: palette.heading }}
          >
            {editingCondition ? "Update Allergy" : " Add Allergy"}
          </Text>

          {/* Enter Topic */}
          <View className="mb-4">
            <Text className="text-gray-600 text-sm mb-2">Enter Topic</Text>
            <TextInput
              value={topic}
              onChangeText={setTopic}
              placeholder="Please Enter your topic here"
              className="border border-gray-300 rounded-md px-3 py-3 text-base"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Details */}
          <Text className="text-gray-500 mb-2 text-sm">Details</Text>
          <Textarea
            size="md"
            isReadOnly={false}
            isInvalid={false}
            isDisabled={false}
            className="w-full"
          >
            <TextareaInput
              placeholder="Enter details"
              style={{ textAlignVertical: "top", fontSize: 16 }}
              value={details}
              onChangeText={setDetails}
            />
          </Textarea>

          {/* Severity */}
          <Text className="text-gray-600 text-sm mb-2 mt-4">Severity</Text>
          <View style={{ width: "70%", alignSelf: "flex-start" }}>
            <View
              className="flex-row border rounded-lg overflow-hidden mb-2"
              style={{ borderColor: palette.primary }}
            >
              {["Mild", "Moderate", "Severe"].map((level, idx) => (
                <TouchableOpacity
                  key={level}
                  style={{
                    flex: 1,
                    backgroundColor:
                      severity === level ? palette.primary : "white",
                    borderRightWidth: idx < 2 ? 1 : 0,
                    borderColor: palette.primary,
                    paddingVertical: 10,
                    paddingHorizontal: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={() => setSeverity(level)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: severity === level ? "white" : palette.primary,
                      fontWeight: "bold",
                    }}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save button */}
          <TouchableOpacity
            className="py-3 rounded-md mt-3"
            style={{ backgroundColor: palette.primary }}
            onPress={() => {
              handleSave();
              onClose(); // Go back to list
            }}
          >
            <Text className="text-white font-bold text-center">
              {editingCondition ? "Update" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
