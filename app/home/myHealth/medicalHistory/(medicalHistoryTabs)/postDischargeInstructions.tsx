import ActionPopover from "@/components/shared/ActionPopover";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import Header from "@/components/shared/Header";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { CalendarDaysIcon, Icon } from "@/components/ui/icon";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { PatientContext } from "@/context/PatientContext";
import {
  createDischargeInstruction,
  deleteDischargeInstruction,
  getDischargeInstructionsByPatientId,
  updateDischargeInstruction,
} from "@/services/core/DischargeInstructionService";
import { DischargeInstruction } from "@/services/database/migrations/v1/schema_v1";
import { logger } from "@/services/logging/logger";
import palette from "@/utils/theme/color";
import React, { useContext, useEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PostDischargeInstructions() {
  const { patient } = useContext(PatientContext);
  const [patientDischargeInstructions, setPatientDischargeInstructions] =
    useState<DischargeInstruction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<
    DischargeInstruction | undefined
  >(undefined);

  // for Alert while delete
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DischargeInstruction | null>(
    null
  );

  // Custom toast
  const showToast = useCustomToast();

  async function fetchDischargeInstructions() {
    if (!patient?.id) {
      logger.debug("No patient id found");
      return;
    }
    try {
      const getDischargeInstructions =
        await getDischargeInstructionsByPatientId(patient.id);

      setPatientDischargeInstructions(getDischargeInstructions);
    } catch (e) {
      logger.debug(`${e}`);
    }
  }

  useEffect(() => {
    fetchDischargeInstructions();
  }, [patient]);

  // Add/Update
  const handleAddUpdate = async (discharge: DischargeInstruction) => {
    if (!patient?.id) return;
    if (discharge.id) {
      //  edit
      await updateDischargeInstruction(
        {
          summary: discharge.summary,
          discharge_date: discharge.discharge_date,
          details: discharge.details,
        },
        { id: discharge.id }
      );
      await fetchDischargeInstructions();
      showToast({
        title: "Discharge updated",
        description: "Discharge instruction updated successfully!",
      });
    } else {
      // Add
      await createDischargeInstruction({
        patient_id: patient.id,
        summary: discharge.summary,
        discharge_date: discharge.discharge_date,
        details: discharge.details,
      });
      await fetchDischargeInstructions();
      showToast({
        title: "Discharge added",
        description: "Discharge instruction added successfully!",
      });
    }
  };

  // open edit form
  const handleEditForm = (discharge: DischargeInstruction) => {
    setEditingItem(discharge);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <AddUpdateFormPage
        onClose={() => {
          setShowForm(false);
          setEditingItem(undefined);
        }}
        handleAddUpdate={handleAddUpdate}
        editingItem={editingItem}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <Header title="Post Discharge Instruction" />

      <View className="px-6 pt-8 flex-1">
        <View className="flex-1">
          {/* Heading*/}
          <Text
            className="text-lg font-semibold"
            style={{ color: palette.heading }}
          >
            Discharge Summary
          </Text>

          {/* hr */}
          <View className="h-px bg-gray-300 my-3" />

          <View className="flex-1">
            <FlatList
              data={patientDischargeInstructions}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={true}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <Text className="text-gray-500">
                  No discharge instruction found.
                </Text>
              }
              style={{ minHeight: 50 }}
              renderItem={({ item }) => {
                return (
                  <View
                    className="border border-gray-300 rounded-lg mb-3 py-3 bg-white"
                    style={{ position: "relative" }}
                  >
                    {/* ActionPopover in top-right */}
                    <View
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 8,
                        zIndex: 1,
                      }}
                    >
                      <ActionPopover
                        onEdit={() => handleEditForm(item)}
                        onDelete={() => {
                          setItemToDelete(item);
                          setShowAlertDialog(true);
                        }}
                      />
                    </View>
                    <View className="pl-4 pr-10">
                      {/* Procedure Name */}
                      <View className="flex-row justify-between items-start mb-2">
                        <Text
                          className="font-medium text-base"
                          // style={{ flex: 1 }}
                        >
                          Summary:
                        </Text>
                        <Text
                          className="font-normal text-base leading-5 text-gray-600"
                          style={{
                            flexShrink: 1,
                            // flexWrap: "wrap",
                            textAlign: "left",
                            maxWidth: 180,
                          }}
                          // numberOfLines={2}
                          // ellipsizeMode="tail"
                        >
                          {item.summary}
                        </Text>
                      </View>
                      {/* Date of discharge */}
                      <View className="flex-row justify-between items-start mb-2">
                        <Text className="font-medium text-base">
                          Date of discharge:
                        </Text>
                        <Text
                          className="font-normal text-base leading-5 text-gray-600"
                          style={{
                            flexShrink: 1,
                            textAlign: "right",
                            maxWidth: 180,
                          }}
                        >
                          {item.discharge_date
                            ? new Date(item.discharge_date)
                                .toLocaleDateString("en-US", {
                                  month: "2-digit",
                                  day: "2-digit",
                                  year: "numeric",
                                })
                                .replace(/\//g, "-")
                            : ""}
                        </Text>
                      </View>
                      {/* Details */}
                      {item.details ? (
                        <Text className="text-base text-gray-500 leading-5">
                          {item.details}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              }}
            />
          </View>
        </View>

        {/* hr */}
        <View className="h-px bg-gray-300 mb-2" />

        {/* Add Button */}
        <TouchableOpacity
          className="rounded-md py-3 items-center mt-1"
          onPress={() => setShowForm(true)}
          style={{ backgroundColor: palette.primary }}
        >
          <Text className="text-white font-medium text-lg">
            Add Post Discharge Details
          </Text>
        </TouchableOpacity>
      </View>

      <CustomAlertDialog
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        description={itemToDelete?.summary}
        onConfirm={async () => {
          if (itemToDelete) {
            await deleteDischargeInstruction(itemToDelete.id);
            await fetchDischargeInstructions();
            showToast({
              title: "Discharge deleted",
              description: "Discharge instruction deleted successfully!",
            });
          }
          setShowAlertDialog(false);
          setItemToDelete(null);
        }}
      />
    </SafeAreaView>
  );
}

function AddUpdateFormPage({
  onClose,
  handleAddUpdate,
  editingItem,
}: {
  onClose: () => void;
  handleAddUpdate: (discharge: DischargeInstruction) => void;
  editingItem?: DischargeInstruction;
}) {
  const [dischargeSummary, setDischargeSummary] = useState(
    editingItem?.summary || ""
  );

  const [dateOfDischarge, setDateOfDischarge] = useState<Date | null>(
    editingItem?.discharge_date ? new Date(editingItem.discharge_date) : null
  );
  const [dischargeDesc, setDischargeDesc] = useState(
    editingItem?.details || ""
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Helper to format date as MM-DD-YY
  const formatDate = (date: Date) => {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    // const yy = String(date.getFullYear()).slice(-2);
    const yy = String(date.getFullYear());
    return `${mm}-${dd}-${yy}`;
  };

  const handleDateConfirm = (date: Date) => {
    setDateOfDischarge(date);
    setShowDatePicker(false);
  };

  const handleSave = () => {
    if (dischargeSummary.trim() && dateOfDischarge) {
      handleAddUpdate({
        ...(editingItem?.id ? { id: editingItem.id } : {}),
        summary: dischargeSummary.trim(),
        discharge_date: dateOfDischarge,
        details: dischargeDesc.trim(),
      } as DischargeInstruction);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <Header title="Post Discharge Instruction" onBackPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          <ScrollView
            className="px-6 pt-8 pb-0 flex-1"
            contentContainerStyle={{
              paddingBottom: 48,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            <View className="flex-1">
              <Text
                className="text-lg font-medium mb-3"
                style={{ color: palette.heading }}
              >
                {editingItem
                  ? "Update discharge summary"
                  : "Add discharge summary"}
              </Text>
              {/* Discharge summary */}
              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-1">Summary</Text>
                <TextInput
                  value={dischargeSummary}
                  onChangeText={setDischargeSummary}
                  placeholder="Enter discharge summary"
                  className="border border-gray-300 rounded-md px-3 py-3 text-base"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
              {/* Date of discharge*/}
              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-1">
                  Date of discharge
                </Text>
                <TouchableOpacity
                  className="border border-gray-300 rounded-md px-3"
                  onPress={() => setShowDatePicker(true)}
                >
                  <View className="flex-row items-center">
                    <TextInput
                      value={dateOfDischarge ? formatDate(dateOfDischarge) : ""}
                      placeholder="MM-DD-YY"
                      className="flex-1 text-base"
                      editable={false}
                      pointerEvents="none"
                    />
                    <Icon
                      as={CalendarDaysIcon}
                      className="text-typography-500 m-1 w-5 h-5"
                    />
                  </View>
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={showDatePicker}
                  mode="date"
                  onConfirm={handleDateConfirm}
                  onCancel={() => setShowDatePicker(false)}
                  // minimumDate={new Date()} // Prevent selecting past dates
                />
              </View>
              {/* Details */}
              <Text className="text-gray-500 mb-1 text-sm">Description</Text>
              <Textarea
                size="md"
                isReadOnly={false}
                isInvalid={false}
                isDisabled={false}
                className="w-full"
              >
                <TextareaInput
                  placeholder="Enter description"
                  style={{ textAlignVertical: "top", fontSize: 16 }}
                  value={dischargeDesc}
                  onChangeText={setDischargeDesc}
                />
              </Textarea>
            </View>
            {/* Save button */}
          </ScrollView>
          <View className="px-6 mb-4">
            <TouchableOpacity
              className="py-3 rounded-md mt-3"
              style={{ backgroundColor: palette.primary }}
              onPress={() => {
                handleSave();
                onClose(); // Go back to list
              }}
            >
              <Text className="text-white font-bold text-center">
                {editingItem ? "Update" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
