import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import palette from "@/utils/theme/color";
import {
  createSurgeryProcedure,
  getSurgeryProceduresByPatientId,
  updateSurgeryProcedure,
  deleteSurgeryProcedure,
} from "@/services/core/SurgeryProcedureService";
import { PatientContext } from "@/context/PatientContext";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import Header from "@/components/shared/Header";
import ActionPopover from "@/components/shared/ActionPopover";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { SurgeryProcedure } from "@/services/database/migrations/v1/schema_v1";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { CalendarDaysIcon, Icon } from "@/components/ui/icon";
import { KeyboardAvoidingView, Platform } from "react-native";
import { logger } from "@/services/logging/logger";
import { router } from "expo-router";
import { CustomButton } from "@/components/shared/CustomButton";
import { Divider } from "@/components/ui/divider";

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
      ("No patient id found");
      return;
    }
    try {
      const getSurgeryProcedures = await getSurgeryProceduresByPatientId(
        patient.id
      );
      setPatientSurgeries(getSurgeryProcedures);
    } catch (e) {
      logger.debug(String(e));
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
      <Header
        title="Surgeries/Procedure"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
      />

      <View className="px-5 pt-5 flex-1">
        <View className="flex-1">
          {/* Heading*/}
          <Text
            className="text-xl font-semibold"
            style={{ color: palette.heading }}
          >
            Past surgeries/procedures
          </Text>

          <Divider className="bg-gray-300 my-3" />

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

        <Divider className="bg-gray-300 mb-2" />

        {/* Add Button */}
        <CustomButton
          title="Add Surgery Details"
          onPress={() => setShowForm(true)}
        />
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

  const isDisabled = procedureName.trim().length === 0 || !dateOfSurgery;

  const handleSave = () => {
    if (isDisabled) return;
    handleAddUpdate({
      ...(editingItem?.id ? { id: editingItem.id } : {}),
      procedure_name: procedureName.trim(),
      facility: facilityName.trim(),
      complications: complications.trim(),
      surgeon_name: surgeonName.trim(),
      procedure_date: dateOfSurgery,
      details: procedureDesc.trim(),
    } as SurgeryProcedure);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <Header
        title="Surgeries/Procedure"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
        onBackPress={onClose}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        className="bg-white"
        // behavior={Platform.OS === "ios" ? "padding" : "height"}
        behavior={"padding"}
        // keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          className="px-5 pt-5 flex-1"
          contentContainerStyle={{
            paddingBottom: 30,
          }}
          keyboardShouldPersistTaps="handled"
          // keyboardDismissMode="on-drag"
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
              <Text className="text-gray-600 text-base mb-1">
                Procedure Name *
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
              <Text className="text-gray-600 text-base mb-1">
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
              <Text className="text-gray-600 text-base mb-1">
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
              <Text className="text-gray-600 text-base mb-1">
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
              <Text className="text-gray-600 text-base mb-1">
                Date of Surgery *
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
            <Text className="text-gray-500 mb-1 text-base">Description</Text>
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
        </ScrollView>
        {/* Save button */}
        <View className="px-5">
          <CustomButton
            title={editingItem ? "Update" : "Save"}
            onPress={() => {
              handleSave();
              onClose(); // Go back to list
            }}
            disabled={isDisabled}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
