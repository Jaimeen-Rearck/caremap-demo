import {
  initializeMockSession,
  isAndroid,
} from "@/android-bypass/google-auth-android";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import { Grid, GridItem } from "@/components/ui/grid";
import { EditIcon, Icon, ShareIcon } from "@/components/ui/icon";
import { PatientContext } from "@/context/PatientContext";
import { UserContext } from "@/context/UserContext";
import { initializeAuthSession } from "@/services/auth-service/google-auth";
import { syncPatientSession } from "@/services/auth-service/session-service";
import { ShowAlert } from "@/services/common/ShowAlert";
import { calculateAge } from "@/services/core/utils";
import { logger } from "@/services/logging/logger";
import { ROUTES } from "@/utils/route";
import palette from "@/utils/theme/color";
import { router } from "expo-router";
import { User } from "lucide-react-native";
import { useContext, useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function HealthProfile() {
  const { user, setUserData } = useContext(UserContext);
  const { patient, setPatientData } = useContext(PatientContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAndroid) {
      logger.debug("Android? :", isAndroid);
      initializeMockSession(setUserData).finally(() => setLoading(false));
    } else {
      initializeAuthSession(setUserData).finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    const sync = async () => {
      try {
        if (!user) return;
        const patientData = await syncPatientSession(user);
        setPatientData(patientData);
      } catch (err) {
        logger.debug("Failed to sync patient session:", err);
        return ShowAlert("e", `Failed to sync patient data.`);
      } finally {
        setLoading(false);
      }
    };

    sync();
  }, [user]);

  const medicalTiles = [
    {
      name: "Medical overview",
      image: require("@/assets/images/medicalOverview.png"),
      badge: 5,
      link: ROUTES.MEDICAL_OVERVIEW,
    },
    {
      name: "Emergency Care",
      image: require("@/assets/images/emergencyCare.png"),
      badge: 3,
      link: ROUTES.EMERGENCY_CARE,
    },
    {
      name: "Allergies",
      image: require("@/assets/images/allergies.png"),
      badge: 2,
      link: ROUTES.ALLERGIES,
    },
    {
      name: "Medications",
      image: require("@/assets/images/medications.png"),
      badge: 6,
      link: ROUTES.MEDICATIONS,
    },
    {
      name: "Medical History",
      image: require("@/assets/images/medical-history.png"),
      badge: 1,
      link: ROUTES.MEDICAL_HISTORY,
    },
    {
      name: "Notes",
      image: require("@/assets/images/hospitalization.png"),
      badge: 4,
      link: ROUTES.NOTES,
    },
    // {
    //   name: "Test 1",
    //   image: require("@/assets/images/medicalOverview.png"),
    //   badge: 6,
    //   link: ROUTES.MEDICAL_OVERVIEW,
    // },
    // {
    //   name: "Test 2",
    //   image: require("@/assets/images/emergencyCare.png"),
    //   badge: 9,
    //   link: ROUTES.MEDICAL_OVERVIEW,
    // },
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
  // === Layout constants ===
  const COLUMNS = 2 as const;
  const gridColsClass = "grid-cols-2"; // gluestack grid expects 1..12
  return (
    <SafeAreaView className="flex-1 m-0 bg-white">
      <View
        style={{ backgroundColor: palette.primary }}
        className="pt-4 pb-6 px-6 "
      >
        <Text className="text-xl text-white font-bold text-center ">
          My Health
        </Text>

        <View className="flex-row items-center justify-between">
          <Avatar size="xl" className="border border-white shadow-md">
            {patient?.profile_picture ? (
              <AvatarImage source={{ uri: patient.profile_picture }} />
            ) : (
              <View className="w-full h-full items-center justify-center bg-gray-200 rounded-full">
                <Icon as={User} size="xl" className="text-gray-500" />
              </View>
            )}
          </Avatar>

          <View>
            <Text className="text-xl text-white font-semibold">
              {`${patient?.first_name} ${patient?.last_name}`}
            </Text>
            <Text className="text-white  font-semibold">
              Age:{" "}
              {calculateAge(patient?.date_of_birth)
                ? `${calculateAge(patient?.date_of_birth)} years`
                : "Not set"}
            </Text>
            <Text className="text-white  font-semibold">
              Weight:{" "}
              {patient?.weight
                ? `${patient.weight} ${patient.weight_unit ?? ""}`
                : "Not set"}
            </Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity
              className="bg-white/20  rounded-full mx-1"
              onPress={() => router.push(ROUTES.EDIT_PROFILE)}
            >
              <Icon as={EditIcon} size="lg" className="text-white m-2" />
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-white/20  rounded-full mx-1"
              onPress={() => router.push(ROUTES.EDIT_PROFILE)}
            >
              <Icon as={ShareIcon} size="lg" className="text-white m-2" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* --- Tiles Grid (gluestack Grid) --- */}
      <ScrollView
        className="bg-white flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <Box className="flex-1 p-2">
          <View className=" overflow-hidden bg-white">
            <Grid className="gap-0" _extra={{ className: gridColsClass }}>
              {medicalTiles.map((tile, index) => {
                const row = Math.floor(index / COLUMNS);
                const col = index % COLUMNS;

                const isLastOdd =
                  medicalTiles.length % COLUMNS === 1 &&
                  index === medicalTiles.length - 1;

                // Normal border rules
                let cellBorders = [
                  row > 0 ? "border-t border-gray-300" : "",
                  col > 0 ? "border-l border-gray-300" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                // Special case: last odd full-width item
                if (isLastOdd) {
                  cellBorders = [
                    row > 0 ? "border-t border-gray-300" : "",
                    "border-l border-gray-300 border-r border-gray-300",
                  ]
                    .filter(Boolean)
                    .join(" ");
                }

                return (
                  <GridItem
                    key={tile.name + index}
                    className={`items-stretch justify-stretch ${cellBorders}`}
                    _extra={{
                      className: isLastOdd ? "col-span-2" : "col-span-1",
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.65}
                      onPress={() => router.push(tile.link as any)}
                      // className="w-full items-center justify-center py-6 min-h-[132px]"
                      className=" m-2 bg-white border border-gray-200 rounded-sm shadow-sm items-center justify-center min-h-[132px]"
                    >
                      <View className="relative">
                        <Image
                          source={tile.image}
                          style={{ width: 59, height: 59 }}
                          resizeMode="contain"
                        />
                        {/* 🔹 Optional Badge */}
                        {/* {tile.badge ? (
                          <View className="absolute -top-2 -right-2 bg-red-500 rounded-full px-2 py-1 shadow">
                            <Text className="text-white text-xs font-bold">
                              {tile.badge}
                            </Text>
                          </View>
                        ) : null} */}
                      </View>
                      {/* <View className="flex-row items-center mt-2">
                        <Text className="text-base">{tile.name}</Text>
                      </View> */}
                      <Text
                        style={{ color: palette.heading }}
                        className="mt-3 text-lg font-semibold text-center"
                      >
                        {tile.name}
                      </Text>
                    </TouchableOpacity>
                  </GridItem>
                );
              })}
            </Grid>
          </View>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
