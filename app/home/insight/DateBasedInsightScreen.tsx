import React, { useContext, useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Text, Button, Spinner, Icon } from '@gluestack-ui/themed';
import { PatientContext } from '@/context/PatientContext';
import { getAllDateBasedInsights } from '@/services/core/InsightsService';
import { format, parse } from 'date-fns';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { CalendarDaysIcon } from 'lucide-react-native';
import insightsConfig from '@/services/config/insights.json';

export default function DateBasedInsightScreen() {
  const { patient } = useContext(PatientContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insightData, setInsightData] = useState<any>(null);
  
  // User input states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [allInsightsData, setAllInsightsData] = useState<any[]>([]);

  // Format date for display
  const formatDate = (date: Date): string => {
    return format(date, 'MM-dd-yyyy');
  };

  // Handle date selection
  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };
  
  // Automatically fetch insights when date changes
  useEffect(() => {
    if (patient?.id) {
      fetchAllInsights();
    }
  }, [selectedDate, patient?.id]);

  const fetchAllInsights = async () => {
    if (!patient?.id) {
      setError('No patient data available');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const allData = await getAllDateBasedInsights(
        patient.id.toString(),
        formattedDate
      );
      
      // Log with JSON stringify to show full structure
      console.debug('All insights data:', JSON.stringify(allData, null, 2));
      
      // Add insightName to each insight for better display
      const enhancedData = allData.map(insight => {
        const config = insightsConfig.find(cfg => cfg.insightKey === (insight as any).insightKey);
        return {
          ...insight,
          insightName: config?.insightName || 'Unknown Insight'
        };
      });
      
      setAllInsightsData(enhancedData);
      setInsightData(null); // Clear old single insight data
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (series: any, insightName: string) => {
    if (!series || !series.data || series.data.length === 0) {
      return (
        <View key={`${insightName}-${series?.topic || 'no-data'}`} className="mb-4">
          <Text className="text-lg font-bold mb-2">{insightName}: {series?.topic || 'No Data'}</Text>
          <View className="p-4 bg-gray-100 rounded-lg">
            <Text>No data available for this insight</Text>
          </View>
        </View>
      );
    }

    const chartData = {
      labels: series.data.map((point: any) => point.label),
      datasets: [{
        data: series.data.map((point: any) => point.value)
      }]
    };

    return (
      <View key={`${insightName}-${series.topic}`} className="mb-4">
        <Text className="text-lg font-bold mb-2">{insightName}: {series.topic}</Text>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 32}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            style: {
              borderRadius: 16
            }
          }}
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
        />
      </View>
    );
  };

  return (
    <ScrollView className="flex-1 p-4 bg-white">
      <Text className="text-2xl font-bold mb-4">Date-Based Insights</Text>
      
      {/* Date Picker */}
      <View className="mb-4">
        <Text className="text-lg font-semibold mb-2">Select Date</Text>
        <TouchableOpacity 
          onPress={() => setShowDatePicker(true)}
          className="flex-row items-center border border-gray-300 rounded-md p-2"
        >
          <CalendarDaysIcon size={24} color="#0077FF" />
          <Text className="ml-2">{formatDate(selectedDate)}</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          onConfirm={handleDateConfirm}
          onCancel={() => setShowDatePicker(false)}
          date={selectedDate}
        />
      </View>

      {/* Display Selected Parameters */}
      <View className="mb-4 p-3 bg-gray-100 rounded-lg">
        <Text className="font-semibold">Selected Date:</Text>
        <Text>{formatDate(selectedDate)}</Text>
        <Text className="mt-2 text-sm text-gray-600">All available insights for this date will be displayed</Text>
      </View>

      {/* Fetch Button */}
      <Button
        onPress={fetchAllInsights}
        className="mb-4"
        disabled={loading}
      >
        <Text className="text-white font-semibold">
          {loading ? 'Loading...' : 'Fetch All Insights'}
        </Text>
      </Button>

      {/* Error Message */}
      {error && (
        <View className="mb-4 p-3 bg-red-100 rounded-lg">
          <Text className="text-red-700">{error}</Text>
        </View>
      )}

      {/* Loading Indicator */}
      {loading && (
        <View className="items-center justify-center py-4">
          <Spinner size="large" />
        </View>
      )}

      {/* All Insights Data */}
      {allInsightsData && allInsightsData.length > 0 ? (
        <View className="mt-4">
          <Text className="text-xl font-bold mb-2">All Insights for {formatDate(selectedDate)}</Text>
          {allInsightsData.map((insightData: any) => (
            <View key={insightData.insightKey} className="mb-6 p-3 bg-gray-50 rounded-lg">
              <Text className="text-lg font-bold mb-2">{insightData.insightName}</Text>
              
              {/* Display date range */}
              <View className="mb-2 p-2 bg-gray-100 rounded">
                <Text className="text-sm">Period: {insightData.startDate} to {insightData.endDate}</Text>
              </View>
              
              {insightData.series && insightData.series.length > 0 ? (
                <>
                  {insightData.series.map((series: any) => (
                    <View key={`${insightData.insightKey}-${series.topic}`} className="mb-4">
                      {/* Display series topic */}
                      <Text className="font-bold mb-1">{series.topic}</Text>
                      
                      {/* Display data points in a table-like format */}
                      <View className="border border-gray-200 rounded-lg overflow-hidden">
                        <View className="flex-row bg-gray-100 p-2">
                          <Text className="flex-1 font-bold">Date</Text>
                          <Text className="flex-1 font-bold">Value</Text>
                          {series.data[0]?.unit && <Text className="w-20 font-bold">Unit</Text>}
                        </View>
                        
                        {series.data && series.data.length > 0 ? (
                          series.data.map((point: any, index: number) => (
                            <View key={index} className="flex-row p-2 border-t border-gray-200">
                              <Text className="flex-1">{point.label}</Text>
                              <Text className="flex-1">{point.value}</Text>
                              {point.unit && <Text className="w-20">{point.unit}</Text>}
                            </View>
                          ))
                        ) : (
                          <View className="p-2">
                            <Text>No data points available</Text>
                          </View>
                        )}
                      </View>
                      
                      {/* Still render the chart for visual representation */}
                      {renderChart(series, insightData.insightName)}
                    </View>
                  ))}
                </>
              ) : (
                <View className="p-4 bg-gray-100 rounded-lg">
                  <Text>No data available for this insight</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ) : (
        allInsightsData && allInsightsData.length === 0 && (
          <View className="mt-4 p-4 bg-gray-100 rounded-lg">
            <Text className="text-center">No insights data available for the selected date</Text>
          </View>
        )
      )}

      {/* Legacy Single Insight Data - for backward compatibility */}
      {insightData && (
        <View className="mt-4">
          <Text className="text-xl font-bold mb-2">Results</Text>
          {insightData.series.map((series: any) => renderChart(series, insightData.insightName || "Insight"))}
        </View>
      )}
    </ScrollView>
  );
}