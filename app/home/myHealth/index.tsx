import { View, Text, Image, TouchableOpacity } from "react-native";
import { Divider } from "@/components/ui/divider";
import { User, Patient } from "@/services/database/version_manager";
import { Box } from "@/components/ui/box";
import { router } from "expo-router";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { SafeAreaView } from "react-native-safe-area-context";
import { ROUTES } from "@/utils/route";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Icon, EditIcon, ShareIcon } from "@/components/ui/icon";
import { Camera } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  initializeMockSession,
  initializeSession,
  isAndroid,
  signOut,
} from "@/services/auth-service/google-auth";
import { useSQLiteContext } from "expo-sqlite";
import { UserModel } from "@/services/database/models/UserModel";
import { PatientModel } from "@/services/database/models/PatientModel";
import { logger } from "@/services/logging/logger";
import palette from "@/theme/color";

export default function HealthProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  const db = useSQLiteContext();
  const userModel = new UserModel(db);
  const patientModel = new PatientModel(db);

  useEffect(() => {
    logger.debug(`DB Path : "${db.databasePath}"`);
    if (isAndroid) {
      console.log("Android? :", isAndroid);
      initializeMockSession(setUser).finally(() => setLoading(false));
    } else {
      initializeSession(setUser).finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    if (user) {
      handleUserInsert(user);
    }
  }, [user]);

  const handleUserInsert = async (currentUser: User) => {
    const existingUser = await userModel.getUser(currentUser.email);
    try {
      if (!existingUser) {
        await userModel.insert({
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          password_hash: 'GOOGLE_AUTH', // For Google-authenticated users
          created_at: new Date().toISOString()
        });
      }
      handlePatientData(currentUser);
    } catch (err) {
      console.log("User insert error: ", err);
    }
  };

  const handlePatientData = async (currentUser: User) => {
    try {
      const existingPatient = await patientModel.getPatientByUserId(
        currentUser.id
      );
      if (existingPatient) {
        setPatient(existingPatient);
      } else {
        const names = currentUser.name?.split(' ') || ['', ''];
        await patientModel.insert({
          user_id: currentUser.id,
          first_name: names[0],
          last_name: names.slice(1).join(' ') || names[0],
          created_at: new Date().toISOString()
        });
        const newPatient = await patientModel.getPatientByUserId(
          currentUser.id
        );
        setPatient(newPatient);
      }
    } catch (err) {
      console.log("Patient error: ", err);
    }
  };

  const medicalTiles = [
    {
      name: "Medical overview",
      image: require("../../../assets/images/medicalOverview.png"),
      badge: 5,
    },
    {
      name: "Emergency Care",
      image: require("../../../assets/images/emergencyCare.png"),
      badge: 3,
    },
    {
      name: "Allergies",
      image: require("../../../assets/images/allergies.png"),
      badge: 2,
    },
    {
      name: "Medications",
      image: require("../../../assets/images/medications.png"),
      badge: 6,
    },
    {
      name: "Medical History",
      image: require("../../../assets/images/medical-history.png"),
      badge: 1,
    },
    {
      name: "Hospitalization",
      image: require("../../../assets/images/hospitalization.png"),
      badge: 4,
    },
    {
      name: "Test 1",
      image: require("../../../assets/images/medicalOverview.png"),
      badge: 6,
    },
    {
      name: "Test 2",
      image: require("../../../assets/images/emergencyCare.png"),
      badge: 9,
    },
  ];

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg">Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg">Not logged in</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 m-0 ">
      <View
        style={{ backgroundColor: palette.primary }}
        className="py-4  px-6 "
      >
        <Text className="text-xl text-white font-bold text-center ">
          My Health
        </Text>

        <View className="flex-row items-center justify-between">
          <Avatar size="xl">
            <AvatarImage source={{ uri: user.picture }} />
            <View className="absolute bottom-0 right-0 bg-white rounded-full p-1">
              <Icon as={Camera} size="sm" className="text-black" />
            </View>
          </Avatar>

          <View className="mr-4">
            <Text className="text-lg text-white font-semibold">
              {user.name}
            </Text>
            <Text className="text-white">Age: {patient?.age ?? "Not set"}</Text>
            <Text className="text-white">
              Weight: {patient?.weight ? `${patient.weight} kg` : "Not set"}
            </Text>
          </View>

          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.push(ROUTES.EDIT_PROFILE)}>
              <Icon as={EditIcon} size="lg" className="text-white m-2" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push(ROUTES.EDIT_PROFILE)}>
              <Icon as={ShareIcon} size="lg" className="text-white m-2" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View className="px-5 py-1">
        <View>
          {Array.from({ length: Math.ceil(medicalTiles.length / 2) }).map(
            (_, rowIndex) => (
              <View key={rowIndex}>
                <View className="flex-row">
                  {[0, 1].map((colIndex) => {
                    const tileIndex = rowIndex * 2 + colIndex;
                    if (tileIndex >= medicalTiles.length) return null;
                    const tile = medicalTiles[tileIndex];
                    return (
                      <TouchableOpacity
                        key={tileIndex}
                        className="flex-1 items-center"
                      >
                        <View className="p-10 flex-row items-center justify-stretch">
                          <Box className="items-center w-[125px]">
                            <Image source={tile.image} resizeMode="contain" />
                            {tile.badge !== null && (
                              <Badge className="absolute -top-1 -right-1 rounded-full z-10 h-[22px] w-[22px] bg-[#49AFBE]">
                                <BadgeText className="text-xs text-white">
                                  {tile.badge}
                                </BadgeText>
                              </Badge>
                            )}
                            <Text className="text-center text-base flex-shrink pt-2">
                              {tile.name}
                            </Text>
                          </Box>
                          <Box>
                            <Image
                              source={require("../../../assets/images/arrow.png")}
                              className="w-4 h-4 ml-2"
                              resizeMode="contain"
                            />
                          </Box>
                        </View>
                        {colIndex === 0 && tileIndex % 2 === 0 && (
                          <View className="absolute right-0 top-0 bottom-0 w-px bg-black" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {rowIndex < Math.ceil(medicalTiles.length / 2) - 1 && (
                  <Divider className="bg-black" />
                )}
              </View>
            )
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
