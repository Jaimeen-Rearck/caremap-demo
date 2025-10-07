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
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import palette from "@/utils/theme/color";
import {
  createPatientNote,
  getPatientNotesByPatientId,
  updatePatientNote,
  deletePatientNote,
} from "@/services/core/PatientNoteService";
import { PatientContext } from "@/context/PatientContext";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import Header from "@/components/shared/Header";
import ActionPopover from "@/components/shared/ActionPopover";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { PatientNote } from "@/services/database/migrations/v1/schema_v1";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { CalendarDaysIcon, Icon } from "@/components/ui/icon";
import { router } from "expo-router";
import { logger } from "@/services/logging/logger";
import { Divider } from "@/components/ui/divider";
import { CustomButton } from "@/components/shared/CustomButton";

export default function Notes() {
  const { patient } = useContext(PatientContext);
  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCondition, setEditingCondition] = useState<
    PatientNote | undefined
  >(undefined);

  // for Alert while delete
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<PatientNote | null>(null);

  // Custom toast
  const showToast = useCustomToast();

  async function fetchNotes() {
    if (!patient?.id) {
      logger.debug("No patient id found");
      return;
    }
    try {
      const notes = await getPatientNotesByPatientId(patient.id);
      console.log(notes);
      setPatientNotes(notes);
    } catch (e) {
      logger.debug(String(e));
    }
  }

  useEffect(() => {
    fetchNotes();
  }, [patient]);

  // Add/Update notes
  const handleAddUpdateNote = async (note: PatientNote) => {
    if (!patient?.id) return;
    if (note.id) {
      //  edit exsiting note
      await updatePatientNote(
        {
          topic: note.topic,
          reminder_date: note.reminder_date,
          details: note.details,
        },
        { id: note.id }
      );
      await fetchNotes();
      showToast({
        title: "Note updated",
        description: "Note updated successfully!",
      });
    } else {
      // Add new note
      await createPatientNote({
        patient_id: patient.id,
        topic: note.topic,
        reminder_date: note.reminder_date,
        details: note.details,
      });
      await fetchNotes();
      showToast({
        title: "Note added",
        description: "Note added successfully!",
      });
    }
  };

  // open edit form
  const handleEditNote = (note: PatientNote) => {
    setEditingCondition(note);
    setShowAddForm(true);
  };

  if (showAddForm) {
    return (
      <AddNotesPage
        onClose={() => {
          setShowAddForm(false);
          setEditingCondition(undefined);
        }}
        handleAddUpdateNote={handleAddUpdateNote}
        editingCondition={editingCondition}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <Header
        title="Notes"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
      />

      <View className="px-5 pt-5 flex-1">
        {/* Heading*/}
        <View className="flex-1">
          <Text
            className="text-xl font-semibold"
            style={{ color: palette.heading }}
          >
            Enter notes or questions regarding your care
          </Text>

          <Divider className="bg-gray-300 my-3" />

          <View className="flex-row justify-between mb-2 px-2">
            <Text className="text-gray-500">Topic</Text>
            <Text className="text-gray-500">Reminder Date</Text>
          </View>
          <View className="flex-1">
            <FlatList
              data={patientNotes}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={true}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => {
                return (
                  <View className="border border-gray-300 rounded-lg mb-3 px-3 py-3">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center space-x-2">
                        <Text className="text-lg ml-3 max-w-[220px] text-left">
                          {item.topic}
                        </Text>
                      </View>
                      <View className="flex-row">
                        <Text className="text-lg text-gray-500 mr-3">
                          {item.reminder_date
                            ? new Date(item.reminder_date)
                                .toLocaleDateString("en-US", {
                                  month: "2-digit",
                                  day: "2-digit",
                                  year: "2-digit",
                                })
                                .replace(/\//g, "-")
                            : ""}
                        </Text>

                        <ActionPopover
                          onEdit={() => {
                            handleEditNote(item);
                          }}
                          onDelete={() => {
                            setNoteToDelete(item);
                            setShowAlertDialog(true);
                          }}
                        />
                      </View>
                    </View>
                    {item.details ? (
                      <View className="px-3 mt-1">
                        <Text className="text-base text-gray-700">
                          {item.details}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              }}
              ListEmptyComponent={
                <Text className="text-gray-500 text-lg">No notes found.</Text>
              }
              style={{ minHeight: 50 }}
            />
          </View>
        </View>

        <Divider className="bg-gray-300 mb-2" />
        {/* Add note Button */}
        <CustomButton title="Add Notes" onPress={() => setShowAddForm(true)} />
      </View>

      <CustomAlertDialog
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        description={noteToDelete?.topic}
        onConfirm={async () => {
          if (noteToDelete) {
            await deletePatientNote(noteToDelete.id);
            await fetchNotes();
            showToast({
              title: "Note deleted",
              description: "Note deleted successfully!",
            });
          }
          setShowAlertDialog(false);
          setNoteToDelete(null);
        }}
      />
    </SafeAreaView>
  );
}

function AddNotesPage({
  onClose,
  handleAddUpdateNote,
  editingCondition,
}: {
  onClose: () => void;
  handleAddUpdateNote: (note: PatientNote) => void;
  editingCondition?: PatientNote;
}) {
  const [noteTopic, setNoteTopic] = useState(editingCondition?.topic || "");
  const [noteDetails, setNoteDetails] = useState(
    editingCondition?.details || ""
  );
  const [reminderDate, setReminderDate] = useState<Date | null>(
    editingCondition?.reminder_date
      ? new Date(editingCondition.reminder_date)
      : null
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
    setReminderDate(date);
    setShowDatePicker(false);
  };

  const isDisabled = noteTopic.trim().length === 0;

  const handleSave = () => {
    if (isDisabled) return;
    handleAddUpdateNote({
      ...(editingCondition?.id ? { id: editingCondition.id } : {}),
      topic: noteTopic.trim(),
      details: noteDetails.trim(),
      reminder_date: reminderDate ?? undefined,
    } as PatientNote);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <Header
        title="Notes"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
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
            {editingCondition ? "Update Notes" : "Add Notes"}
          </Text>

          {/* Enter Topic */}
          <View className="mb-4">
            <Text className="text-gray-600 text-base mb-2">Enter Topic *</Text>
            <TextInput
              value={noteTopic}
              onChangeText={setNoteTopic}
              placeholder="Please enter your topic here"
              className="border border-gray-300 rounded-md px-3 py-3 text-base"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Reminder Date */}
          <View className="mb-4">
            <Text className="text-gray-600 text-base mb-2">Reminder Date</Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-md px-3"
              onPress={() => setShowDatePicker(true)}
            >
              <View className="flex-row items-center">
                <TextInput
                  value={reminderDate ? formatDate(reminderDate) : ""}
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
              minimumDate={new Date()} // Prevent selecting past dates
            />
          </View>

          {/* Details */}
          <Text className="text-gray-500 mb-2 text-base">Details</Text>
          <Textarea
            size="md"
            isReadOnly={false}
            isInvalid={false}
            isDisabled={false}
            className="w-full"
          >
            <TextareaInput
              placeholder="Enter details"
              style={{ textAlignVertical: "top", fontSize: 16 }}
              value={noteDetails}
              onChangeText={setNoteDetails}
            />
          </Textarea>
        </ScrollView>
        {/* Save button */}
        <View className="px-5">
          <CustomButton
            title={editingCondition ? "Update" : "Save"}
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
