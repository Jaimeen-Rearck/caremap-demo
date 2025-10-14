import ActionPopover from "@/components/shared/ActionPopover";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import Header from "@/components/shared/Header";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { CalendarDaysIcon, Icon } from "@/components/ui/icon";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { PatientContext } from "@/context/PatientContext";
import {
  createPatientNote,
  deletePatientNote,
  getPatientNotesByPatientId,
  updatePatientNote,
} from "@/services/core/PatientNoteService";
import { PatientNote } from "@/services/database/migrations/v1/schema_v1";
import { logger } from "@/services/logging/logger";
import palette from "@/utils/theme/color";
import React, { useContext, useEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";

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
      setPatientNotes(notes);
    } catch (e) {
      logger.debug(`${e}`);
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
      <Header title="Notes" />

      <View className="px-6 pt-8 flex-1">
        {/* Heading*/}
        <View>
          <Text
            className="text-lg font-semibold"
            style={{ color: palette.heading }}
          >
            Enter any notes or questions regarding your care
          </Text>

          {/* hr */}
          <View className="h-px bg-gray-300 my-3" />

          <View className="flex-row justify-between mb-2 px-2">
            <Text className="text-gray-500">Topic</Text>
            <Text className="text-gray-500">Reminder Date</Text>
          </View>
          <View>
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
                <Text className="text-gray-500">No notes found.</Text>
              }
              style={{ minHeight: 50, maxHeight: 250 }}
            />
          </View>
        </View>

        {/* hr */}
        <View className="h-px bg-gray-300 mb-2" />

        {/* Add note Button */}
        <TouchableOpacity
          className="rounded-md py-3 items-center mt-1"
          onPress={() => setShowAddForm(true)}
          style={{ backgroundColor: palette.primary }}
        >
          <Text className="text-white font-medium text-lg">Add Notes</Text>
        </TouchableOpacity>
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

  const handleSave = () => {
    if (noteTopic.trim()) {
      handleAddUpdateNote({
        ...(editingCondition?.id ? { id: editingCondition.id } : {}),
        topic: noteTopic.trim(),
        details: noteDetails.trim(),
        reminder_date: reminderDate ?? undefined,
      } as PatientNote);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <Header title="Notes" onBackPress={onClose} />

        <View className="px-6 py-8">
          <Text
            className="text-lg font-medium mb-3"
            style={{ color: palette.heading }}
          >
            {editingCondition ? "Update Notes" : "Add Notes"}
          </Text>

          {/* Enter Topic */}
          <View className="mb-4">
            <Text className="text-gray-600 text-sm mb-2">Enter Topic</Text>
            <TextInput
              value={noteTopic}
              onChangeText={setNoteTopic}
              placeholder="Please Enter your topic here"
              className="border border-gray-300 rounded-md px-3 py-3 text-base"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Reminder Date */}
          <View className="mb-4">
            <Text className="text-gray-600 text-sm mb-2">Reminder Date</Text>
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
          <Text className="text-gray-500 mb-2 text-sm">Details</Text>
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
              {editingCondition ? "Update" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
