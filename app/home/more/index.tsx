import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { PatientContext } from "@/context/PatientContext";
import { PDFExportService } from "@/services/PDFExportService";
import palette from "@/utils/theme/color";
import { useContext, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function More() {
  const { patient } = useContext(PatientContext);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPatientData = async () => {
    if (!patient || isExporting) return;
    
    setIsExporting(true);
    try {
      await PDFExportService.exportPatientDataToPDF(patient.id);
    } catch (error) {
      console.error("Error exporting patient data:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 py-6">
        <Text className="text-2xl font-bold mb-6">More Options</Text>
        
        <Box className="rounded-lg p-4 mb-4">
          <Text className="text-lg font-semibold mb-4">Export Options</Text>
          
          <Button 
            variant="outline" 
            className="border border-gray-300 mb-2"
            onPress={handleExportPatientData}
            disabled={isExporting || !patient}
          >
            <View className="flex-row items-center justify-center w-full">
              <ButtonText className="text-base font-medium text-center">
                {isExporting ? "Exporting..." : "Export Patient Data as PDF"}
              </ButtonText>
              {isExporting && (
                <ActivityIndicator 
                  size="small" 
                  color={palette.primary} 
                  style={{ marginLeft: 8 }} 
                />
              )}
            </View>
          </Button>
          
          <Text className="text-xs text-gray-500 mt-2">
            Export your patient information to a PDF file that you can save or share.
          </Text>
        </Box>
      </View>
    </SafeAreaView>
  );
}