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
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import palette from "@/utils/theme/color";
import Header from "@/components/shared/Header";
import { Divider } from "@/components/ui/divider";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { PatientContext } from "@/context/PatientContext";
import { PatientEmergencyCare } from "@/services/database/migrations/v1/schema_v1";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";

import ActionPopover from "@/components/shared/ActionPopover";
import {
  createPatientEmergencyCare,
  deletePatientEmergencyCare,
  getPatientEmergencyCaresByPatientId,
  updatePatientEmergencyCare,
} from "@/services/core/PatientEmergencyCareService";
import { router } from "expo-router";
import { CustomButton } from "@/components/shared/CustomButton";

export default function EmergencyCareScreen() {
  const { patient } = useContext(PatientContext);
  const [careList, setCareList] = useState<PatientEmergencyCare[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PatientEmergencyCare | null>(
    null
  );
  const [showDialog, setShowDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PatientEmergencyCare | null>(
    null
  );
  const showToast = useCustomToast();

  useEffect(() => {
    if (patient?.id) {
      getPatientEmergencyCaresByPatientId(patient.id).then(setCareList);
    }
  }, [patient]);

  const handleAddOrUpdate = async (data: {
    name: string;
    guidance: string;
  }) => {
    if (!patient?.id) return;

    if (editingItem) {
      const updated = await updatePatientEmergencyCare(
        {
          topic: data.name,
          details: data.guidance,
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
      const created = await createPatientEmergencyCare({
        patient_id: patient.id,
        topic: data.name,
        details: data.guidance,
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
      const updatedList = await getPatientEmergencyCaresByPatientId(patient.id);
      setCareList(updatedList);
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
      <Header
        title="Emergency Care"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
      />

      <View className="px-5 pt-5 bg-white flex-1">
        <Text
          style={{ color: palette.heading }}
          className="text-xl font-semibold mb-2"
        >
          Guidance in case of Emergency
        </Text>
        <Divider className="bg-gray-300" />
        <Text className="text-gray-700 mt-3 mb-2 text-lg leading-5">
          List specific guidance for others on what steps to take in response to
          emergency care situations.
        </Text>
        <Text className="text-gray-500  mb-4">
          e.g. in the event of a severe allergic reaction give one 0.3 mg
          injection into the muscle of the thigh
        </Text>
        <Divider className="bg-gray-300" />
        <FlatList
          className="mt-2"
          data={careList}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={true}
          renderItem={({ item }) => (
            <View className="flex-row items-start border border-gray-300 rounded-xl p-4 mb-4">
              <View className="ml-3 flex-1">
                <Text className="font-semibold text-lg">{item.topic}</Text>
                <Text className="text-gray-500 text-base mt-1">
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
              No emergency care instructions found.
            </Text>
          }
        />

        <Divider className="bg-gray-300 my-2" />
        <CustomButton
          title="Add emergency care"
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
            ? `Are you sure you want to delete \"${itemToDelete.topic}\"?`
            : "Are you sure you want to delete this item?"
        }
        onConfirm={async () => {
          if (itemToDelete) {
            await deletePatientEmergencyCare(itemToDelete.id);
            setCareList((prev) =>
              prev.filter((eq) => eq.id !== itemToDelete.id)
            );
            showToast({
              title: "Deleted",
              description: `\"${itemToDelete.topic}\" was removed successfully.`,
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
  onSave: (data: { name: string; guidance: string }) => void;
  editingItem?: PatientEmergencyCare | null;
}) {
  const [topic, setName] = useState(editingItem?.topic || "");
  const [details, setDetails] = useState(editingItem?.details || "");

  const isSaveDisabled = !topic.trim() || !details.trim();

  const handleSave = () => {
    if (!isSaveDisabled) {
      onSave({
        name: topic.trim(),
        guidance: details.trim(),
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        title="Emergency Care"
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
            {editingItem ? "Update" : "Add"} Emergency Care
          </Text>

          <Text className="text-base mb-1 text-gray-600">
            Emergency Care Name
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Enter condition name"
            value={topic}
            onChangeText={setName}
          />

          <Text className="text-base mb-1 text-gray-600">
            Emergency Care Details
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Enter guidance steps"
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </ScrollView>

        <View className="px-5">
          <CustomButton
            title={editingItem ? "Update" : "Add"}
            onPress={handleSave}
            disabled={isSaveDisabled}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
