import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
  FlatList,
} from "react-native";
import { CalendarDaysIcon, Icon } from "@/components/ui/icon";

import { ChevronLeft } from "lucide-react-native";
import palette from "@/utils/theme/color";
import Header from "@/components/shared/Header";
import { Divider } from "@/components/ui/divider";
import ActionPopover from "@/components/shared/ActionPopover";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import { PatientContext } from "@/context/PatientContext";
import { useCustomToast } from "@/components/shared/useCustomToast";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Hospitalization as _Hospitalization } from "@/services/database/migrations/v1/schema_v1";
import {
  createHospitalization,
  deleteHospitalization,
  getHospitalizationsByPatientId,
  updateHospitalization,
} from "@/services/core/HospitalizationService";

export default function Hospitalization() {
  const { patient } = useContext(PatientContext);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<_Hospitalization | null>(null);
  const [hospitalizations, setHospitalizations] = useState<_Hospitalization[]>(
    []
  );
  const [showDialog, setShowDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<_Hospitalization | null>(
    null
  );
  const showToast = useCustomToast();

  useEffect(() => {
    if (patient?.id) {
      getHospitalizationsByPatientId(patient.id).then(setHospitalizations);
    }
  }, [patient]);

  const handleAddOrUpdate = async (data: {
    admission_date: Date;
    discharge_date: Date;
    details: string;
  }) => {
    if (!patient?.id) return;

    if (editingItem) {
      const updated = await updateHospitalization(
        {
          admission_date: data.admission_date,
          discharge_date: data.discharge_date,
          details: data.details,
        },
        { id: editingItem.id }
      );
      if (updated) {
        await refreshList();
        showToast({
          title: "Updated",
          description: "Hospitalization updated successfully.",
          action: "success",
        });
      }
    } else {
      const created = await createHospitalization({
        patient_id: patient.id,
        admission_date: data.admission_date,
        discharge_date: data.discharge_date,
        details: data.details,
      });
      if (created) {
        await refreshList();
        showToast({
          title: "Added",
          description: "Hospitalization added successfully.",
          action: "success",
        });
      }
    }

    setShowForm(false);
    setEditingItem(null);
  };

  const refreshList = async () => {
    if (patient?.id) {
      const updatedList = await getHospitalizationsByPatientId(patient.id);
      setHospitalizations(updatedList);
    }
  };

  if (showForm) {
    return (
      <HospitalizationForm
        onClose={() => {
          setShowForm(false);
          setEditingItem(null);
        }}
        onSave={handleAddOrUpdate}
        editingItem={editingItem}
      />
    );
  }

  function formatDisplayDate(date: Date | string | null | undefined): string {
    if (!date) return "";
    try {
      const d = new Date(date);
      return d
        .toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "2-digit",
        })
        .replace(/\//g, "-");
    } catch (e) {
      return "";
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header title="Hospitalizations" />
      <View className="p-4 bg-white flex-1">
        <Text
          className="text-lg font-semibold mb-2"
          style={{ color: palette.heading }}
        >
          List your active hospitalizations
        </Text>
        <View className="border-t border-gray-300 mb-4" />

        <FlatList
          data={hospitalizations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View className="flex-row items-start border border-gray-300 rounded-xl p-4 mb-4">
              <View className="flex-1 ">
                <View className="flex-row mb-2 flex-wrap">
                  <Text className="font-medium">Date of Admission:</Text>
                  <Text className="font-normal ml-8">
                    {formatDisplayDate(item.admission_date)}
                  </Text>
                </View>

                <View className="flex-row mb-2 flex-wrap">
                  <Text className="font-medium">Date of Discharge: </Text>
                  <Text className="font-normal ml-8">
                    {formatDisplayDate(item.discharge_date)}
                  </Text>
                </View>

                {item.details ? (
                  <Text className="text-gray-500  mt-1">{item.details}</Text>
                ) : null}
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
              No hospitalizations found.
            </Text>
          }
        />

        <Divider className="bg-gray-300" />

        <TouchableOpacity
          className="py-3 rounded-lg mt-2"
          style={{ backgroundColor: palette.primary }}
          onPress={() => setShowForm(true)}
        >
          <Text className="text-white font-bold text-center">
            Add Hospitalizations Details
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
            ? `Are you sure you want to delete the hospitalization record?`
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
            await deleteHospitalization(itemToDelete.id);
            await refreshList();
            showToast({
              title: "Deleted",
              description: "Record deleted.",
              action: "success",
            });
          }
          setShowDialog(false);
        }}
      />
    </SafeAreaView>
  );
}

