import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "@/components/shared/Header";
import palette from "@/utils/theme/color";
import { getContactById } from "@/services/core/ContactService";
import { Contact } from "@/services/database/migrations/v1/schema_v1";
import { PatientContext } from "@/context/PatientContext";
import {
  Phone,
  Mail,
  User2,
  PencilLine,
  MessageSquare,
  Share2,
  ChevronRight,
  Info,
} from "lucide-react-native";
import { CustomButton } from "@/components/shared/CustomButton";
import { sendEmail, sendMessage, makePhoneCall } from "@/services/core/utils";

type Params = { contactId?: string | number };

export default function ViewContact() {
  const { patient } = useContext(PatientContext);
  const params = useLocalSearchParams() as Params;
  const router = useRouter();
  const contactId = params.contactId ? Number(params.contactId) : undefined;
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!contactId) return;
    try {
      const c = await getContactById(contactId);
      setContact(c ?? null);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Header
        title="Contact Details"
        right={
          contact && (
            <TouchableOpacity
              activeOpacity={0.7}
              className="flex-row items-center"
              onPress={() =>
                router.push({
                  pathname: "/home/careTeam/form",
                  params: { mode: "edit", contactId: contact.id },
                })
              }
            >
              {/* <PencilLine size={16} color="white" /> */}
              <Text
                className="text-base font-semibold text-white"
                // style={{ color: palette.primary }}
              >
                Edit
              </Text>
            </TouchableOpacity>
          )
        }
      />
      {loading ? (
        <View className="flex-1 items-center justify-center px-8">
          <ActivityIndicator color={palette.primary} />
          <Text className="mt-2 text-sm text-gray-500">Loading contact...</Text>
        </View>
      ) : !contact ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-gray-500 text-base">Contact not found.</Text>
          <TouchableOpacity
            className="mt-5 px-5 py-4 rounded-xl"
            style={{ backgroundColor: palette.primary }}
            onPress={() => router.back()}
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ padding: 18 }}
        >
          {/* Profile */}
          <View
            className="bg-white rounded-2xl items-center mb-4 px-5 py-5"
            style={styles.shadowCard}
          >
            <Text
              className="text-[22px] font-bold text-[#111C28] text-center"
              // style={{ color: palette.primary }}
            >
              {contact.first_name} {contact.last_name}
            </Text>
            {!!contact.relationship && (
              <View className="mt-2 px-4 py-[2px] rounded-2xl bg-gray-200">
                <Text
                  className="text-base font-medium"
                  style={{ color: palette.heading }}
                >
                  {contact.relationship}
                </Text>
              </View>
            )}

            <View className="flex-row justify-around mt-6 w-full px-1">
              <MiniAction
                label="Call"
                icon={<Phone size={20} color={palette.primary} />}
                disabled={!contact.phone_number}
                onPress={() => makePhoneCall(contact.phone_number)}
              />
              <MiniAction
                label="Message"
                icon={<MessageSquare size={20} color={palette.primary} />}
                disabled={!contact.phone_number}
                onPress={() => sendMessage(contact.phone_number)}
              />
              <MiniAction
                label="Email"
                icon={<Mail size={20} color={palette.primary} />}
                disabled={!contact.email}
                onPress={() => contact.email && sendEmail(contact.email)}
              />
            </View>
          </View>

          {/* Contact InfoRow */}
          <View
            className="bg-white rounded-2xl px-4 py-3.5 mb-4"
            style={styles.shadowLight}
          >
            <Text className="text-[12px] font-bold tracking-wider text-gray-500 mb-1.5">
              CONTACT INFO
            </Text>
            <InfoRow
              label="Phone"
              value={contact.phone_number}
              icon={<Phone size={18} color={palette.primary} />}
              // onPress={() => makePhoneCall(contact.phone_number)}
            />
            <Separator />
            <InfoRow
              label="Email"
              value={contact.email}
              icon={<Mail size={18} color={palette.primary} />}
              // onPress={() => contact.email && sendEmail(contact.email)}
            />
            <Separator />
            <InfoRow
              label="Role / Relationship"
              value={contact.relationship}
              icon={<User2 size={18} color={palette.primary} />}
            />
          </View>

          {/* Notes */}
          {contact.description ? (
            <View
              className="bg-white rounded-2xl px-4 py-3.5"
              style={styles.shadowLight}
            >
              <Text className="text-[12px] font-bold tracking-wider text-gray-500 mb-2">
                DESCRIPTION
              </Text>
              <View className="flex-row items-center">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: palette.primary + "10" }}
                >
                  <Info size={18} color={palette.primary} />
                </View>
                <Text className="text-[15px] text-black flex-1 ">
                  {contact.description}
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}

      {!loading && contact && (
        <View className="absolute left-0 right-0 bottom-4 px-4">
          <CustomButton title="Close" onPress={() => router.back()} />
        </View>
      )}
    </SafeAreaView>
  );
}

const InfoRow = ({
  label,
  value,
  icon,
  onPress,
}: {
  label: string;
  value?: string | null;
  icon: React.ReactNode;
  onPress?: () => void;
}) => {
  const tappable = !!onPress && !!value;
  return (
    <TouchableOpacity
      className="flex-row items-center py-3"
      activeOpacity={tappable ? 0.65 : 1}
      onPress={() => tappable && onPress && onPress()}
    >
      <View className="w-10 h-10 rounded-xl items-center justify-center mr-3 bg-white">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-[10px] font-semibold tracking-wider text-gray-500 mb-0.5">
          {label}
        </Text>
        <Text
          numberOfLines={2}
          className={`text-[15px] font-medium ${
            value ? "text-gray-800" : "text-gray-400 italic"
          }`}
        >
          {value || "—"}
        </Text>
      </View>
      {tappable && <ChevronRight size={18} color="#C5CAD0" />}
    </TouchableOpacity>
  );
};

function MiniAction({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      className="items-center w-[70px]"
      activeOpacity={disabled ? 1 : 0.7}
      onPress={() => !disabled && onPress && onPress()}
    >
      <View
        className="w-[54px] h-[54px] rounded-2xl items-center justify-center mb-1 border"
        style={{
          backgroundColor: palette.primary + "10",
          borderColor: palette.primary + "30",
          opacity: disabled ? 0.35 : 1,
        }}
      >
        {icon}
      </View>
      <Text
        className={`text-[12px] font-semibold ${
          disabled ? "text-gray-400" : "text-gray-700"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const Separator = () => (
  <View
    className="h-px"
    style={{ backgroundColor: "#E4E7EB", marginLeft: 45 }}
  />
);

const styles = StyleSheet.create({
  shadowCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 2, // Android
  },
  shadowLight: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22, // for a soft blur
    elevation: 2,
  },
});
