# Explain track service functions in detail
_Exported on 9/18/2025 at 19:04:14 GMT+5:30 from Cursor (1.2.4)_

---

**User**

explain me each function of track service in detail, input and output. with examples

---

**Cursor**

Here’s a clear, skimmable guide to every function in `services/core/TrackService.ts`: what it does, inputs, outputs, side effects, and quick examples.

### Date helpers (internal)

- parseMMDDYYYY(dateStr)
  - Input: string in MM-DD-YYYY (preferred) or YYYY-MM-DD
  - Output: Date
  - Notes: Converts UI date strings into a JS Date
  - Example: `parseMMDDYYYY('09-18-2025') → Date(2025-09-18)`

- formatMMDDYYYY(date)
  - Input: Date
  - Output: string in MM-DD-YYYY
  - Example: `formatMMDDYYYY(new Date(2025, 8, 18)) → '09-18-2025'`

- getMonday(date)
  - Input: Date
  - Output: Date set to Monday of that week
  - Example: `getMonday(new Date('2025-09-18')) → Mon Sep 15 2025`

- normalizeDateByFrequency(dateStr, frequency)
  - Input: date string (MM-DD-YYYY or YYYY-MM-DD), frequency: 'daily' | 'weekly' | 'monthly'
  - Output: string (MM-DD-YYYY) normalized to day/week-start/month-start
  - Examples:
    - Daily: `'09-18-2025' → '09-18-2025'`
    - Weekly: `'09-18-2025' → '09-15-2025'` (Monday)
    - Monthly: `'09-18-2025' → '09-01-2025'`

- shouldCreateEntryForDate(dateStr, frequency)
  - Input: date string, frequency
  - Output: boolean — whether a new entry should exist for the given date
  - Rules:
    - daily → always true
    - weekly → true only if date is Monday
    - monthly → true only if date is 1st of month
  - Example: `shouldCreateEntryForDate('09-18-2025','weekly') → false`

- ensureSubscribedEntries(patientId, date)
  - Input: patientId: number, date: string (MM-DD-YYYY)
  - Output: Promise<void>
  - Side effects: For each active “subscribed” item (has any active entry), ensures an entry exists for the appropriate normalized date (depending on frequency). Creates or reactivates entries.
  - Example behavior: On '09-16-2025', will create entries for all daily items for that day, weekly items for that week only if 09-16 is Monday (it’s not), and monthly items only on the 1st.

### Public API

- normalizeDateByFrequency(dateStr, frequency)
  - Already covered above (also exported).
  - Use when creating/linking entries to ensure consistent dates across daily/weekly/monthly items.

- getTrackCategoriesWithItemsAndProgress(patientId, date)
  - Input:
    - patientId: number
    - date: string (MM-DD-YYYY)
  - Output: Promise<TrackCategoryWithItems[]>
    - Each category includes `items` with:
      - `item` (id, name, code, frequency, etc.)
      - `entry_id` for the given date
      - `completed`/`total` question counts
      - `summaries`: string[] generated from responses
  - Side effects: Lazily ensures entries for “subscribed” items for the selected date (via ensureSubscribedEntries).
  - Example:
    - `await getTrackCategoriesWithItemsAndProgress(1, '09-18-2025') → [{ id: 2, name: 'Vitals', items: [{ item: {...}, entry_id: 15, completed: 2, total: 3, summaries: ['BP: 120/80', ...] }], ...}]`

- getAllCategoriesWithSelectableItems(patientId, date)
  - Input:
    - patientId: number
    - date: string (not used for selection, but included for symmetry)
  - Output: Promise<TrackCategoryWithSelectableItems[]>
    - Each category has `items` with `selected: boolean` meaning the patient has any active entry for that item (past or present), regardless of date.
  - Example:
    - `await getAllCategoriesWithSelectableItems(1, '09-18-2025') → [{ category: {...}, items: [{ item: {...}, selected: true }, ...]}]`

- getQuestionsWithOptions(itemId, entryId)
  - Input:
    - itemId: number
    - entryId: number (for the specific date’s entry)
  - Output: Promise<QuestionWithOptions[]>
    - Each element includes: `question`, `options` (if applicable), and `existingResponse` (if answered for this entry)
  - Example:
    - `await getQuestionsWithOptions(42, 15) → [{ question: { id: 7, text: 'How do you feel?' }, options: [...], existingResponse: { answer: '["Good"]' } }]`

- saveResponse(entryId, questionId, answer, userId, patientId)
  - Input:
    - entryId: number
    - questionId: number
    - answer: string (will be stored as JSON string; pass raw string, it’s stringified internally)
    - userId: string
    - patientId: number
  - Output: Promise<void>
  - Behavior: Upsert — updates existing response for the (entry, question, user, patient) or inserts a new one. Timestamps updated.
  - Examples:
    - Text/number: `await saveResponse(15, 7, '120/80', 'u1', 1)`
    - Boolean: `await saveResponse(15, 9, 'true', 'u1', 1)`
    - Multiple select: `await saveResponse(15, 10, '["Headache","Fatigue"]', 'u1', 1)`

