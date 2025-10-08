import React, { useContext, useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Text, Button, Spinner, Select, SelectTrigger, SelectInput, SelectPortal, SelectItem, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectBackdrop, Icon } from '@gluestack-ui/themed';
import { PatientContext } from '@/context/PatientContext';
import { getDateBasedInsights } from '@/services/core/InsightsService';
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
  const [selectedInsight, setSelectedInsight] = useState('i_exer_rout');
  const [selectedQuestion, setSelectedQuestion] = useState('q_exer_min');
  const [availableQuestions, setAvailableQuestions] = useState<string[]>([]);

  // Update available questions when insight changes
  useEffect(() => {
    const insight = insightsConfig.find(i => i.insightKey === selectedInsight);
    if (insight) {
      setSelectedQuestion(insight.questionCode);
      // Just use the question code for simplicity
      setAvailableQuestions([insight.questionCode]);
    }
  }, [selectedInsight]);

  // Format date for display
  const formatDate = (date: Date): string => {
    return format(date, 'MM-dd-yyyy');
  };

  // Handle date selection
  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  // Insight request based on user selections
  const insightRequest = {
    patientId: patient?.id?.toString() || '',
    selectedDate: format(selectedDate, 'yyyy-MM-dd'),
    insightKey: selectedInsight,
    questionCode: selectedQuestion
  };

  const fetchInsights = async () => {
    if (!patient?.id) {
      setError('No patient data available');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getDateBasedInsights(insightRequest);
      console.debug('Insights data:', data);
      setInsightData(data);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (series: any) => {
    const chartData = {
      labels: series.data.map((point: any) => point.label),
      datasets: [{
        data: series.data.map((point: any) => point.value)
      }]
    };

    return (
      <View key={series.topic} className="mb-4">
        <Text className="text-lg font-bold mb-2">{series.topic}</Text>
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
    <ScrollView className="flex-1 bg-gray-100 p-4">
      <View className="bg-white p-4 rounded-lg mb-4">
        <Text className="text-xl font-bold mb-4">Date-based Insights Test</Text>
        
        <Text className="mb-2">Select parameters:</Text>
        
        {/* Date Picker */}
        <View className="mb-4">
          <Text className="text-gray-600 text-base mb-2">Date</Text>
          <TouchableOpacity
            className="border border-gray-300 rounded-md px-3"
            onPress={() => setShowDatePicker(true)}
          >
            <View className="flex-row items-center">
              <TextInput
                value={formatDate(selectedDate)}
                placeholder="MM-DD-YY"
                className="flex-1 text-base py-2"
                editable={false}
                pointerEvents="none"
              />
              <Icon
                as={CalendarDaysIcon}
                className="text-typography-500 m-1 w-5 h-5"
              />
            </View>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            onConfirm={handleDateConfirm}
            onCancel={() => setShowDatePicker(false)}
          />
        </View>
        
        {/* Insight Type Radio Buttons */}
        <View className="mb-4">
          <Text className="text-gray-600 text-base mb-2">Insight Type</Text>
          <View className="space-y-2">
            {insightsConfig.map((insight) => (
              <TouchableOpacity 
                key={insight.insightKey}
                onPress={() => {
                  setSelectedInsight(insight.insightKey);
                  setSelectedQuestion('');
                }}
                className="flex-row items-center space-x-2"
              >
                <View 
                  className={`w-5 h-5 rounded-full border ${selectedInsight === insight.insightKey ? 'bg-blue-500 border-blue-500' : 'border-gray-300'} justify-center items-center`}
                >
                  {selectedInsight === insight.insightKey && (
                    <View className="w-2.5 h-2.5 rounded-full bg-white" />
                  )}
                </View>
                <Text>{insight.insightName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Question Radio Buttons */}
        {selectedInsight && availableQuestions.length > 0 && (
          <View className="mb-4">
            <Text className="text-gray-600 text-base mb-2">Question</Text>
            <View className="space-y-2">
              {availableQuestions.map((question) => (
                <TouchableOpacity 
                  key={question}
                  onPress={() => setSelectedQuestion(question)}
                  className="flex-row items-center space-x-2"
                >
                  <View 
                    className={`w-5 h-5 rounded-full border ${selectedQuestion === question ? 'bg-blue-500 border-blue-500' : 'border-gray-300'} justify-center items-center`}
                  >
                    {selectedQuestion === question && (
                      <View className="w-2.5 h-2.5 rounded-full bg-white" />
                    )}
                  </View>
                  <Text>{question}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Display selected parameters */}
        <View className="mb-4 p-3 bg-gray-50 rounded-md">
          <Text className="text-sm text-gray-600">Selected Parameters:</Text>
          <Text className="text-sm">Date: {format(selectedDate, 'yyyy-MM-dd')}</Text>
          <Text className="text-sm">Insight Key: {selectedInsight}</Text>
          <Text className="text-sm">Question Code: {selectedQuestion}</Text>
        </View>
        
        <Button
          onPress={fetchInsights}
          disabled={loading}
          className="bg-blue-500 py-2 px-4 rounded-lg mt-2"
        >
          <Text className="text-white text-center">
            {loading ? 'Loading...' : 'Fetch Insights'}
          </Text>
        </Button>

        {loading && (
          <View className="items-center mt-4">
            <Spinner size="large" />
          </View>
        )}

        {error && (
          <View className="mt-4 p-4 bg-red-100 rounded-lg">
            <Text className="text-red-600">{error}</Text>
          </View>
        )}

        {insightData && (
          <View className="mt-4">
            <Text className="text-lg font-bold mb-2">Results:</Text>
            <Text className="mb-2">
              Period: {insightData.startDate} to {insightData.endDate}
            </Text>
            {insightData.series.map((series: any) => renderChart(series))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}