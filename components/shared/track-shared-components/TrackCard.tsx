import palette from "@/utils/theme/color";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

// interface TrackItem {
//   id: number;
//   name: string;
// }

interface TrackCardProps {
  item_id: number;
  entry_id: number;
  item_name: string;
  completed: number;
  total: number;
  date: string; // formatted date string
}
export default function TrackCard({
  item_id,
  entry_id,
  item_name,
  completed,
  total,
  date,
}: TrackCardProps) {
  const router = useRouter();
  const progressValue = total > 0 ? (completed / total) * 100 : 0;

  return (
    <View
      className="rounded-xl px-4 py-5 mb-4"
      style={{ backgroundColor: palette.trackCardBackground }}
    >
      <View className="flex-row justify-between mb-3">
        <Text style={{ fontSize: 16, color: palette.secondary }}>
          {item_name}
        </Text>
        <Text style={{ fontSize: 14, color: palette.secondary }}>Daily</Text>
      </View>

      {total > 0 && completed > 0 ? (
        // NOTE : Removed the Progress bar & added this Test Button Component to Edit the Tracked Item.
        <TouchableOpacity
          style={{ backgroundColor: palette.primary }}
          className="py-3 rounded-lg items-center"
          onPress={() =>
            router.push({
              pathname: "/home/track/questions/[itemId]",
              params: {
                itemId: item_id.toString(),
                itemName: item_name,
                entryId: entry_id.toString(),
              },
            })
          }
        >
          <Text className="text-white font-bold">Edit {item_name}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={{ backgroundColor: palette.primary }}
          className="py-3 rounded-lg items-center"
          onPress={() =>
            router.push({
              pathname: "/home/track/questions/[itemId]",
              params: {
                itemId: item_id.toString(),
                itemName: item_name,
                entryId: entry_id.toString(),
              },
            })
          }
        >
          <Text className="text-white font-bold">Begin</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