- addOptionToQuestion(questionId, label)
  - Input:
    - questionId: number
    - label: string
  - Output: Promise<number> (new option id)
  - Example:
    - `const optionId = await addOptionToQuestion(7, 'Maybe')`

- addTrackItemOnDate(itemId, userId, patientId, date)
  - Input:
    - itemId: number
    - userId: string
    - patientId: number
    - date: string (MM-DD-YYYY)
  - Output: Promise<void>
  - Behavior:
    - Looks up item frequency
    - Normalizes date (daily/weekly/monthly)
    - Creates an active `TRACK_ITEM_ENTRY` (or reactivates if it exists/inactive) for that normalized date
  - Example:
    - Weekly item, chosen date '09-18-2025' → normalized to Monday '09-15-2025':
      - `await addTrackItemOnDate(42, 'u1', 1, '09-18-2025')` creates/reactivates entry dated '09-15-2025'

- removeTrackItemFromDate(itemId, userId, patientId, date)
  - Input:
    - itemId: number
    - userId: string
    - patientId: number
    - date: string (not used; included for parity)
  - Output: Promise<void>
  - Behavior: Soft-deactivates ALL entries of that item for that patient (past and future). Responses are kept; entries are marked inactive.
  - Example:
    - `await removeTrackItemFromDate(42, 'u1', 1, '09-18-2025')` → all entries for item 42 and patient 1 become inactive.

- generateSummary(template, answer)
  - Input:
    - template: string with `{{answer}}` placeholder
    - answer: string (JSON-encoded or plain)
  - Output: string | null
  - Behavior:
    - Parses `answer` if JSON. Arrays become comma-joined.
    - Replaces `{{answer}}` in `template`. Returns null on errors.
  - Examples:
    - `generateSummary('BP: {{answer}}', '120/80') → 'BP: 120/80'`
    - `generateSummary('Symptoms: {{answer}}', '["Headache","Fatigue"]') → 'Symptoms: Headache, Fatigue'`

- getSummariesForItem(entryId)
  - Input:
    - entryId: number
  - Output: Promise<string[]>
  - Behavior:
    - Fetches all questions for the item of this entry and their responses for this entry
    - For rows with both `summary_template` and `answer`, builds summaries using `generateSummary`
  - Example:
    - `await getSummariesForItem(15) → ['BP: 120/80', 'Symptoms: Headache, Fatigue']`

- addCustomGoal(params)
  - Input: CustomGoalParams:
    - name: string
    - patientId: number
    - date: string
    - questions: Array<{ text: string; type: 'text'|'number'|'boolean'|'mcq'|'msq'; required?: boolean; options?: string[] }>
  - Output: Promise<number> (new track item id)
  - Behavior:
    - Finds the `Custom` category
    - Creates a new track item with the given `name`
    - Inserts all questions
      - For `boolean` questions, auto-adds 'Yes'/'No' options
      - For `mcq`/`msq`, inserts provided `options` (non-empty)
    - Does not automatically create an entry; pair with `addTrackItemOnDate` if you need an entry for a date
  - Example:
    - ```
      const trackItemId = await addCustomGoal({
        name: 'Daily Hydration',
        patientId: 1,
        date: '09-18-2025',
        questions: [
          { text: 'How many glasses?', type: 'number', required: true },
          { text: 'Felt thirsty?', type: 'boolean' },
          { text: 'Beverages', type: 'msq', options: ['Water', 'Tea', 'Coffee'] },
        ],
      });
      await addTrackItemOnDate(trackItemId, 'u1', 1, '09-18-2025');
      ```

Notes and gotchas:
- Dates shown to users are MM-DD-YYYY; storage for entries is normalized per frequency to ensure all responses for a period roll up to the same entry.
- `removeTrackItemFromDate` deactivates all entries for an item/patient, not just one date.
- `saveResponse` stores answers as JSON strings; pass strings like '["A","B"]' for multi-select.

If you want, I can add quick unit-style examples or wire this into any screen you’re working on.

```plaintext

Notes and gotchas:
- Dates shown to users are MM-DD-YYYY; storage for entries is normalized per frequency to ensure all responses for a period roll up to the same entry.
- `removeTrackItemFromDate` deactivates all entries for an item/patient, not just one date.
- `saveResponse` stores answers as JSON strings; pass strings like '["A","B"]' for multi-select.

If you want, I can add quick unit-style examples or wire this into any screen you’re working on.
```

