# Track Module Flow Documentation

## Overview

The Track Module allows patients to track various health metrics and activities on a daily, weekly, or monthly basis. This document provides a simplified explanation of the Track Module flow, including examples and implementation guidelines.

## Core Components

1. **Track Categories**: Groups of related tracking items (e.g., Fitness Tracking)
2. **Track Items**: Specific metrics to track (e.g., Exercise Routine)
3. **Questions**: Data points collected for each track item
4. **Responses**: User answers to questions

## Data Flow

```
Track Category → Track Items → Questions → Responses
```

## Backend Structure

### 1. Configuration

Track module configuration is stored in `track-config.json` which defines:
- Predefined track categories
- Predefined track items with questions
- Response options for questions

### 2. Version Management

The `track-version-manager.ts` handles:
- Tracking configuration versions
- Determining when to sync new configurations
- Updating stored versions

### 3. Core Service

The `TrackService.ts` provides:
- Data retrieval for track categories, items, and questions
- Response handling
- Date normalization based on frequency

## TrackService Methods

### Date Helper Methods

#### `normalizeDateByFrequency(dateStr: string, frequency: 'daily' | 'weekly' | 'monthly'): string`
Normalizes a date string based on the frequency.
- **Parameters**:
  - `dateStr`: Date string in MM-DD-YYYY format
  - `frequency`: 'daily', 'weekly', or 'monthly'
- **Returns**: Normalized date string in MM-DD-YYYY format
- **Example**:
  ```typescript
  // For a daily item, June 15, 2023 remains June 15, 2023
  normalizeDateByFrequency("06-15-2023", "daily") // Returns "06-15-2023"
  
  // For a weekly item, June 15, 2023 (Thursday) becomes June 12, 2023 (Monday)
  normalizeDateByFrequency("06-15-2023", "weekly") // Returns "06-12-2023"
  
  // For a monthly item, June 15, 2023 becomes June 1, 2023
  normalizeDateByFrequency("06-15-2023", "monthly") // Returns "06-01-2023"
  ```

### Core Methods

#### `getTrackCategoriesWithItemsAndProgress(patientId: number, date: string): Promise<TrackCategoryWithItems[]>`
Retrieves all active track categories with their items and progress for a specific patient and date.
- **Parameters**:
  - `patientId`: ID of the patient
  - `date`: Date string in MM-DD-YYYY format
- **Returns**: Array of track categories with items and progress information
- **Description**: This method ensures entries exist for subscribed items, fetches all active categories and items, and calculates completion progress.

#### `getAllCategoriesWithSelectableItems(patientId: number, date: string): Promise<TrackCategoryWithSelectableItems[]>`
Retrieves all active categories with their items and a flag indicating if the patient has selected each item.
- **Parameters**:
  - `patientId`: ID of the patient
  - `date`: Date string in MM-DD-YYYY format
- **Returns**: Array of categories with selectable items
- **Description**: Used for item selection screens where patients can subscribe to tracking items.

#### `getQuestionsWithOptions(itemId: number, entryId: number): Promise<QuestionWithOptions[]>`
Retrieves all questions with their options for a specific track item and entry.
- **Parameters**:
  - `itemId`: ID of the track item
  - `entryId`: ID of the track item entry
- **Returns**: Array of questions with their options and existing responses
- **Description**: Used to display questions for a track item with any previously saved responses.

#### `saveResponse(entryId: number, questionId: number, answer: string, userId: string, patientId: number): Promise<void>`
Saves a response to a question for a specific track item entry.
- **Parameters**:
  - `entryId`: ID of the track item entry
  - `questionId`: ID of the question
  - `answer`: Answer string (JSON stringified)
  - `userId`: ID of the user
  - `patientId`: ID of the patient
- **Returns**: Promise that resolves when the response is saved
- **Description**: Creates or updates a response to a question.

#### `addOptionToQuestion(questionId: number, label: string): Promise<number>`
Adds a new option to a question.
- **Parameters**:
  - `questionId`: ID of the question
  - `label`: Text label for the new option
- **Returns**: ID of the newly created option
- **Description**: Used for adding custom options to questions.

#### `addTrackItemOnDate(itemId: number, userId: string, patientId: number, date: string): Promise<void>`
Links a track item to a patient on a specific date.
- **Parameters**:
  - `itemId`: ID of the track item
  - `userId`: ID of the user
  - `patientId`: ID of the patient
  - `date`: Date string in MM-DD-YYYY format
- **Returns**: Promise that resolves when the item is linked
- **Description**: Creates an entry for a track item on a specific date or reactivates an existing inactive entry.

#### `removeTrackItemFromDate(itemId: number, userId: string, patientId: number, date: string): Promise<void>`
Unlinks a track item from a patient.
- **Parameters**:
  - `itemId`: ID of the track item
  - `userId`: ID of the user
  - `patientId`: ID of the patient
  - `date`: Date string in MM-DD-YYYY format
- **Returns**: Promise that resolves when the item is unlinked
- **Description**: Deactivates all entries for this item/patient (both past and future) while preserving responses.

#### `generateSummary(template: string, answer: string): string | null`
Generates a summary string from a template and an answer.
- **Parameters**:
  - `template`: Summary template string with {{answer}} placeholder
  - `answer`: Answer string (JSON stringified)
