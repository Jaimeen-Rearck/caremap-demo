# Insights Module Documentation

## Overview

The Insights module provides data visualization and analytics capabilities for tracked health metrics. It allows users to view trends and patterns in their health data over time, organized by daily, weekly, and monthly frequencies.

## Architecture

### Core Components

1. **Frontend Components**
   - `DateBasedInsightScreen.tsx`: Main UI component for displaying date-based insights
   - Chart visualization components for rendering data

2. **Backend Services**
   - `InsightsService.ts`: Core service handling data retrieval and processing
   - Database interaction through the `TrackResponseModel`

3. **Configuration**
   - `insights.json`: Configuration file defining available insights, their data sources, and display properties

4. **Data Models**
   - Uses database tables: `TRACK_ITEM`, `TRACK_ITEM_ENTRY`, `QUESTION`, `TRACK_RESPONSE`

## Data Flow

1. **Data Collection**
   - Users track health metrics through the tracking module
   - Data is stored in `TRACK_RESPONSE` table linked to `TRACK_ITEM_ENTRY`

2. **Data Retrieval Process**
   - When a user selects a date in the insights screen:
     1. `getAllDateBasedInsights` is called with patient ID and selected date
     2. The system queries for track items that were tracked on the selected date
     3. For each tracked item, corresponding insight data is retrieved
     4. Data is processed and formatted for visualization

3. **Data Transformation**
   - Raw data is transformed based on the insight type (numeric/boolean)
   - Data points are organized by frequency (daily/weekly/monthly)
   - Time ranges are calculated based on the selected date:
     - Daily items: Week range (Monday-Sunday)
     - Weekly items: Month range
     - Monthly items: Quarter range

## Backend Services

### InsightsService.ts

#### Key Functions

1. **getAllDateBasedInsights**
   ```typescript
   getAllDateBasedInsights(patientId: string, selectedDate: string): Promise<DateBasedInsightResponse[]>
   ```
   - Retrieves all insights data for a selected date
   - Filters insights to only include items tracked on the selected date
   - Handles date format differences between database and query

2. **getDateBasedInsights**
   ```typescript
   getDateBasedInsights(request: DateBasedInsightRequest): Promise<DateBasedInsightResponse>
   ```
   - Gets detailed insight data for a specific track item
   - Includes trends based on frequency (daily/weekly/monthly)

3. **getInsightTopics**
   ```typescript
   getInsightTopics(request: InsightTopicRequest): Promise<InsightTopicResponse[]>
   ```
   - Returns available insight topics for a patient
   - Filters based on track items selected by the patient
   - Only includes items with numeric or boolean questions

4. **Helper Functions**
   - `getDateRange`: Calculates date ranges based on frequency
   - `formatDataPoints`: Formats data points for visualization

### Data Types

```typescript
// Request types
export interface InsightTopicRequest {
  patientId: string;
}

export interface DateBasedInsightRequest {
  patientId: string;
  selectedDate: string;
  insightKey: string;
  questionCode: string;
}

// Response types
export interface InsightTopicResponse {
  insightName: string;
  insightKey: string;
}

export interface InsightDataPoint {
  label: string;
  date: string;
  value: number;
}

export interface InsightSeries {
  questionId: number;
  transform: string;
  topicId: number;
  topic: string;
  data: InsightDataPoint[];
}

export interface DateBasedInsightResponse {
  startDate: string;
  endDate: string;
  series: InsightSeries[];
}
```

## Frontend Components

### DateBasedInsightScreen.tsx

This is the main UI component for displaying insights. Key features include:

1. **Date Selection**
   - Calendar interface for selecting the date to view insights
   - Automatically fetches insights when date changes

2. **Data Display**
   - Renders charts for each insight series
   - Shows data in both chart and tabular formats
   - Displays period range for context

3. **User Interaction**
   - Fetch button to manually refresh data
   - Error handling and loading states

## Configuration

### insights.json

This configuration file defines the available insights in the system:

```json
[
  {
    "insightName": "Daily Exercise Duration",
    "insightKey": "i_exer_rout",
    "questionCode": "q_exer_min",
    "frequencies": ["daily"],
    "transform": "numeric",
    "unit": "minutes"
  },
  {
    "insightName": "Emergency Medication",
    "insightKey": "i_emergency_medication",
    "questionCode": "q_emergency_med_times",
    "frequencies": ["weekly"],
    "transform": "numeric",
    "unit": "times"
  },
  {
    "insightName": "Meal Quality",
    "insightKey": "i_meal_quality",
    "questionCode": "q_food_issue",
    "frequencies": ["daily"],
    "transform": "boolean",
    "unit": "issues"
  },
  {
    "insightName": "Sick Visits",
    "insightKey": "i_sick_visits",
    "questionCode": "q_leave_times",
    "frequencies": ["monthly"],
    "transform": "numeric",
    "unit": "visits"
  }
]
```

Each insight configuration includes:
- `insightName`: Display name for the insight
- `insightKey`: Unique identifier (matches track item code)
- `questionCode`: The specific question to use for data
- `frequencies`: Array of supported frequencies (daily/weekly/monthly)
- `transform`: Data type transformation (numeric/boolean)
- `unit`: Display unit for the values

## Database Schema

The insights module relies on these key tables:

1. **TRACK_ITEM**
   - Contains the definition of trackable health metrics
   - Fields: id, category_id, code, name, frequency, status

2. **TRACK_ITEM_ENTRY**
   - Links track items to patients on specific dates
   - Fields: id, user_id, patient_id, track_item_id, date, selected

3. **QUESTION**
   - Defines questions associated with track items
   - Fields: id, item_id, code, text, type, required, status

4. **TRACK_RESPONSE**
   - Stores patient responses to questions
   - Fields: id, user_id, patient_id, question_id, track_item_entry_id, answer

## Implementation Details

### Date Handling

The system handles multiple date formats to ensure compatibility:
- Primary format: `YYYY-MM-DD`
- Alternative format: `MM-DD-YYYY`

The query for tracked items uses both exact matching and LIKE patterns to handle these format differences.

### Data Filtering

Insights are filtered to only show data for items that were tracked on the selected date:
1. Query for track items tracked on the selected date
2. Create a set of tracked item codes
3. Only process insights for items in this set

### Error Handling

The system includes robust error handling:
- Individual insight errors are caught and logged
- Processing continues even if one insight fails
- Error states are displayed to the user in the UI

## Best Practices

1. **Adding New Insights**
   - Add a new entry to `insights.json`
   - Ensure the track item and question exist in the database
   - The question type should be numeric or boolean for proper visualization

2. **Debugging**
   - Check logs for detailed information about the insights process
   - Verify that track items are properly selected for the date in question
   - Ensure date formats are consistent

3. **Performance Considerations**
   - The system fetches all insights in a single batch to minimize database calls
   - Data is cached in the frontend to prevent unnecessary refetching