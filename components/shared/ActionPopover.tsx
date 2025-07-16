import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import {
  Popover,
  PopoverBackdrop,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
} from "@/components/ui/popover";
import { MaterialIcons } from "@expo/vector-icons";

interface ActionPopoverProps {
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
  icon?: React.ReactNode;
}

export default function ActionPopover({
  onEdit,
  onDelete,
  editLabel = "Edit",
  deleteLabel = "Delete",
  icon,
}: ActionPopoverProps) {
  return (
    <Popover
      shouldOverlapWithTrigger={false}
      placement="bottom"
      size="md"
      crossOffset={-30}
      trigger={(triggerProps) => (
        <TouchableOpacity {...triggerProps} hitSlop={10}>
          {icon || <MaterialIcons name="more-vert" size={20} />}
        </TouchableOpacity>
      )}
    >
      <PopoverBackdrop />
      <PopoverContent
        className="bg-gray-50 pt-1 pb-0 px-4"
        style={{ minWidth: 110, minHeight: 90 }}
      >
        <PopoverArrow className="bg-gray-50" />
        <PopoverBody>
          <TouchableOpacity
            className="flex-row items-center py-2"
            onPress={onEdit}
          >
            <MaterialIcons name="edit" size={20} style={{ marginRight: 8 }} />
            <Text className="text-lg">{editLabel}</Text>
          </TouchableOpacity>
          <View className="h-px bg-gray-300" />
          <TouchableOpacity
            className="flex-row items-center py-2"
            onPress={onDelete}
          >
            <MaterialIcons name="delete" size={20} style={{ marginRight: 8 }} />
            <Text className="text-lg">{deleteLabel}</Text>
          </TouchableOpacity>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
