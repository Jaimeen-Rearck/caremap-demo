import ActionPopover from "@/components/shared/ActionPopover";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import Header from "@/components/shared/Header";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { Spinner } from "@/components/ui/spinner";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { PatientContext } from "@/context/PatientContext";
import {
  createPatientCondition,
  deletePatientCondition,
  getPatientConditionsByPatientId,
  updatePatientCondition,
} from "@/services/core/PatientConditionService";
import { PatientCondition } from "@/services/database/migrations/v1/schema_v1";
import { logger } from "@/services/logging/logger";
import palette from "@/utils/theme/color";
import React, { useContext, useEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const linkedHealthSystem = [
  "Attention Deficient and Hyperactivity Disorder (ADHD)",
  "Irritable Bowel Syndrome (IBS)",
];

export default function MedicalConditions() {
  const { patient } = useContext(PatientContext);
  const [userConditions, setUserConditions] = useState<PatientCondition[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCondition, setEditingCondition] = useState<
    PatientCondition | undefined
  >(undefined);
  const [loading, setLoading] = useState(false);

  // for Alert while delete
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [conditionToDelete, setConditionToDelete] =
    useState<PatientCondition | null>(null);

  // Custom toast
  const showToast = useCustomToast();

  const fetchConditions = async () => {
    if (!patient?.id) {
      logger.debug("No patient id found");
      return;
    }
    setLoading(true);
    try {
      const conditions = await getPatientConditionsByPatientId(patient.id);
      setUserConditions(conditions);
    } catch (e) {
      logger.debug(`${e}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConditions();
  }, [patient]);

  // add/update medicalCondition
  const handleAddUpdateMedicalCondition = async (condition: {
    id?: number;
    condition_name: string;
  }) => {
    if (!patient?.id) return;
    if (condition.id) {
      //edit
      await updatePatientCondition(
        { condition_name: condition.condition_name }, // fields to update
        { id: condition.id } // where clause
      );
      await fetchConditions(); // Refresh list after editing
      showToast({
        title: "Condition updated",
        description: "Medical condition updated successfully!",
      });
    } else {
      // Add new condition
      await createPatientCondition({
        patient_id: patient.id,
        condition_name: condition.condition_name,
      });
      await fetchConditions(); // Refresh list after adding
      showToast({
        title: "Condition added",
        description: "Medical condition added successfully!",
      });
    }
  };

  // open edit form
  const handleEdit = (condition: PatientCondition) => {
    setEditingCondition(condition);
    setShowAddForm(true);
  };

  if (showAddForm) {
    return (
      <AddMedicalConditionsPage
        onClose={() => {
          setShowAddForm(false);
          setEditingCondition(undefined);
        }}
        handleAddUpdateMedicalCondition={handleAddUpdateMedicalCondition}
        editingCondition={editingCondition}
      />
    );
  }

  // Format date for display
  function getFormattedConditionDate(condition: PatientCondition): string {
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
      <Header title="Medical Conditions" />

      <View className="px-6 pt-4 flex-1">
        {/* Linked Health System */}
        <View className="mb-6 mt-4">
          <Text
            className="text-lg font-semibold"
            style={{ color: palette.heading }}
          >
            Medical Conditions (Linked Health System)
          </Text>

          {/* hr */}
          <View className="h-px bg-gray-300 my-3" />

          <View>
            <FlatList
              data={linkedHealthSystem}
              renderItem={({ item }) => (
                <View className="border border-gray-200 rounded-lg p-2 bg-gray-100 mb-3">
                  <Text className="text-lg">{item}</Text>
                </View>
              )}
              keyExtractor={(_, index) => index.toString()}
              ListEmptyComponent={
                <Text className="text-gray-500">
                  No user linked health system found.
                </Text>
              }
              showsVerticalScrollIndicator={true}
              scrollEnabled={true}
              style={{ minHeight: 50, maxHeight: 160 }}
            />
          </View>
        </View>

        {/* User Entered */}
        <View>
          <Text
            className="text-lg font-semibold"
            style={{ color: palette.heading }}
          >
            Medical Conditions (User entered)
          </Text>

          {/* hr */}
          <View className="h-px bg-gray-300 my-3" />

          <View>
            {loading ? (
              <View className="justify-center items-center min-h-[120px]">
                <Spinner size="large" color={palette.primary} />
                <Text className="mt-5">Loading...</Text>
              </View>
            ) : (
              <FlatList
                data={userConditions}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={true}
                showsVerticalScrollIndicator={true}
                renderItem={({ item }) => {
                  const formattedDate = getFormattedConditionDate(item);
                  return (
                    <View className="flex-row items-center justify-between border border-gray-300 rounded-lg px-3 py-3 mb-3">
                      <View className="flex-row items-center space-x-2">
                        <Text className="text-lg ml-3 max-w-[220px] text-left">
                          {item.condition_name}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-lg text-gray-500 mr-3">
                          {formattedDate}
                        </Text>
                        <ActionPopover
                          onEdit={() => {
                            handleEdit(item);
                          }}
                          onDelete={() => {
                            setConditionToDelete(item);
                            setShowAlertDialog(true);
                          }}
                        />
                      </View>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <Text className="text-gray-500">
                    No Medical conditions found.
                  </Text>
                }
                style={{ minHeight: 50, maxHeight: 250 }}
              />
            )}
          </View>
        </View>

        {/* hr */}
        <View className="h-px bg-gray-300 mb-2" />

        {/* Add Condition Button */}
        <TouchableOpacity
          className="rounded-md py-3 items-center mt-1"
          onPress={() => setShowAddForm(true)}
          style={{ backgroundColor: palette.primary }}
        >
          <Text className="text-white font-medium text-lg">
            Add medical condition
          </Text>
        </TouchableOpacity>
      </View>

      <CustomAlertDialog
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        description={conditionToDelete?.condition_name}
        onConfirm={async () => {
          if (conditionToDelete) {
            await deletePatientCondition(conditionToDelete.id);
            await fetchConditions();
            showToast({
              title: "Condition deleted",
              description: "Medical condition deleted successfully!",
            });
          }
          setShowAlertDialog(false);
          setConditionToDelete(null);
        }}
      >
        {/* children prop */}
      </CustomAlertDialog>
    </SafeAreaView>
  );
}

function AddMedicalConditionsPage({
  onClose,
  handleAddUpdateMedicalCondition,
  editingCondition,
}: {
  onClose: () => void;
  handleAddUpdateMedicalCondition: (condition: {
    id?: number;
    condition_name: string;
  }) => void;
  editingCondition?: { id: number; condition_name: string };
}) {
  const [condition, setCondition] = useState(
    editingCondition?.condition_name || ""
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <Header title="Medical Conditions" onBackPress={onClose} />

        <View className="px-6 py-8">
          <Text
            className="text-lg font-medium mb-3"
            style={{ color: palette.heading }}
          >
            {editingCondition
              ? "Update your current medical condition"
              : "Add your current medical condition"}
          </Text>

          <Textarea
            size="md"
            isReadOnly={false}
            isInvalid={false}
            isDisabled={false}
            className="w-full"
          >
            <TextareaInput
              placeholder="Enter condition"
              style={{ textAlignVertical: "top", fontSize: 16 }}
              value={condition}
              onChangeText={setCondition}
            />
          </Textarea>

          <TouchableOpacity
            className="py-3 rounded-md mt-3"
            style={{ backgroundColor: palette.primary }}
            onPress={() => {
              if (condition.trim()) {
                handleAddUpdateMedicalCondition({
                  id: editingCondition?.id,
                  condition_name: condition.trim(),
                });
              }
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
