import React, { useContext, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import palette from "@/utils/theme/color";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { PatientContext } from "@/context/PatientContext";
import {
  createPatientSnapshot,
  updatePatientSnapshot,
  getPatientSnapshot,
} from "@/services/core/PatientSnapshotService";
import { PatientSnapshot } from "@/services/database/migrations/v1/schema_v1";

import { Divider } from "@/components/ui/divider";
import Header from "@/components/shared/Header";
export default function Snapshot() {
  const { patient } = useContext(PatientContext);
  const [patientOverview, setPatientOverview] = useState("");
  const [healthIssues, setHealthIssues] = useState("");
  const [snapshot, setSnapshot] = useState<PatientSnapshot | null>(null);

  useEffect(() => {
    if (patient?.id) {
      getPatientSnapshot(patient.id).then(
        (existing: PatientSnapshot | null) => {
          if (existing) {
            setSnapshot(existing);
            setPatientOverview(existing.patient_overview ?? "");
            setHealthIssues(existing.health_issues ?? "");
          }
        }
      );
    }
  }, [patient]);
const isDisabled = patientOverview.trim() === "" && healthIssues.trim() === "";
  const handleSave = async () => {
    if (!patient?.id) {
      Alert.alert("Error", "Patient not found.");
      return;
    }

    const data: Partial<PatientSnapshot> = {
      patient_id: patient.id,
      patient_overview: patientOverview,
      health_issues: healthIssues,
    };

    try {
      if (snapshot?.id) {
        await updatePatientSnapshot(data, { id: snapshot.id });
        Alert.alert("Success", "Snapshot updated successfully.");
      } else {
        await createPatientSnapshot(data);
        Alert.alert("Success", "Snapshot created successfully.");
      }

      router.back();
    } catch (err) {
      console.error("Failed to save snapshot:", err);
      Alert.alert("Error", "Failed to save snapshot.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header title="Snapshot" />
      <View className="p-4">
        <Text
          style={{ color: palette.heading }}
          className="text-lg font-semibold mb-2"
        >
          Describe about yourself.
        </Text>
        <Text className="text-gray-500 mb-4">
          E.g. You may include your preferences, what they like or dislike. What
          are their motivations, goals and favorite things.
        </Text>

        <Textarea
          size="md"
          isDisabled={false}
          isInvalid={false}
          isReadOnly={false}
          className="mb-6 border border-gray-300"
        >
          <TextareaInput
            value={patientOverview}
            onChangeText={setPatientOverview}
            placeholder="Type here..."
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </Textarea>

        <Divider className="bg-gray-300" />

        <Text
          style={{ color: palette.heading }}
          className="text-lg font-semibold mb-2"
        >
          Describe your health issues.
        </Text>

        <Textarea
          size="md"
          isDisabled={false}
          isInvalid={false}
          isReadOnly={false}
          className="mb-6 border border-gray-300"
        >
          <TextareaInput
            value={healthIssues}
            onChangeText={setHealthIssues}
            placeholder="Type here..."
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </Textarea>

        <TouchableOpacity
          style={{
            backgroundColor: palette.primary,
            opacity: isDisabled ? 0.5 : 1,
          }}
          className="py-3 rounded-lg"
          onPress={isDisabled ? undefined : handleSave}
          disabled={isDisabled}
        >
          <Text className="text-white font-bold text-center">Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
