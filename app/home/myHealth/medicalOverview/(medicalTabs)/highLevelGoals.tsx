import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import { CalendarDaysIcon, Icon } from "@/components/ui/icon";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Header from "@/components/shared/Header";
import { PatientContext } from "@/context/PatientContext";
import { PatientGoal } from "@/services/database/migrations/v1/schema_v1";
import {
  createPatientGoal,
  getPatientGoalsByPatientId,
  updatePatientGoal,
  deletePatientGoal,
} from "@/services/core/PatientGoalService";
import ActionPopover from "@/components/shared/ActionPopover";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import palette from "@/utils/theme/color";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { logger } from "@/services/logging/logger";
import { router } from "expo-router";
import { Divider } from "@/components/ui/divider";
import { CustomButton } from "@/components/shared/CustomButton";

const linkedGoals = [
  "Establish a consistent sleep schedule for better energy and recovery.",
  "Improve cardiovascular fitness by engaging in regular aerobic activity.",
  "Eat more whole, unprocessed foods and cut down on added sugar.",
];

export default function HighLevelGoals() {
  const [showAddForm, setShowAddForm] = useState(false);
  const { patient } = useContext(PatientContext);
  const [userGoals, setUserGoals] = useState<PatientGoal[]>([]);
  const [editingGoal, setEditingGoal] = useState<PatientGoal | undefined>(
    undefined
  );

  // for alert while delete
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<PatientGoal | null>(null);

  // Custom toast
  const showToast = useCustomToast();

  async function fetchGoals() {
    if (!patient?.id) {
      logger.debug("No patient id found");
      return;
    }
    try {
      const getUserGoals = await getPatientGoalsByPatientId(patient.id);
      setUserGoals(getUserGoals);
    } catch (error) {
      logger.debug(String(error));
    }
  }

  useEffect(() => {
    fetchGoals();
  }, [patient]);

  // Add/Update HighLevelsGoals
  const handleAddUpdateGoal = async (goal: {
    id?: number;
    goal_description: string;
    target_date?: Date;
  }) => {
    if (!patient?.id) return;
    if (goal.id) {
      //  edit exsiting goal
      await updatePatientGoal(
        {
          goal_description: goal.goal_description,
          target_date: goal.target_date,
        },
        { id: goal.id }
      );
      await fetchGoals();
      showToast({
        title: "Goal updated",
        description: "High level goal updated successfully!",
      });
    } else {
      // Add new Goal
      await createPatientGoal({
        patient_id: patient.id,
        goal_description: goal.goal_description,
        target_date: goal.target_date,
      });
      await fetchGoals();
      showToast({
        title: "Goal added",
        description: "High level goal added successfully!",
      });
    }
  };

  // Helper function to calculate days remaining:
  function getDaysRemaining(targetDate: string | Date): number {
    const now = new Date();
    const target =
      targetDate instanceof Date ? targetDate : new Date(targetDate);
    // Zero out the time part for both dates to get whole days
    now.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diff = target.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // for progress bar
  function getDaysBetween(start: string | Date, end: string | Date): number {
    const s = start instanceof Date ? start : new Date(start);
    const e = end instanceof Date ? end : new Date(end);
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);
    return Math.max(
      1,
      Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
    );
  }

  // Open edit form
  const handleEditGoal = (goal: PatientGoal) => {
    setEditingGoal(goal);
    setShowAddForm(true);
  };

  if (showAddForm) {
    return (
      <AddYourGoalsPage
        onClose={() => {
          setShowAddForm(false);
          setEditingGoal(undefined);
        }}
        handleAddUpdateGoal={handleAddUpdateGoal}
        editingGoal={editingGoal}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <Header
        title="High level goals"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
      />

      <View className="px-5 pt-5 flex-1">
        {/* Linked Health System */}
        <View className="">
          <Text
            className="text-xl font-semibold"
            style={{ color: palette.heading }}
          >
            High level goals (Linked Health System)
          </Text>

          <Divider className="bg-gray-300 my-3" />

          <View>
            <FlatList
              data={linkedGoals}
              renderItem={({ item }) => (
                <View className="border border-gray-300 p-3 rounded-md mb-2">
                  <Text className="text-lg">{item}</Text>
                </View>
              )}
              keyExtractor={(_, index) => index.toString()}
              ListEmptyComponent={
                <Text className="text-gray-500 text-lg">
                  No user linked health system found.
                </Text>
              }
              showsVerticalScrollIndicator={true}
              scrollEnabled={true}
              style={{ minHeight: 50, maxHeight: 150 }}
            />
          </View>
        </View>

        {/* User Entered Goals */}
        <View className="flex-1 mt-4">
          <Text
            className="text-xl font-semibold"
            style={{ color: palette.heading }}
          >
            High level goals (User entered)
          </Text>

          {/* hr */}
          <Divider className="bg-gray-300 my-3" />

          <View className="flex-1">
            <FlatList
              data={userGoals}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={true}
              scrollEnabled={true}
              style={{ minHeight: 50 }}
              ListEmptyComponent={
                <Text className="text-gray-500 text-lg">
                  No user goals found.
                </Text>
              }
              renderItem={({ item }) => {
                let daysRemaining, totalDays, progress;
                if (item.target_date && item.created_date) {
                  daysRemaining = getDaysRemaining(item.target_date);
                  totalDays = getDaysBetween(
                    item.created_date,
                    item.target_date
                  );
                  // Show at least 2% progress for new goals
                  progress = Math.max(
                    0.02,
                    Math.min(1, (totalDays - daysRemaining) / totalDays)
                  );
                }
                return (
                  <View className="bg-white border border-gray-300 rounded-md px-3 py-3 mb-3">
                    <View className="flex-row items-start mb-2">
                      <View className="flex-row items-center flex-1">
                        {/* Goal Title */}
                        <Text className="text-lg text-black ml-3 flex-1">
                          {item.goal_description}
                        </Text>
                      </View>
                      <ActionPopover
                        onEdit={() => {
                          handleEditGoal(item);
                        }}
                        onDelete={() => {
                          setGoalToDelete(item);
                          setShowAlertDialog(true);
                        }}
                      />
                    </View>

                    {/* Only show days remaining if target_date exists */}
                    {item.target_date && (
                      <View className="flex-row justify-end">
                        <Text className="text-base text-gray-500 mr-2">
                          {getDaysRemaining(item.target_date)} days remaining
                        </Text>
                      </View>
                    )}
                    {/* Show progress bar if days remaining > 0*/}
                    {progress !== undefined &&
                      daysRemaining !== undefined &&
                      daysRemaining > 0 && (
                        <View className="w-full px-2 py-2">
                          <Progress
                            value={progress * 100}
                            size="xs"
                            orientation="horizontal"
                          >
                            <ProgressFilledTrack
                              style={{ backgroundColor: palette.progressBar }}
                            />
                          </Progress>
                        </View>
                      )}
                  </View>
                );
              }}
            />
          </View>
        </View>

        <Divider className="bg-gray-300 my-2" />

        {/* Add Your Goals */}
        <CustomButton
          title="Add your goals "
          onPress={() => setShowAddForm(true)}
        />
      </View>

      <CustomAlertDialog
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        description={goalToDelete?.goal_description}
        onConfirm={async () => {
          if (goalToDelete) {
            await deletePatientGoal(goalToDelete.id);
            await fetchGoals();
            showToast({
              title: "Goal deleted",
              description: "High level goal deleted successfully!",
            });
          }
          setShowAlertDialog(false);
          setGoalToDelete(null);
        }}
      />
    </SafeAreaView>
  );
}

// --------------Add your goals------------------

function AddYourGoalsPage({
  onClose,
  handleAddUpdateGoal,
  editingGoal,
}: {
  onClose: () => void;
  handleAddUpdateGoal: (goal: {
    id?: number;
    goal_description: string;
    target_date?: Date;
  }) => void;
  editingGoal?: { id: number; goal_description: string; target_date?: Date };
}) {
  const [goalDescription, setGoalDescription] = useState(
    editingGoal?.goal_description || ""
  );
  const [completionDate, setCompletionDate] = useState<Date | null>(
    editingGoal?.target_date ? new Date(editingGoal.target_date) : null
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

  const handleConfirm = (date: Date) => {
    setCompletionDate(date);
    setShowDatePicker(false);
  };

  const handleSave = () => {
    if (isDisabled) return;
    handleAddUpdateGoal({
      id: editingGoal?.id,
      goal_description: goalDescription.trim(),
      target_date: completionDate ?? undefined, // Pass Date object
    });
    onClose(); // Go back to list
  };

  const isDisabled = goalDescription.trim().length === 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <Header
        title="High level goals"
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
          {/* Heading */}
          <Text
            className="text-xl font-semibold mb-2"
            style={{ color: palette.heading }}
          >
            {editingGoal ? "Update your goals" : "Add your Goal"}
          </Text>

          {/* Examples */}
          <Text className="text-gray-600 text-base">
            Enter high level goals for your health
          </Text>
          <Text className="text-gray-600 text-base mb-1">e.g.</Text>
          <View className="mb-4 ml-2">
            <Text className="text-gray-600 text-base mb-1">
              • Walk two flights of stairs comfortably
            </Text>
            <Text className="text-gray-600 text-base mb-1">
              • Eat solid foods and regular liquids
            </Text>
            <Text className="text-gray-600 text-base">
              • keep my seizures under control
            </Text>
          </View>

          {/* hr */}
          <View className="h-px bg-gray-300 mb-4" />

          {/* Goal Description Input */}
          <Text className="text-gray-600 text-base mb-2">
            Enter a goal description*
          </Text>
          <TextInput
            value={goalDescription}
            onChangeText={setGoalDescription}
            placeholder="Your goals"
            className="border border-gray-300 rounded-md px-3 py-3 text-base mb-6"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text className="text-gray-600 text-base mb-2">
            Set date to complete your goal
          </Text>
          {/* Completion Date */}
          <TouchableOpacity
            className="border border-gray-300 rounded-md px-3"
            onPress={() => setShowDatePicker(true)}
          >
            <View className="flex-row items-center">
              <TextInput
                value={completionDate ? formatDate(completionDate) : ""}
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
            onConfirm={handleConfirm}
            onCancel={() => setShowDatePicker(false)}
            minimumDate={new Date()} // Prevent selecting past dates
          />
        </ScrollView>

        {/* Save Button */}
        <View className="px-5">
          <CustomButton
            title={editingGoal ? "Update" : "Save"}
            onPress={() => {
              handleSave();
            }}
            disabled={isDisabled}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// const { height: deviceHeight } = Dimensions.get("window");

// // Example: allocate 30% for linkedGoals and 35% for userGoals
// const LINKED_GOALS_MAX_HEIGHT = deviceHeight * 0.24;
// const USER_GOALS_MAX_HEIGHT = deviceHeight * 0.32;