- **Returns**: Generated summary string or null if generation fails
- **Description**: Used to create human-readable summaries from responses.

#### `getSummariesForItem(entryId: number): Promise<string[]>`
Retrieves all summaries for a specific track item entry.
- **Parameters**:
  - `entryId`: ID of the track item entry
- **Returns**: Array of summary strings
- **Description**: Fetches all questions for an item, their responses, and generates summaries.

#### `addCustomGoal(params: CustomGoalParams): Promise<number>`
Adds a custom goal track item with questions.
- **Parameters**:
  - `params`: Object containing:
    - `name`: Name of the custom goal
    - `patientId`: ID of the patient
    - `date`: Date string in MM-DD-YYYY format
    - `questions`: Array of question objects
- **Returns**: ID of the newly created track item
- **Description**: Creates a new track item in the Custom category with specified questions and options.

## API Examples

### 1. Get Track Categories with Items

**Request:**
```typescript
const result = await getTrackCategoriesWithItemsAndProgress(patientId, date);
```

**Response:**
```json
[
  {
    "id": 1,
    "code": "c_fits_track",
    "name": "Fitness Tracking",
    "status": "active",
    "items": [
      {
        "item": {
          "id": 101,
          "category_id": 1,
          "code": "i_exer_rout",
          "name": "Exercise Routine",
          "frequency": "daily",
          "status": "active",
          "created_date": "2023-06-15T10:30:00Z",
          "updated_date": "2023-06-15T10:30:00Z"
        },
        "entry_id": 1001,
        "completed": 2,
        "total": 3,
        "summaries": ["Exercise done: Yes", "Exercise type - Cardio, Strength"]
      }
    ]
  }
]
```

### 2. Get Questions for Item

**Request:**
```typescript
const questions = await getQuestionsWithOptions(itemId, entryId);
```

**Response:**
```json
[
  {
    "id": 201,
    "code": "q_exer_today",
    "text": "Did you exercise today?",
    "type": "boolean",
    "required": true,
    "units": "(in minutes)",
    "summary_template": "Exercise done: {{answer}}.",
    "parent_question_code": null,
    "display_condition": null,
    "options": [
      {
        "id": 301,
        "code": "o_exer_today_yes",
        "text": "Yes"
      },
      {
        "id": 302,
        "code": "o_exer_today_no",
        "text": "No"
      }
    ]
  },
  {
    "id": 202,
    "code": "q_exer_type",
    "text": "What type of exercises did you do?",
    "type": "msq",
    "required": false,
    "summary_template": "Exercise type - {{answer}}",
    "parent_question_code": "q_exer_today",
    "display_condition": "{\"equals\": \"o_exer_today_yes\"}",
    "options": [
      {
        "id": 303,
        "code": "o_cardio",
        "text": "Cardio"
      },
      {
        "id": 304,
        "code": "o_strength",
        "text": "Strength"
      },
      {
        "id": 305,
        "code": "o_yoga",
        "text": "Yoga"
      },
      {
        "id": 306,
        "code": "o_stretch",
        "text": "Stretching"
      }
    ]
  }
]
```

### 3. Save Responses

**Request:**
```typescript
await saveResponses(entryId, [
  {
    question_id: 201,
    response_option_id: 301, // Yes
    text_response: null
  },
  {
    question_id: 202,
    response_option_id: [303, 304], // Cardio, Strength
    text_response: null
  }
]);
```

**Response:**
```json
{
  "success": true,
  "updated_entry_id": 1001
}
```

## Date Handling

The Track Module handles dates differently based on frequency:

1. **Daily**: Uses the exact date (MM-DD-YYYY)
2. **Weekly**: Normalizes to the Monday of the week
3. **Monthly**: Normalizes to the first day of the month

Example:
```typescript
// For a daily item, June 15, 2023 remains June 15, 2023
normalizeDateByFrequency("06-15-2023", "daily") // Returns "06-15-2023"

// For a weekly item, June 15, 2023 (Thursday) becomes June 12, 2023 (Monday)
normalizeDateByFrequency("06-15-2023", "weekly") // Returns "06-12-2023"

// For a monthly item, June 15, 2023 becomes June 1, 2023
normalizeDateByFrequency("06-15-2023", "monthly") // Returns "06-01-2023"
```

## Question Types and Conditional Display

The Track Module supports different question types:
- **boolean**: Yes/No questions
- **msq**: Multiple-select questions
- **text**: Free text input

Questions can be conditionally displayed based on previous answers using the `display_condition` property and `parent_question_code`.

Example:
```json
{
  "code": "q_exer_type",
  "parent_question_code": "q_exer_today",
  "display_condition": "{\"equals\": \"o_exer_today_yes\"}"
}
```
This question will only display if the answer to "q_exer_today" equals "o_exer_today_yes".

## Implementation Guidelines for Frontend Team

### 1. Date Handling

- Always use the `normalizeDateByFrequency` function when displaying or storing dates
- Display the appropriate frequency label (Daily, Weekly, Monthly) for each track item
- When showing calendar views, highlight dates that have entries

### 2. Conditional Questions

- Implement dynamic form rendering based on `display_condition` and `parent_question_code`
- Hide/show questions based on parent question responses
- Validate that required questions are answered before submission