function HospitalizationForm({
  onClose,
  onSave,
  editingItem,
}: {
  onClose: () => void;
  onSave: (data: {
    admission_date: Date;
    discharge_date: Date;
    details: string;
  }) => void;
  editingItem?: _Hospitalization | null;
}) {
  const [admission, setAdmission] = useState<Date | null>(
    editingItem?.admission_date || null
  );
  const [discharge, setDischarge] = useState<Date | null>(
    editingItem?.discharge_date || null
  );
  const [description, setDescription] = useState(editingItem?.details || "");

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isSelectingAdmission, setIsSelectingAdmission] = useState(true);

  const showPicker = (isAdmission: boolean) => {
    setIsSelectingAdmission(isAdmission);
    setDatePickerVisibility(true);
  };
  const showToast = useCustomToast();

  const handleConfirm = (date: Date) => {
    if (isSelectingAdmission) {
      setAdmission(date);
    } else {
      setDischarge(date);
    }
    setDatePickerVisibility(false);
  };

  const formatDate = (date: Date) => {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    // const yy = String(date.getFullYear()).slice(-2);
    const yy = String(date.getFullYear());
    return `${mm}-${dd}-${yy}`;
  };
  const isDisabled = !admission || !discharge || !description.trim();

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
            {editingItem ? "Edit" : "Add"} Hospitalization
          </Text>
        </View>

        <View className="px-6 py-8">
          <Text
            className="text-lg font-medium mb-3"
            style={{ color: palette.heading }}
          >
            {editingItem
              ? "Edit Hospitalization"
              : "Enter details of recent hospitalizations"}
          </Text>

          <View className="mb-4">
            <Text className="text-sm mb-1 text-gray-600">
              Date of Admission
            </Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-md p-3 "
              onPress={() => showPicker(true)}
            >
              <View className="flex-row items-center">
                <TextInput
                  value={admission ? formatDate(admission) : ""}
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
          </View>

          <View className="mb-4">
            <Text className="text-sm mb-1 text-gray-600">
              Date of Discharge
            </Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-md p-3"
              onPress={() => showPicker(false)}
            >
              <View className="flex-row items-center">
                <TextInput
                  value={discharge ? formatDate(discharge) : ""}
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
          </View>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirm}
            onCancel={() => setDatePickerVisibility(false)}
            maximumDate={isSelectingAdmission ? new Date() : undefined}
            minimumDate={
              !isSelectingAdmission && admission ? admission : undefined
            }
          />

          <Text className="text-sm mb-1 text-gray-600 mt-2">Description</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Enter description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            className={`py-3 rounded-lg ${isDisabled ? "opacity-50" : ""}`}
            disabled={isDisabled}
            style={{ backgroundColor: palette.primary }}
            onPress={() => {
              if (!isDisabled && admission && discharge) {
                if (discharge < admission) {
                  showToast({
                    title: "Error",
                    description:
                      "Discharge date cannot be before admission date.",
                    action: "warning",
                  });
                  return;
                }

                onSave({
                  admission_date: admission,
                  discharge_date: discharge,
                  details: description.trim(),
                });
              }
            }}
          >
            <Text className="text-white font-bold text-center">Save</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
