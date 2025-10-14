import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "@/components/shared/Header";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
} from "@/components/ui/select";
import { ChevronDownIcon } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LabeledTextInput } from "@/components/shared/labeledTextInput";
import { CustomFormInput } from "@/components/shared/CustomFormInput";
import palette from "@/utils/theme/color";
import { PatientContext } from "@/context/PatientContext";
import {
  createContact,
  updateContact,
  getContactById,
} from "@/services/core/ContactService";
import { Contact } from "@/services/database/migrations/v1/schema_v1";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { CustomButton } from "@/components/shared/CustomButton";

type Params = {
  mode?: string;
  contactId?: number;
};

export default function CareTeamForm() {
  const { patient } = useContext(PatientContext);
  const params = useLocalSearchParams() as Params;
  const router = useRouter();
  const mode = (params.mode as string) ?? "add"; // "add" | "edit"
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";
  const contactId = params.contactId;

  const showToast = useCustomToast();

  const [form, setForm] = useState<Partial<Contact>>({
    first_name: "",
    last_name: "",
    relationship: "",
    phone_number: "",
    description: "",
    email: "",
  });

  useEffect(() => {
    if (isEditMode && contactId) {
      getContactById(Number(contactId)).then((contact) => {
        if (contact) {
          setForm({
            first_name: contact.first_name,
            last_name: contact.last_name,
            relationship: contact.relationship,
            phone_number: contact.phone_number,
            description: contact.description,
            email: contact.email,
          });
        }
      });
    } else if (isAddMode) {
      setForm({
        first_name: "",
        last_name: "",
        relationship: "",
        phone_number: "",
        description: "",
        email: "",
      });
    }
  }, [contactId, mode]);

  const relationshipOptions = [
    "Physician",
    "Nurse",
    "Urologist",
    "Gastroenterologist",
    "Behavioral Health Nurse Practitioner",
    "School Psychologist",
    "Music Therapist",
    "Occupational Therapist",
    "School Nurse",
    "Other Care Provider",
    "Mother",
    "Father",
    "Grandmother",
    "Grandfather",
    "Friend",
    "Guardian",
    "Other",
  ];

  const [errors, setErrors] = useState<{
    first_name?: string;
    phone_number?: string;
    email?: string;
  }>({});

  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  const phoneDigitsRegex = /^[0-9]{10}$/; // adjust to your rule

  const validateFirstName = (val?: string) => {
    if (!val || !val.trim()) return "First name is required";
    return undefined;
  };
  const validatePhone = (val?: string) => {
    if (!val || !val.trim()) return "Phone number is required";
    if (!phoneDigitsRegex.test(val.replace(/\D/g, "")))
      return "Enter 10 digit phone number";
    return undefined;
  };

  const validateEmail = (val?: string) => {
    // if (!val || !val.trim()) return "mail is required";
    if (!val || !val.trim()) return undefined; // allow empty
    if (!emailRegex.test(val.trim())) return "Enter a valid email";
    return undefined;
  };

  const validateAll = () => {
    const firstNameError = validateFirstName(form.first_name);
    const phoneError = validatePhone(form.phone_number);
    const emailError = validateEmail(form.email);
    setErrors({
      first_name: firstNameError,
      phone_number: phoneError,
      email: emailError,
    });
    return !firstNameError && !phoneError && !emailError;
  };

  const isSaveDisabled =
    !!errors.first_name ||
    !!errors.phone_number ||
    !!errors.email ||
    !form.first_name?.trim() ||
    !form.phone_number?.trim();

  const handleSave = async () => {
    if (!validateAll()) return;
    if (!patient?.id) return;
    try {
      if (isAddMode) {
        await createContact(
          {
            first_name: form.first_name ?? "",
            last_name: form.last_name ?? "",
            relationship: form.relationship ?? "",
            phone_number: form.phone_number ?? "",
            description: form.description,
            email: form.email,
          },
          patient.id
        );
        showToast({
          title: "Contact added",
          description: "Contact added successfully!",
        });
      } else if (isEditMode && contactId) {
        await updateContact(
          {
            first_name: form.first_name ?? "",
            last_name: form.last_name ?? "",
            relationship: form.relationship ?? "",
            phone_number: form.phone_number ?? "",
            description: form.description,
            email: form.email,
          },
          { id: Number(contactId) }
        );
        showToast({
          title: "Contact updated",
          description: "Contact updated successfully!",
        });
      }
      // router.back();
      router.replace("/home/careTeam");
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Header
        title={isAddMode ? "Add Contact" : "Edit Contact"}
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white">Cancel</Text>
          </TouchableOpacity>
        }
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        // keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          className="px-5 pt-6 flex-1"
          contentContainerStyle={{
            paddingBottom: 30,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {/* First Name */}
          <CustomFormInput
            label="First Name"
            isRequired
            value={form.first_name ?? ""}
            onChangeText={(t) => {
              setForm((p) => ({ ...p, first_name: t }));
              if (errors.first_name) {
                setErrors((e) => ({ ...e, first_name: validateFirstName(t) }));
              }
            }}
            onBlur={() =>
              setErrors((e) => ({
                ...e,
                first_name: validateFirstName(form.first_name),
              }))
            }
            error={errors.first_name}
          />

          {/* Last Name */}
          <CustomFormInput
            label="Last Name"
            value={form.last_name ?? ""}
            onChangeText={(t) => setForm((p) => ({ ...p, last_name: t }))}
          />

          {/* Relationship (GlueStack Select) */}
          <View className="mb-4">
            <Text className="font-medium mb-1 text-base">Relationship</Text>
            <Select
              selectedValue={form.relationship}
              // isDisabled={isViewMode}
              onValueChange={(value: string) =>
                setForm((p) => ({ ...p, relationship: value }))
              }
            >
              <SelectTrigger
                className="flex flex-row justify-between items-center bg-white rounded-lg border border-gray-300 px-3"
                variant="outline"
                size="xl"
              >
                {/* <SelectInput placeholder="Select relationship" /> */}
                <Text
                  className={`text-lg ${
                    form.relationship ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {form.relationship || "Select relationship"}
                </Text>
                <SelectIcon className="" as={ChevronDownIcon} />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  {relationshipOptions.map((rel) => (
                    <SelectItem key={rel} label={rel} value={rel} />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </View>

          {/* Phone */}
          <CustomFormInput
            label="Phone"
            isRequired
            value={form.phone_number ?? ""}
            onChangeText={(t) => {
              setForm((p) => ({ ...p, phone_number: t }));
              if (errors.phone_number) {
                setErrors((e) => ({ ...e, phone_number: validatePhone(t) }));
              }
            }}
            onBlur={() =>
              setErrors((e) => ({
                ...e,
                phone_number: validatePhone(form.phone_number),
              }))
            }
            error={errors.phone_number}
            keyboardType="numeric"
            // placeholder=""
          />

          <Text className="font-medium mb-1 text-base">Description</Text>
          <Textarea
            size="md"
            isReadOnly={false}
            isInvalid={false}
            isDisabled={false}
            className="w-full bg-white mb-4"
          >
            <TextareaInput
              placeholder=""
              style={{ textAlignVertical: "top", fontSize: 16 }}
              value={form.description ?? ""}
              onChangeText={(t) => setForm((p) => ({ ...p, description: t }))}
            />
          </Textarea>

          {/* Email */}
          <CustomFormInput
            label="Email"
            value={form.email ?? ""}
            onChangeText={(t) => {
              setForm((p) => ({ ...p, email: t }));
              if (errors.email) {
                setErrors((e) => ({ ...e, email: validateEmail(t) }));
              }
            }}
            onBlur={() =>
              setErrors((e) => ({
                ...e,
                email: validateEmail(form.email),
              }))
            }
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            // placeholder="example@domain.com"
          />
        </ScrollView>

        <View className="px-5">
          {/* <TouchableOpacity
            style={{ backgroundColor: palette.primary }}
            className="p-3 rounded-lg"
            onPress={handleSave}
            disabled={isSaveDisabled}
          >
            <Text className="text-white text-center font-semibold">Save</Text>
          </TouchableOpacity> */}
          <CustomButton
            title="Save"
            onPress={handleSave}
            disabled={isSaveDisabled}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
