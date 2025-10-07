import Header from "@/components/shared/Header";
import { PatientContext } from "@/context/PatientContext";
import { getRescueMedicationChartData, getInsightTopics } from "@/services/core/InsightsService";
import palette from "@/utils/theme/color";
import { router } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";
import { InsightTopicResponse } from "@/services/common/types";

interface ChartDataPoint {
  value: number;
  label: string;
}

export default function InsightsScreen() {
  const { patient } = useContext(PatientContext);
  const [rescueMedicationData, setRescueMedicationData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [insightTopics, setInsightTopics] = useState<InsightTopicResponse[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const loadRescueMedicationData = async (endDate: Date) => {
    if (!patient?.id) {
      setError("No patient data available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const dateString = endDate.toISOString().split('T')[0];
      const data = await getRescueMedicationChartData(patient.id, dateString);
      setRescueMedicationData(data);
    } catch (err) {
      console.error("Error loading rescue medication data:", err);
      setError("Failed to load rescue medication data");
      
      // Fallback to sample data for demo purposes
      setRescueMedicationData([
        { value: 2, label: "Mon" },
        { value: 1, label: "Tue" },
        { value: 3, label: "Wed" },
        { value: 0, label: "Thu" },
        { value: 1, label: "Fri" },
        { value: 2, label: "Sat" },
        { value: 0, label: "Sun" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRescueMedicationData(selectedDate);
  }, [patient, selectedDate]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(selectedDate.getDate() - 7);
    } else {
      newDate.setDate(selectedDate.getDate() + 7);
    }
    setSelectedDate(newDate);
  };

  const formatWeekRange = (date: Date) => {
    const endDate = new Date(date);
    const startDate = new Date(date);
    startDate.setDate(endDate.getDate() - 6);
    
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startDate.getDate();
    const startYear = startDate.getFullYear();
    
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const endDay = endDate.getDate();
    const endYear = endDate.getFullYear();
    
    if (startYear === endYear) {
      if (startMonth === endMonth) {
        return `${startMonth} ${startDay} - ${endDay}, ${startYear}`;
      } else {
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
      }
    } else {
      return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
    }
  };

  const renderChart = () => {
    if (loading) {
      return (
        <View className="h-64 justify-center items-center">
          <ActivityIndicator size="large" color={palette.primary} />
          <Text className="text-gray-600 mt-2">Loading chart data...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="h-64 justify-center items-center bg-gray-50 rounded-lg">
          <Text className="text-gray-600 text-center mb-2">{error}</Text>
          <Text className="text-sm text-gray-500 text-center">Showing sample data for demo</Text>
        </View>
      );
    }

    if (rescueMedicationData.length === 0) {
      return (
        <View className="h-64 justify-center items-center bg-gray-50 rounded-lg">
          <Text className="text-gray-600 text-center">No rescue medication data available</Text>
        </View>
      );
    }

    return (
      <LineChart
        data={rescueMedicationData}
        height={250}
        width={350}
        color="#4f46e5"
        thickness={3}
        showDataPointOnFocus
        focusEnabled
        dataPointsColor="#4f46e5"
        xAxisLabelTextStyle={{ color: "gray", fontSize: 12 }}
        yAxisTextStyle={{ color: "gray", fontSize: 12 }}
        renderTooltip={(item: { value: number; label: string }) => (
          <View 
            style={{ backgroundColor: palette.primary }}
            className="px-2 py-1 rounded-lg">
            <Text className="text-white text-sm">{item.value}</Text>
          </View>
        )}
      />
    );
  };

  // Function to test getInsightTopics
  const testGetInsightTopics = async () => {
    if (!patient?.id) {
      setError("No patient data available");
      return;
    }

    try {
      setLoadingInsights(true);
      const topics = await getInsightTopics({ patientId: String(patient.id) });
      setInsightTopics(topics);
      console.log("Insight topics:", topics);
    } catch (err) {
      console.error("Error loading insight topics:", err);
      setError("Failed to load insight topics");
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        title="Insights"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView className="flex-1 bg-gray-100 p-4">
        {/* Test Button for getInsightTopics */}
        <View className="bg-white p-4 rounded-lg mb-4">
          <Text className="text-xl font-bold text-gray-800 mb-2">
            Test Insights API
          </Text>
          <TouchableOpacity 
            onPress={testGetInsightTopics}
            className="bg-blue-500 py-2 px-4 rounded-lg"
            disabled={loadingInsights}
          >
            <Text className="text-white text-center font-medium">
              {loadingInsights ? "Loading..." : "Get Available Insights"}
            </Text>
          </TouchableOpacity>
          
          {/* Display Insight Topics */}
          {insightTopics.length > 0 && (
            <View className="mt-4">
              <Text className="text-lg font-semibold mb-2">Available Insights:</Text>
              {insightTopics.map((topic, index) => (
                <View key={index} className="bg-gray-100 p-3 rounded-lg mb-2">
                  <Text className="font-medium">{topic.insightName}</Text>
                  <Text className="text-gray-600 text-sm">Key: {topic.insightKey}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Text className="text-xl font-bold text-gray-800 mb-4">
          Rescue Medication Usage
        </Text>
        
        {/* Calendar Navigation */}
        <View className="bg-white p-4 rounded-lg mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity 
              onPress={() => navigateWeek('prev')}
              className="p-2 rounded-full bg-gray-100"
            >
              <Text className="text-gray-600 text-lg font-bold">‹</Text>
            </TouchableOpacity>
            
            <View className="flex-1 items-center">
              <Text className="text-lg font-semibold text-gray-800 text-center">
                {formatWeekRange(selectedDate)}
              </Text>
              <TouchableOpacity 
                onPress={() => setSelectedDate(new Date())}
                className="mt-1"
              >
                <Text className="text-sm text-blue-600">Today</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              onPress={() => navigateWeek('next')}
              className="p-2 rounded-full bg-gray-100"
            >
              <Text className="text-gray-600 text-lg font-bold">›</Text>
            </TouchableOpacity>
          </View>
          
          {/* Chart */}
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Weekly Rescue Medication Usage
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Track: "How many times did you need to take a rescue/as-needed medication?"
          </Text>
          
          {renderChart()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}