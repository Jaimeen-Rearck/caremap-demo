import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { ChevronLeft } from "lucide-react-native";
import palette from "@/utils/theme/color";
import Header from "@/components/shared/Header";
import { Divider } from "@/components/ui/divider";
import ActionPopover from "@/components/shared/ActionPopover";
import { SafeAreaView } from "react-native-safe-area-context";

import { PatientContext } from "@/context/PatientContext";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import { PatientEquipment } from "@/services/database/migrations/v1/schema_v1";
import {
  createPatientEquipment,
  deletePatientEquipment,
  getPatientEquipmentsByPatientId,
  updatePatientEquipment,
} from "@/services/core/PatientEquipmentService";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { router } from "expo-router";
import { CustomButton } from "@/components/shared/CustomButton";

export default function MedicalEquipmentScreen() {
  const { patient } = useContext(PatientContext);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PatientEquipment | null>(null);
  const [equipmentList, setEquipmentList] = useState<PatientEquipment[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PatientEquipment | null>(
    null
  );
  const showToast = useCustomToast();

  useEffect(() => {
    if (patient?.id) {
      getPatientEquipmentsByPatientId(patient.id).then(setEquipmentList);
    }
  }, [patient]);

  const handleAddOrUpdate = async (data: {
    name: string;
    equipment_description: string;
  }) => {
    if (!patient?.id) return;

    if (editingItem) {
      const updated = await updatePatientEquipment(
        {
          equipment_name: data.name,
          equipment_description: data.equipment_description,
        },
        { id: editingItem.id }
      );
      if (updated) {
        await refreshEquipmentList();

        showToast({
          title: "Equipment Updated",
          description: `"${data.name}" was successfully updated.`,
          action: "success",
        });
      }
    } else {
      const created = await createPatientEquipment({
        patient_id: patient.id,
        equipment_name: data.name,
        equipment_description: data.equipment_description,
      });
      if (created) {
        await refreshEquipmentList();

        showToast({
          title: "Equipment Added",
          description: `"${data.name}" has been added.`,
          action: "success",
        });
      }
    }

    setShowForm(false);
    setEditingItem(null);
  };
  const refreshEquipmentList = async () => {
    if (patient?.id) {
      const updatedList = await getPatientEquipmentsByPatientId(patient.id);
      setEquipmentList(updatedList);
    }
  };
  if (showForm) {
    return (
      <MedicalEquipmentForm
        onClose={() => {
          setShowForm(false);
          setEditingItem(null);
        }}
        onSave={handleAddOrUpdate}
        editingItem={editingItem}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        title="Medical Equipments"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
      />
      {/* <View className="p-4 bg-white flex-1">
        <Text
          style={{ color: palette.heading }}
          className="text-lg font-semibold mb-2"
        >
          Enter any medical devices or equipment that you rely on for daily
          living
        </Text>

        <View className="border-t border-gray-300 mb-4" />

        {equipmentList.map((item) => (
          <React.Fragment key={item.id}>
            <View className="flex-row items-start border border-gray-300 rounded-xl p-4 mb-4">
              <View className="ml-3 flex-1">
                <Text className="font-semibold text-base">
                  {item.equipment_name}
                </Text>
                <Text className="text-gray-500 text-base mt-1">
                  {item.equipment_description}
                </Text>
              </View>

              <ActionPopover
                onEdit={() => {
                  setEditingItem(item);
                  setShowForm(true);
                }}
                onDelete={() => {
                  setItemToDelete(item);
                  setShowDialog(true);
                }}
              />
            </View>
          </React.Fragment>
        ))}

        <Divider className="bg-gray-300" />

        <TouchableOpacity
          style={{ backgroundColor: palette.primary }}
          className="py-3 rounded-lg mt-2"
          onPress={() => setShowForm(true)}
        >
          <Text className="text-white font-bold text-center">
            Add medical equipment
          </Text>
        </TouchableOpacity>
      </View> */}
      <View className="pt-5 px-5 bg-white flex-1">
        <Text
          style={{ color: palette.heading }}
          className="text-xl font-semibold mb-2"
        >
          Enter any medical devices or equipment that you rely on for daily
          living
        </Text>

        <View className="border-t border-gray-300 mb-4" />

        <FlatList
          data={equipmentList}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={true}
          renderItem={({ item }) => (
            <View className="flex-row items-start border border-gray-300 rounded-xl p-4 mb-4">
              <View className="ml-3 flex-1">
                <Text className="font-semibold text-lg">
                  {item.equipment_name}
                </Text>
                <Text className="text-gray-500 text-lg mt-1">
                  {item.equipment_description}
                </Text>
              </View>

              <ActionPopover
                onEdit={() => {
                  setEditingItem(item);
                  setShowForm(true);
                }}
                onDelete={() => {
                  setItemToDelete(item);
                  setShowDialog(true);
                }}
              />
            </View>
          )}
          ListEmptyComponent={
            <Text className="text-gray-500 text-center my-4 text-lg">
              No medical equipment found.
            </Text>
          }
        />

        <Divider className="bg-gray-300 mb-2" />

        {/* <TouchableOpacity
          style={{ backgroundColor: palette.primary }}
          className="py-3 rounded-lg mt-2"
          onPress={() => setShowForm(true)}
        >
          <Text className="text-white font-bold text-center">
            Add medical equipment
          </Text>
        </TouchableOpacity> */}
        <CustomButton
          title="Add medical equipment"
          onPress={() => setShowForm(true)}
        />
      </View>

      <CustomAlertDialog
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false);
          setItemToDelete(null);
        }}
        title="Confirm Deletion"
        description={
          itemToDelete
            ? `Are you sure you want to delete "${itemToDelete.equipment_name}"?`
            : "Are you sure you want to delete this item?"
        }
        confirmButtonProps={{
          style: { backgroundColor: palette.primary, marginLeft: 8 },
        }}
        onConfirm={async () => {
          if (itemToDelete) {
            await deletePatientEquipment(itemToDelete.id);
            setEquipmentList((prev) =>
              prev.filter((eq) => eq.id !== itemToDelete.id)
            );
            showToast({
              title: "Equipment Deleted",
              description: `"${itemToDelete.equipment_name}" has been removed.`,
              action: "success",
            });
            setItemToDelete(null);
          }
          setShowDialog(false);
        }}
      />
    </SafeAreaView>
  );
}

