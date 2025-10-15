# PDF Export Service Documentation

## Overview

The PDFExportService is a utility class that enables exporting patient data to PDF format in the CareMap application. This service provides functionality to generate well-formatted PDF documents containing patient information that can be shared or saved by users.

## Libraries and Dependencies

The service relies on the following libraries:

| Library | Purpose |
|---------|---------|
| `expo-print` | Generates PDF documents from HTML content |
| `expo-sharing` | Enables sharing PDF files with other applications |
| `expo-file-system` | Provides file system access for file operations |
| `PatientService` | Retrieves patient data from the application database |

## Class Structure

`PDFExportService` is implemented as a static class with the following methods:

### Methods

#### `exportPatientDataToPDF(patientId: number): Promise<boolean>`

The main public method that orchestrates the PDF export process.

**Parameters:**
- `patientId` (number): The unique identifier of the patient whose data will be exported

**Returns:**
- `Promise<boolean>`: Resolves to `true` if the export was successful, `false` otherwise

**Process:**
1. Retrieves patient data using the `getPatient` function
2. Generates HTML content using the `generatePatientHTML` method
3. Creates a PDF file using `Print.printToFileAsync`
4. Renames the file to "Patient_Report.pdf" using `FileSystem.moveAsync`
5. Shares the PDF using `Sharing.shareAsync` if sharing is available

#### `private generatePatientHTML(patient: Patient): string`

A private method that generates the HTML content for the PDF.

**Parameters:**
- `patient` (Patient): The patient data object containing all patient information

**Returns:**
- `string`: HTML content as a string

**Content Generated:**
- Header with CareMap logo and generation date
- Patient personal information (name, DOB, gender, relationship)
- Medical information (blood type, height, weight)
- Footer with confidentiality notice

## PDF Structure

The generated PDF includes the following sections:

1. **Header**
   - CareMap Patient Data title
   - Generation date

2. **Patient Information**
   - Full name
   - Date of birth
   - Gender
   - Relationship

3. **Medical Information**
   - Blood type
   - Height
   - Weight

4. **Footer**
   - Confidentiality notice

## Styling

The PDF uses custom CSS styling to ensure a professional and readable document:
- Clean, sans-serif font (Arial)
- Consistent margins and padding
- Color-coded section headers
- Organized information with clear labels
- Responsive layout

## File Naming

The service ensures that exported PDFs are consistently named "Patient_Report.pdf" by:
1. Generating the PDF with `printToFileAsync`
2. Extracting the directory path from the generated URI
3. Creating a new file path with the desired name
4. Using `FileSystem.moveAsync` to rename the file

## Usage Example

```typescript
// Import the service
import { PDFExportService } from '../services/PDFExportService';

// Export patient data for a specific patient
async function handleExportPatientData(patientId: number) {
  try {
    const success = await PDFExportService.exportPatientDataToPDF(patientId);
    if (success) {
      console.log('PDF exported successfully');
    } else {
      console.error('Failed to export PDF');
    }
  } catch (error) {
    console.error('Error exporting PDF:', error);
  }
}
```

## Best Practices

1. **Error Handling**: Always wrap PDF export calls in try-catch blocks to handle potential errors
2. **User Feedback**: Provide feedback to users during the export process (e.g., loading indicators)
3. **File Size**: Be mindful of the PDF size, especially when including images or large datasets
4. **Testing**: Test PDF generation on different devices to ensure consistent formatting

## Limitations

- PDF sharing depends on the device's available sharing options
- PDF appearance may vary slightly between different PDF viewers
- Large datasets may impact performance when generating PDFs

## Future Enhancements

Potential improvements for the PDF Export Service:
- Support for custom templates
- Option to include/exclude specific sections
- Support for embedding images (e.g., patient photos)
- Password protection for sensitive documents