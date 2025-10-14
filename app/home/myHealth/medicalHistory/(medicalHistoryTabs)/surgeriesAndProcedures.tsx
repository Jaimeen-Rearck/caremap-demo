import ActionPopover from "@/components/shared/ActionPopover";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import Header from "@/components/shared/Header";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { CalendarDaysIcon, Icon } from "@/components/ui/icon";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { PatientContext } from "@/context/PatientContext";
import {
  createSurgeryProcedure,
  deleteSurgeryProcedure,
  getSurgeryProceduresByPatientId,
  updateSurgeryProcedure,
} from "@/services/core/SurgeryProcedureService";
import { SurgeryProcedure } from "@/services/database/migrations/v1/schema_v1";
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

export default function SurgeriesProcedures() {
  const { patient } = useContext(PatientContext);
  const [patientSurgeries, setPatientSurgeries] = useState<SurgeryProcedure[]>(
    []
  );
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<SurgeryProcedure | undefined>(
    undefined
  );

  // for Alert while delete
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<SurgeryProcedure | null>(
    null
  );

  // Custom toast
  const showToast = useCustomToast();

  async function fetchSurgeryProcedures() {
    if (!patient?.id) {
      logger.debug("No patient id found");
      return;
    }
    try {
      const getSurgeryProcedures = await getSurgeryProceduresByPatientId(
        patient.id
      );
      setPatientSurgeries(getSurgeryProcedures);
    } catch (e) {
      logger.debug(`${e}`);
    }
  }

  useEffect(() => {
    fetchSurgeryProcedures();
  }, [patient]);

  // Add/Update
  const handleAddUpdate = async (surgery: SurgeryProcedure) => {
    if (!patient?.id) return;
    if (surgery.id) {
      //  edit
      await updateSurgeryProcedure(
        {
          procedure_name: surgery.procedure_name,
          facility: surgery.facility,
          complications: surgery.complications,
          surgeon_name: surgery.surgeon_name,
          procedure_date: surgery.procedure_date,
          details: surgery.details,
        },
        { id: surgery.id }
      );
      await fetchSurgeryProcedures();
      showToast({
        title: "Surgery updated",
        description: "Surgery updated successfully!",
      });
    } else {
      // Add
      await createSurgeryProcedure({
        patient_id: patient.id,
        procedure_name: surgery.procedure_name,
        facility: surgery.facility,
        complications: surgery.complications,
        surgeon_name: surgery.surgeon_name,
        procedure_date: surgery.procedure_date,
        details: surgery.details,
      });
      await fetchSurgeryProcedures();
      showToast({
        title: "Surgery added",
        description: "Surgery added successfully!",
      });
    }
  };

  // open edit form
  const handleEditForm = (surgery: SurgeryProcedure) => {
    setEditingItem(surgery);
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
      <Header title="Surgeries / Procedures" />

      <View className="px-6 pt-8 flex-1">
        <View className="flex-1">
          {/* Heading*/}
          <Text
            className="text-lg font-semibold"
            style={{ color: palette.heading }}
          >
            Past surgeries/procedures
          </Text>

          {/* hr */}
          <View className="h-px bg-gray-300 my-3" />

          <View className="flex-1">
            <FlatList
              data={patientSurgeries}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={true}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <Text className="text-gray-500">
                  No surgery/procedure found.
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
                          Procedure Name:
                        </Text>
                        <Text
                          className="font-normal text-base leading-5 text-gray-600"
                          style={{
                            flexShrink: 1,
                            // flexWrap: "wrap",
                            textAlign: "right",
                            maxWidth: 180,
                          }}
                          // numberOfLines={2}
                          // ellipsizeMode="tail"
                        >
                          {item.procedure_name}
                        </Text>
                      </View>
                      {/* Facility */}
                      {item.facility ? (
                        <View className="flex-row justify-between items-start mb-2">
                          <Text className="font-medium text-base">
                            Facility:
                          </Text>
                          <Text
                            className="font-normal text-base leading-5 text-gray-600"
                            style={{
                              flexShrink: 1,
                              textAlign: "right",
                              maxWidth: 180,
                            }}
                          >
                            {item.facility}
                          </Text>
                        </View>
                      ) : null}
                      {/* Complications */}
                      {item.complications ? (
                        <View className="flex-row justify-between items-start mb-2">
                          <Text className="font-medium text-base">
                            Complications:
                          </Text>
                          <Text
                            className="font-normal text-base leading-5 text-gray-600"
                            style={{
                              flexShrink: 1,
                              textAlign: "right",
                              maxWidth: 180,
                            }}
                          >
                            {item.complications}
                          </Text>
                        </View>
                      ) : null}
                      {/* Surgeon Name */}
                      {item.surgeon_name ? (
                        <View className="flex-row justify-between items-start mb-2">
                          <Text className="font-medium text-base">
                            Surgeon’s Name:
                          </Text>
                          <Text
                            className="font-normal text-base leading-5 text-gray-600"
                            style={{
                              flexShrink: 1,
                              textAlign: "right",
                              maxWidth: 180,
                            }}
                          >
                            {item.surgeon_name}
                          </Text>
                        </View>
                      ) : null}
                      {/* Date of Surgery */}
                      <View className="flex-row justify-between items-start mb-2">
                        <Text className="font-medium text-base">
                          Date of surgery:
                        </Text>
                        <Text
                          className="font-normal text-base leading-5 text-gray-600"
                          style={{
                            flexShrink: 1,
                            textAlign: "right",
                            maxWidth: 180,
                          }}
                        >
                          {item.procedure_date
                            ? new Date(item.procedure_date)
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
            Add Surgery Details
          </Text>
        </TouchableOpacity>
      </View>

      <CustomAlertDialog
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        description={itemToDelete?.procedure_name}
        onConfirm={async () => {
          if (itemToDelete) {
            await deleteSurgeryProcedure(itemToDelete.id);
            await fetchSurgeryProcedures();
            showToast({
              title: "Surgery deleted",
              description: "Surgery deleted successfully!",
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
  handleAddUpdate: (surgery: SurgeryProcedure) => void;
  editingItem?: SurgeryProcedure;
}) {
  const [procedureName, setProcedureName] = useState(
    editingItem?.procedure_name || ""
  );
  const [facilityName, setFacilityName] = useState(editingItem?.facility || "");
  const [complications, setComplications] = useState(
    editingItem?.complications || ""
  );
  const [surgeonName, setSurgeonName] = useState(
    editingItem?.surgeon_name || ""
  );
  const [dateOfSurgery, setDateOfSurgery] = useState<Date | null>(
    editingItem?.procedure_date ? new Date(editingItem.procedure_date) : null
  );
  const [procedureDesc, setProcedureDesc] = useState(
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
    setDateOfSurgery(date);
    setShowDatePicker(false);
  };

  const handleSave = () => {
    if (procedureName.trim() && dateOfSurgery) {
      handleAddUpdate({
        ...(editingItem?.id ? { id: editingItem.id } : {}),
        procedure_name: procedureName.trim(),
        facility: facilityName.trim(),
        complications: complications.trim(),
        surgeon_name: surgeonName.trim(),
        procedure_date: dateOfSurgery,
        details: procedureDesc.trim(),
      } as SurgeryProcedure);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <Header title="Surgeries / Procedures" onBackPress={onClose} />
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
                  ? "Update details of recent hospitalizations"
                  : "Enter details of recent hospitalizations"}
              </Text>
              {/* Prodedure Name */}
              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-1">
                  Procedure Name
                </Text>
                <TextInput
                  value={procedureName}
                  onChangeText={setProcedureName}
                  placeholder="Please Enter your topic here"
                  className="border border-gray-300 rounded-md px-3 py-3 text-base"
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>

              {/* Facility Name */}
              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-1">
                  Facility Name, City
                </Text>
                <TextInput
                  value={facilityName}
                  onChangeText={setFacilityName}
                  placeholder="Please Enter your topic here"
                  className="border border-gray-300 rounded-md px-3 py-3 text-base"
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>
              {/* Complications */}
              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-1">
                  Complications
                </Text>
                <TextInput
                  value={complications}
                  onChangeText={setComplications}
                  placeholder="Please enter complications here"
                  className="border border-gray-300 rounded-md px-3 py-3 text-base"
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>
              {/* Surgeon name */}
              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-1">
                  Surgeon's Name
                </Text>
                <TextInput
                  value={surgeonName}
                  onChangeText={setSurgeonName}
                  placeholder="Please Enter surgeon's name"
                  className="border border-gray-300 rounded-md px-3 py-3 text-base"
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>
              {/* Date of Surgery*/}
              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-1">
                  Date of Surgery
                </Text>
                <TouchableOpacity
                  className="border border-gray-300 rounded-md px-3"
                  onPress={() => setShowDatePicker(true)}
                >
                  <View className="flex-row items-center">
                    <TextInput
                      value={dateOfSurgery ? formatDate(dateOfSurgery) : ""}
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
                  value={procedureDesc}
                  onChangeText={setProcedureDesc}
                />
              </Textarea>
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
                {editingItem ? "Update" : "Save"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
