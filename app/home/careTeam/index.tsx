import React, { useContext, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import ActionPopover from "@/components/shared/ActionPopover";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/shared/Header";
import palette from "@/utils/theme/color";
import { Contact } from "@/services/database/migrations/v1/schema_v1";
import {
  getAllContactsByPatientId,
  deleteContact,
} from "@/services/core/ContactService";
import { PatientContext } from "@/context/PatientContext";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import { useCustomToast } from "@/components/shared/useCustomToast";

export default function CareTeamListScreen() {
  const router = useRouter();
  const { patient } = useContext(PatientContext);
  const [contacts, setContacts] = useState<Contact[]>([]);

  // for Alert while delete
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  // Custom toast
  const showToast = useCustomToast();

  const fetchContacts = async () => {
    if (!patient?.id) {
      console.log("No patient id found");
      return;
    }
    try {
      const backendContacts = await getAllContactsByPatientId(patient.id);
      setContacts(backendContacts);
    } catch (e) {
      console.log(e);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteContact(id);
    fetchContacts();
  };

  useEffect(() => {
    fetchContacts();
    // Optionally, add patient.id as dependency
  }, [patient]);

  const renderItem = ({ item }: { item: Contact }) => (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
      <TouchableOpacity
        className="flex-1 p-2 bg-white"
        activeOpacity={0.5}
        onPress={() =>
          router.push({
            pathname: "/home/careTeam/form",
            params: { mode: "view", contactId: item.id },
          })
        }
      >
        <View className="flex-row items-center">
          <View>
            <Text className="text-lg font-semibold">
              {item.first_name} {item.last_name}
            </Text>
            <Text className="text-base text-gray-500">{item.relationship}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <ActionPopover
        onEdit={() =>
          router.push({
            pathname: "/home/careTeam/form",
            params: { mode: "edit", contactId: item.id },
          })
        }
        onDelete={() => {
          setContactToDelete(item);
          setShowAlertDialog(true);
        }}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* header */}
      <Header
        title="Care Team"
        right={
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/home/careTeam/form",
                params: { mode: "add" },
              })
            }
          >
              <Text className="text-white font-medium whitespace-nowrap">
                            Add contact
                          </Text>
          </TouchableOpacity>
        }
      />

      {/* card-like container */}
      <View
        className="mx-4 mt-4 bg-white rounded-xl overflow-hidden border border-gray-200"
        style={{ marginBottom: 100 }}
      >
        {/* header row inside card */}
        <View className="px-4 py-3 border-b border-gray-200">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-medium text-gray-700">Name</Text>
            {/* <Text className="text-sm text-gray-700"></Text> */}
          </View>
        </View>

        <FlatList
          data={contacts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
        />
      </View>
      <CustomAlertDialog
        isOpen={showAlertDialog}
        onClose={() => {
          setShowAlertDialog(false);
          setContactToDelete(null);
        }}
        description={`${contactToDelete?.first_name} ${contactToDelete?.last_name}`}
        onConfirm={async () => {
          if (contactToDelete) {
            await handleDelete(contactToDelete.id);
            showToast({
              title: "Deleted",
              description: "Contact deleted successfully!",
            });
          }
          setShowAlertDialog(false);
          setContactToDelete(null);
        }}
      />
    </SafeAreaView>
  );
}
