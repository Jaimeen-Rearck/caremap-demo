import { useModel } from '@/services/database/BaseModel';
import { tables } from '@/services/database/migrations/v1/schema_v1';
import { TrackResponseModel } from '@/services/database/models/TrackResponseModel';

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
