
import React from "react";
import { Text, View } from "react-native";
import {
  Question,
  ResponseOption as ResponseOptionType,
} from "@/services/database/migrations/v1/schema_v1";
import palette from "@/utils/theme/color";
import ResponseOption from "./ResponseOption";
import AddOtherInput from "../ AddOtherInput";
export default function MSQQuestion({
  question,
  value,
  onChange,
  responses = [],
  handleAddOption,
}: {
  question: Question;
  value?: string[];
  onChange: (val: string[]) => void;
  handleAddOption: (ques_id: number, val: string) => void;
  responses?: ResponseOptionType[];
}) {
  // Fallback to [] if value is null/undefined or not an array
  const normalize = (str: string) => String(str).trim().toLowerCase();
  const safeValue = Array.isArray(value) ? value : [];

const toggleOption = (opt: string) => {
  const normalizedOpt = opt.trim().toLowerCase();
  const normalizedValues = safeValue.map((v) => v.trim().toLowerCase());

  if (normalizedValues.includes(normalizedOpt)) {
    // remove while keeping original casing in stored values
    onChange(safeValue.filter((v) => v.trim().toLowerCase() !== normalizedOpt));
  } else {
    // add with original casing
    onChange([...safeValue, opt]);
  }
};


  return (
    <View className="mb-6">
      <Text
        style={{ color: palette.secondary }}
        className="font-bold text-lg mb-3"
      >
        {question.text}
      </Text>

      {/* Normal response options */}
      {responses
        .filter((opt) => normalize(opt.text) !== "other")
        .map((opt) => {
          const label = String(opt.text);
          return (
            <ResponseOption
              key={opt.id}
              label={label}
             selected={safeValue.some((v) => v.trim().toLowerCase() === label.trim().toLowerCase())}
              onPress={() => toggleOption(label)}
            />
          );
        })}

      {/* Custom responses already selected */}
      {safeValue
        .filter(
          (val) =>
            !responses.some(
              (opt) => normalize(opt.text) === normalize(val)
            )
        )
        .map((custom) => (
          <ResponseOption
            key={custom}
            label={custom}
            selected={true}
            onPress={() => toggleOption(custom)}
          />
        ))}

      {/* Add Other toggle / Input */}
      <AddOtherInput
        onSubmit={(newVal) => {
          if (!safeValue.includes(newVal)) {
            const updated = [...safeValue, newVal];
            handleAddOption(question.id, newVal);
            onChange(updated);
          }
        }}
      />
    </View>
  );
}