function MedicalEquipmentForm({
  onClose,
  onSave,
  editingItem,
}: {
  onClose: () => void;
  onSave: (data: { name: string; equipment_description: string }) => void;
  editingItem?: PatientEquipment | null;
}) {
  const [name, setName] = useState(editingItem?.equipment_name || "");
  const [equipment_description, setEquipmentDescription] = useState(
    editingItem?.equipment_description || ""
  );

  const isSaveDisabled = !name.trim() || !equipment_description.trim();

  const handleSave = () => {
    if (!isSaveDisabled) {
      onSave({
        name: name.trim(),
        equipment_description: equipment_description.trim(),
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        title="Medical Equipments"
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text
            className="text-xl font-medium mb-3"
            style={{ color: palette.heading }}
          >
            {editingItem ? "Update" : "Add"} Medical Equipment
          </Text>

          <Text className="text-base mb-1 text-gray-600">Equipment Name</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Enter equipment name"
            value={name}
            onChangeText={setName}
          />

          <Text className="text-base mb-1 text-gray-600">
            Equipment Description
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Enter equipment description"
            value={equipment_description}
            onChangeText={setEquipmentDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </ScrollView>

        {/* Button */}
        <View className="px-5">
          <CustomButton
            title={editingItem ? "Update" : "Save"}
            disabled={isSaveDisabled}
            onPress={handleSave}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
