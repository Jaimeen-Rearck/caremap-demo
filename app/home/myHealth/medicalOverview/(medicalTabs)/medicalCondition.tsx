import React, { useContext, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import palette from "@/utils/theme/color";
import {
  getMedicalConditionsByPatient,
  createMedicalCondition,
  deleteMedicalCondition,
  updateMedicalCondition,
} from "@/services/core/PatientService";
import { PatientContext } from "@/context/PatientContext";
import { Keyboard, TouchableWithoutFeedback } from "react-native";
import { Spinner } from "@/components/ui/spinner";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import Header from "@/components/shared/Header";
import ActionPopover from "@/components/shared/ActionPopover";
import { useCustomToast } from "@/components/shared/useCustomToast";

const linkedHealthSystem = [
  "Attention Deficient and Hyperactivity Disorder (ADHD)",
  "Irritable Bowel Syndrome (IBS)",
];

function AddMedicalConditionsPage({
  onClose,
  handleAddMedicalCondition,
  editingCondition,
}: {
  onClose: () => void;
  handleAddMedicalCondition: (condition: { id?: number; name: string }) => void;
  editingCondition?: { id: number; name: string };
}) {
  const [condition, setCondition] = useState(editingCondition?.name || "");
  // console.log(condition);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <Header title="Medical Conditions" />

        <View className="px-6 py-8">
          <Text
            className="text-lg font-medium mb-3"
            style={{ color: palette.heading }}
          >
            {editingCondition
              ? "Edit your child's current medical condition"
              : "Add your child's current medical condition"}
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
                handleAddMedicalCondition({
                  id: editingCondition?.id,
                  name: condition.trim(),
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

interface Condition {
  id: number;
  name: string;
  date?: string;
  checked?: boolean;
}

export default function MedicalConditions() {
  const { patient } = useContext(PatientContext);
  const [userConditions, setUserConditions] = useState<Condition[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCondition, setEditingCondition] = useState<
    { id: number; name: string } | undefined
  >(undefined);
  const [loading, setLoading] = useState(false);

  // for Alert while delete
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [conditionToDelete, setConditionToDelete] = useState<Condition | null>(
    null
  );

  // Custom toast
  const showToast = useCustomToast();

  const fetchConditions = async () => {
    if (!patient?.id) {
      console.log("No patient id found");
      return;
    }
    setLoading(true);
    try {
      const conditions = await getMedicalConditionsByPatient(patient.id);
      // console.log(conditions);
      setUserConditions(
        conditions.map((c) => {
          // Use updated_at if it's different from created_at, else use created_at
          const showUpdated = c.updated_at && c.updated_at !== c.created_at;
          const dateToShow = showUpdated ? c.updated_at : c.created_at;
          return {
            id: c.id,
            name: c.condition_name,
            date: dateToShow
              ? new Date(dateToShow)
                  .toLocaleDateString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    year: "2-digit",
                  })
                  .replace(/\//g, "-")
              : "",
          };
        })
      );
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConditions();
  }, [patient]);

  // add/update medicalCondition
  const handleAddMedicalCondition = async (condition: {
    id?: number;
    name: string;
  }) => {
    if (!patient?.id) return;
    if (condition.id) {
      //edit
      await updateMedicalCondition(
        { condition_name: condition.name }, // fields to update
        { id: condition.id } // where clause
      );
      await fetchConditions(); // Refresh list after editing
      showToast({
        title: "Condition Updated",
        description: "Medical condition updated successfully!",
      });
    } else {
      // Add new condition
      await createMedicalCondition({
        patient_id: patient.id,
        condition_name: condition.name,
      });
      await fetchConditions(); // Refresh list after adding
      showToast({
        title: "Condition Added",
        description: "Medical condition added successfully!",
      });
    }
  };

  // open edit form
  const handleEdit = (condition: { id: number; name: string }) => {
    setEditingCondition({ id: condition.id, name: condition.name });
    setShowAddForm(true);
  };

  if (showAddForm) {
    return (
      <AddMedicalConditionsPage
        onClose={() => {
          setShowAddForm(false);
          setEditingCondition(undefined);
        }}
        handleAddMedicalCondition={handleAddMedicalCondition}
        editingCondition={editingCondition}
      />
    );
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
                <View className="border border-gray-200 rounded-lg p-2 bg-gray-100 mb-2">
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
                renderItem={({ item: condition }) => (
                  <View className="flex-row items-center justify-between border border-gray-300 rounded-lg px-3 py-3 mb-3">
                    <View className="flex-row items-center space-x-2">
                      <Text className="text-lg ml-3 max-w-[220px] text-left">
                        {condition.name}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-lg text-gray-500 mr-3">
                        {condition.date}
                      </Text>
                      {/* Popover for Edit/Delete */}
                      <ActionPopover
                        onEdit={() => {
                          handleEdit(condition);
                        }}
                        onDelete={() => {
                          setConditionToDelete(condition);
                          setShowAlertDialog(true);
                        }}
                      />
                    </View>
                  </View>
                )}
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
        size="lg"
        title="Are you sure you want to delete?"
        description={conditionToDelete?.name}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={async () => {
          if (conditionToDelete) {
            await deleteMedicalCondition(conditionToDelete.id);
            await fetchConditions();
            showToast({
              title: "Condition Deleted",
              description: "Medical condition deleted successfully!",
            });
          }
          setShowAlertDialog(false);
          setConditionToDelete(null);
        }}
        confirmButtonProps={{
          style: { backgroundColor: palette.primary, marginLeft: 8 },
        }}
      >
        {/* children */}
        {/* <View className="flex-row items-center justify-between border border-gray-300 rounded-lg px-3 py-3 mb-3">
            <View className="flex-row items-center">
              <Text className="text-lg ml-3 max-w-[220px] text-left">
                {conditionToDelete?.name}
              </Text>
            </View>
          </View> */}
      </CustomAlertDialog>
    </SafeAreaView>
  );
}

// AlertDialog
{
  /* <AlertDialog
  isOpen={showAlertDialog}
  onClose={() => setShowAlertDialog(false)}
  size="lg"
>
  <AlertDialogBackdrop />
  <AlertDialogContent className="">
    <AlertDialogHeader>
      <Text
        className="font-semibold mb-2 text-lg"
        style={{ color: palette.heading }}
      >
        Are you sure you want to delete?
      </Text>
    </AlertDialogHeader>
    <AlertDialogBody className="">
      {conditionToDelete ? (
        <View className="flex-row items-center justify-between border border-gray-300 rounded-lg px-3 py-3 mb-3">
          <View className="flex-row items-center">
            <Text className="text-lg ml-3 max-w-[220px] text-left">
              {conditionToDelete.name}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-lg text-gray-500 mr-3">
              {conditionToDelete.date}
            </Text>
          </View>
        </View>
      ) : null}
    </AlertDialogBody>
    <AlertDialogFooter>
      <Button
        variant="solid"
        action="secondary"
        onPress={() => setShowAlertDialog(false)}
        size="md"
      >
        <ButtonText>Cancel</ButtonText>
      </Button>
      <Button
        style={{ backgroundColor: palette.primary }}
        size="md"
        onPress={async () => {
          if (conditionToDelete) {
            await deleteMedicalCondition(conditionToDelete.id);
            await fetchConditions();
            showConditionToast(
              "Condition Deleted",
              "Medical condition deleted successfully!"
            );
          }
          setShowAlertDialog(false);
          setConditionToDelete(null);
        }}
      >
        <ButtonText>Delete</ButtonText>
      </Button>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog> */
}

// Popover
{
  /* <Popover
                            shouldOverlapWithTrigger={false}
                            placement="bottom"
                            size="md"
                            crossOffset={-30}
                            // offset={2}
                            trigger={(triggerProps) => {
                              return (
                                <TouchableOpacity
                                  {...triggerProps}
                                  hitSlop={10}
                                >
                                  <MaterialIcons name="more-vert" size={20} />
                                </TouchableOpacity>
                              );
                            }}
                          >
                            <PopoverBackdrop />
                            <PopoverContent
                              className="bg-gray-50 pt-1 pb-0 px-4"
                              style={{
                                // alignItems: "center",
                                minWidth: 110,
                                minHeight: 90,
                              }}
                            >
                              <PopoverArrow
                                // style={{ marginTop: -35 }}
                                className="bg-gray-50"
                              />
                              <PopoverBody>
                                <TouchableOpacity
                                  className="flex-row items-center py-2"
                                  onPress={() => {
                                    handleEdit(condition);
                                  }}
                                >
                                  <MaterialIcons
                                    name="edit"
                                    size={20}
                                    style={{ marginRight: 8 }}
                                  />
                                  <Text className="text-lg">Edit</Text>
                                </TouchableOpacity>
                                <View className="h-px bg-gray-300" />
                                <TouchableOpacity
                                  className="flex-row items-center py-2"
                                  onPress={() => {
                                    setConditionToDelete(condition);
                                    setShowAlertDialog(true);
                                  }}
                                >
                                  <MaterialIcons
                                    name="delete"
                                    size={20}
                                    style={{ marginRight: 8 }}
                                  />
                                  <Text className="text-lg">Delete</Text>
                                </TouchableOpacity>
                              </PopoverBody>
                            </PopoverContent>
                          </Popover> */
}

// Toast
// const toast = useToast();
// const showConditionToast = (title: string, description: string) => {
// const toastId = Math.random().toString();
// toast.show({
// id: toastId,
// placement: "top",
// duration: 2000,
// containerStyle: { marginTop: 100, width: 300 },
// render: ({ id }) => (
// <Toast
// nativeID={"toast-" + id}
// action="success"
// variant="solid"
// style={{ backgroundColor: palette.primary }}
// >
// <ToastTitle>{title}</ToastTitle>
// <ToastDescription>{description}</ToastDescription>
// <TouchableOpacity
// onPress={() => toast.close(id)}
// style={{
// position: "absolute",
// top: 8,
// right: 8,
// zIndex: 1,
// }}
// >
// <Icon as={CloseIcon} style={{ color: "white" }} />
// </TouchableOpacity>
// </Toast>
// ),
// });
// };
