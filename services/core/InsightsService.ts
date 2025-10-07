import { useModel } from '@/services/database/BaseModel';
import { tables } from '@/services/database/migrations/v1/schema_v1';
import { TrackResponseModel } from '@/services/database/models/TrackResponseModel';
import { InsightTopicRequest, InsightTopicResponse } from '@/services/common/types';
import insightsConfig from '@/services/config/insights.json';

// Single shared instance of model
const trackResponseModel = new TrackResponseModel();

export interface DailyRescueMedicationData {
    date: string;
    count: number;
}

//Converts MM-DD-YYYY format to YYYY-MM-DD format
const convertDateFormat = (dateStr: string): string => {
    if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
        const [month, day, year] = dateStr.split('-');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
};

export const getRescueMedicationWeekData = async (
    patientId: number,
    endDate: string
): Promise<DailyRescueMedicationData[]> => {
    return useModel(trackResponseModel, async (model: any) => {
        // Fetch all rescue medication responses for the patient
        const result = await model.runQuery(
            `SELECT tie.date, tr.answer 
             FROM ${tables.TRACK_RESPONSE} tr 
             INNER JOIN ${tables.TRACK_ITEM_ENTRY} tie ON tr.track_item_entry_id = tie.id 
             WHERE tr.patient_id = ? AND tr.question_id = 1 
             ORDER BY tie.date ASC`,
            [patientId]
        );

        // Process responses and create data map
        const dataMap = new Map<string, number>();
        result.forEach((row: any) => {
            let count = 0;
            try {
                const answerValue = typeof row.answer === 'string' ? 
                    JSON.parse(row.answer) : row.answer;
                count = parseInt(answerValue) || 0;
            } catch (e) {
                count = parseInt(row.answer) || 0;
            }
            
            const convertedDate = convertDateFormat(row.date);
            dataMap.set(convertedDate, count);
        });

        // Generate week data (6 days before + endDate)
        const weekData: DailyRescueMedicationData[] = [];
        const endDateObj = new Date(endDate);
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(endDateObj);
            date.setDate(endDateObj.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            weekData.push({
                date: dateStr,
                count: dataMap.get(dateStr) || 0
            });
        }

        return weekData;
    });
};

//Gets chart-ready data for rescue medication usage
export const getRescueMedicationChartData = async (
    patientId: number,
    endDate: string
): Promise<{ value: number; label: string }[]> => {
    const weekData = await getRescueMedicationWeekData(patientId, endDate);
    
    return weekData.map((day) => ({
        value: day.count,
        label: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })
    }));
};

/**
 * Gets available insight topics for a patient based on their selected track items
 * and questions that are suitable for insights (numeric and boolean types)
 * @param request The request containing patient ID
 * @returns Array of available insight topics
 */
export const getInsightTopics = async (
    request: InsightTopicRequest
): Promise<InsightTopicResponse[]> => {
    return useModel(trackResponseModel, async (model: any) => {
        // Get all active track items that the patient has selected
        const selectedItems = await model.runQuery(
            `SELECT ti.id, ti.code, ti.status 
             FROM ${tables.TRACK_ITEM} ti 
             INNER JOIN ${tables.TRACK_ITEM_ENTRY} tie ON ti.id = tie.track_item_id 
             WHERE tie.patient_id = ? AND ti.status = 'active' AND tie.selected = 1`,
            [request.patientId]
        );
        
        // Get all questions of numeric or boolean type
        const insightQuestions = await model.runQuery(
            `SELECT q.id, q.code, q.type, q.item_id 
             FROM ${tables.QUESTION} q 
             WHERE q.type IN ('numeric', 'boolean')`,
            []
        );
        
        // Map of track item codes to their associated questions suitable for insights
        const trackItemQuestionsMap = new Map();
        
        // Populate the map with selected track items and their insight-suitable questions
        selectedItems.forEach((item: any) => {
            const itemQuestions = insightQuestions.filter(
                (q: any) => q.item_id === item.id
            );
            if (itemQuestions.length > 0) {
                trackItemQuestionsMap.set(item.code, itemQuestions);
            }
        });
        
        // Filter insights from config based on available track items and questions
        const availableInsights: InsightTopicResponse[] = [];
        
        insightsConfig.forEach((insight: any) => {
            const trackItemCode = insight.insightKey;
            const questionCode = insight.questionCode;
            
            // Check if this track item is selected by the patient and has the required question
            if (trackItemQuestionsMap.has(trackItemCode)) {
                const questions = trackItemQuestionsMap.get(trackItemCode);
                const matchingQuestion = questions.find((q: any) => q.code === questionCode);
                
                if (matchingQuestion) {
                    availableInsights.push({
                        insightName: insight.insightName,
                        insightKey: insight.insightKey
                    });
                }
            }
        });
        
        return availableInsights;
    });
};
