import { View, Text, Alert } from "react-native";
import { signOut } from "@/services/auth-service/google-auth";
import palette from "@/theme/color";
import { router } from "expo-router";
import { Button, ButtonText } from "@/components/ui/button";
import DatabaseService from "@/services/database/db";
import { useSQLiteContext } from "expo-sqlite";
import { red } from "tailwindcss/colors";

function careTeam() {
  const db = useSQLiteContext();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth/login");
  };

  const handleResetDatabase = async () => {
    Alert.alert(
      "Reset Database",
      "This will delete all data and reset the database. Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              const dbService = DatabaseService.getInstance();
              dbService.setDatabase(db);
              await dbService.migrateToVersion(0);
              Alert.alert("Success", "Database has been reset successfully");
              // Sign out after reset to ensure clean state
              await handleSignOut();
            } catch (error) {
              console.error('Database reset failed:', error);
              Alert.alert("Error", "Failed to reset database. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handleMigrateToV1 = async () => {
    try {
      const dbService = DatabaseService.getInstance();
      dbService.setDatabase(db);
      await dbService.migrateToVersion(1);
      Alert.alert("Success", "Migrated to v1 successfully");
    } catch (error) {
      console.error('Migration to v1 failed:', error);
      Alert.alert("Error", "Failed to migrate to v1. Please try again.");
    }
  };

  const handleMigrateToV2 = async () => {
    try {
      const dbService = DatabaseService.getInstance();
      dbService.setDatabase(db);
      await dbService.migrateToVersion(2);
      Alert.alert("Success", "Migrated to v2 successfully");
    } catch (error) {
      console.error('Migration to v2 failed:', error);
      Alert.alert("Error", "Failed to migrate to v2. Please try again.");
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text style={{ color: palette.primary }} className="text-2xl font-bold ">
        careTeam
      </Text>
      <View className="space-y-4">
        <Button
          style={{ backgroundColor: palette.primary }}
          className="w-[150px] rounded-[30px] h-[45px]"
          variant="solid"
          action="secondary"
          onPress={handleSignOut}
        >
          <ButtonText className="text-lg text-white">Sign Out</ButtonText>
        </Button>

        <Button
          style={{ backgroundColor: palette.primary }}
          className="w-[150px] rounded-[30px] h-[45px] mt-3"
          variant="solid"
          action="negative"
          onPress={handleResetDatabase}
        >
          <ButtonText className="text-md text-white">Reset Database   (Temporary)</ButtonText>
        </Button>

        <Button
          style={{ backgroundColor: palette.primary }}
          className="w-[150px] rounded-[30px] h-[45px] mt-3"
          variant="solid"
          action="secondary"
          onPress={handleMigrateToV1}
        >
          <ButtonText className="text-md text-white">Migrate to v1</ButtonText>
        </Button>

        <Button
          style={{ backgroundColor: palette.primary }}
          className="w-[150px] rounded-[30px] h-[45px] mt-3"
          variant="solid"
          action="secondary"
          onPress={handleMigrateToV2}
        >
          <ButtonText className="text-md text-white">Migrate to v2</ButtonText>
        </Button>
      </View>
      <Text className="text-lg text-gray-500 mt-2">Coming soon...</Text>
    </View>
  );
}

export default careTeam;
