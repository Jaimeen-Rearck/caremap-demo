import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import palette from "@/utils/theme/color";
import Header from "@/components/shared/Header";
import { Divider } from "@/components/ui/divider";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { PatientContext } from "@/context/PatientContext";
import { PatientMedication } from "@/services/database/migrations/v1/schema_v1";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";

import ActionPopover from "@/components/shared/ActionPopover";
import {
  createPatientMedication,
  getPatientMedicationsByPatientId,
  updatePatientMedication,
  deletePatientMedication,
} from "@/services/core/PatientMedicationService";

export default function MedicationsScreen() {
  const { patient } = useContext(PatientContext);
  const [medicationList, setMedicationList] = useState<PatientMedication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PatientMedication | null>(
    null
  );
  const [showDialog, setShowDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PatientMedication | null>(
    null
  );
  const showToast = useCustomToast();

  useEffect(() => {
    if (patient?.id) {
      getPatientMedicationsByPatientId(patient.id).then(setMedicationList);
    }
  }, [patient]);

  const handleAddOrUpdate = async (data: { name: string; details: string }) => {
    if (!patient?.id) return;

    if (editingItem) {
      const updated = await updatePatientMedication(
        {
          name: data.name,
          details: data.details,
        },
        { id: editingItem.id }
      );
      if (updated) {
        await refreshCareList();
        showToast({
          title: "Updated",
          description: `\"${data.name}\" was updated successfully.`,
          action: "success",
        });
      }
    } else {
      const created = await createPatientMedication({
        patient_id: patient.id,
        name: data.name,
        details: data.details,
      });
      if (created) {
        await refreshCareList();
        showToast({
          title: "Added",
          description: `\"${data.name}\" was added successfully.`,
          action: "success",
        });
      }
    }

    setShowForm(false);
    setEditingItem(null);
  };

  const refreshCareList = async () => {
    if (patient?.id) {
      const updatedList = await getPatientMedicationsByPatientId(patient.id);
      setMedicationList(updatedList);
    }
  };

  if (showForm) {
    return (
      <EmergencyCareForm
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
      <Header title="Medications" />

      <View className="p-4 bg-white flex-1">
          <Text
          style={{ color: palette.heading }}
          className="text-lg font-semibold mb-2"
        >
          Medications (Linked Health System)
        </Text>
        <Text className="text-gray-500 mb-3">
          Select ones to review with your care team{" "}
        </Text>
         <Divider className="bg-gray-300" />
         <Text
          style={{ color: palette.heading }}
          className="text-lg font-semibold mb-4"
        >
         List your active medications
        </Text>
        <Divider className="bg-gray-300" />

        <FlatList
        className="mt-2"
          data={medicationList}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={true}
          renderItem={({ item }) => (
            <View className="flex-row items-start border border-gray-300 rounded-xl p-4 mb-4">
              <View className="ml-3 flex-1">
                <Text className="font-semibold text-base">{item.name}</Text>
                <Text className="text-gray-500 text-sm mt-1">
                  {item.details}
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
            <Text className="text-gray-500 text-center my-4">
              No Medication found.
             
            </Text>
          }
        />

        <Divider className="bg-gray-300" />

        <TouchableOpacity
          style={{ backgroundColor: palette.primary }}
          className="py-3 rounded-lg mt-2"
          onPress={() => setShowForm(true)}
        >
          <Text className="text-white font-bold text-center">
            
             Add current medications
          </Text>
        </TouchableOpacity>
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
            ? `Are you sure you want to delete \"${itemToDelete.name}\"?`
            : "Are you sure you want to delete this item?"
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonProps={{
          style: { backgroundColor: palette.primary, marginLeft: 8 },
        }}
        cancelButtonProps={{ variant: "outline" }}
        onConfirm={async () => {
          if (itemToDelete) {
            await deletePatientMedication(itemToDelete.id);
            setMedicationList((prev) =>
              prev.filter((eq) => eq.id !== itemToDelete.id)
            );
            showToast({
              title: "Deleted",
              description: `\"${itemToDelete.name}\" was removed successfully.`,
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

function EmergencyCareForm({
  onClose,
  onSave,
  editingItem,
}: {
  onClose: () => void;
  onSave: (data: { name: string; details: string }) => void;
  editingItem?: PatientMedication | null;
}) {
  const [name, setName] = useState(editingItem?.name || "");
  const [details, setGuidance] = useState(editingItem?.details || "");

  const isSaveDisabled = !name.trim() || !details.trim();

  const handleSave = () => {
    if (!isSaveDisabled) {
      onSave({
        name: name.trim(),
        details: details.trim(),
      });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView className="flex-1 bg-white">
        <View
          className="py-3 flex-row items-center"
          style={{ backgroundColor: palette.primary }}
        >
          <TouchableOpacity onPress={onClose} className="p-2 ml-2">
            <ChevronLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-xl text-white font-bold ml-4">
            {editingItem ? "Edit" : "Add"} Medications
          </Text>
        </View>

        <View className="px-6 py-8">
          <Text
            className="text-lg font-medium mb-3"
            style={{ color: palette.heading }}
          >
            {editingItem ? "Edit" : "Add"} Medications 
          </Text>

          <Text className="text-sm mb-1 text-gray-600">Medications Name</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Enter medication name"
            value={name}
            onChangeText={setName}
          />

          <Text className="text-sm mb-1 text-gray-600">Medications detail</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Enter guidance steps"
            value={details}
            onChangeText={setGuidance}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            className={`py-3 rounded-lg ${isSaveDisabled ? "opacity-50" : ""}`}
            disabled={isSaveDisabled}
            style={{ backgroundColor: palette.primary }}
            onPress={handleSave}
          >
            <Text className="text-white font-bold text-center">Save</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
