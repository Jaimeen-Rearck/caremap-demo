import { Patient } from './database/migrations/v1/schema_v1';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { getPatient } from './core/PatientService';

export class PDFExportService {
  /**
   * Generate HTML content for patient data
   * @param patient Patient data to include in the PDF
   * @returns HTML string for the PDF
   */
  private static generatePatientHTML(patient: Patient): string {
    const currentDate = new Date().toLocaleDateString();
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Patient Data Export</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 10px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #0066cc;
            }
            .date {
              margin-top: 10px;
              font-style: italic;
              color: #666;
            }
            .section {
              margin-bottom: 20px;
            }
            h2 {
              color: #0066cc;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            .info-row {
              display: flex;
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: bold;
              width: 200px;
            }
            .info-value {
              flex: 1;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">CareMap Patient Data</div>
            <div class="date">Generated on: ${currentDate}</div>
          </div>
          
          <div class="section">
            <h2>Patient Information</h2>
            <div class="info-row">
              <div class="info-label">Name:</div>
              <div class="info-value">${patient.first_name} ${patient.middle_name || ''} ${patient.last_name}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Date of Birth:</div>
              <div class="info-value">${patient.date_of_birth || 'Not provided'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Gender:</div>
              <div class="info-value">${patient.gender || 'Not provided'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Relationship:</div>
              <div class="info-value">${patient.relationship || 'Not provided'}</div>
            </div>
          </div>
          
          <div class="section">
            <h2>Medical Information</h2>
            <div class="info-row">
              <div class="info-label">Blood Type:</div>
              <div class="info-value">${patient.blood_type || 'Not provided'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Height:</div>
              <div class="info-value">${patient.height || 'Not provided'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Weight:</div>
              <div class="info-value">${patient.weight || 'Not provided'}</div>
            </div>
          </div>
          
          <div class="footer">
            This document contains confidential patient information.
            Please handle according to privacy regulations.
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Export patient data to PDF
   * @param patientId ID of the patient to export
   * @returns Promise resolving to success status
   */
  public static async exportPatientDataToPDF(patientId: number): Promise<boolean> {
    try {
      // Get patient data
      const patient = await getPatient(patientId);
      
      if (!patient) {
        console.error('Patient not found');
        return false;
      }
      
      // Generate HTML
      const html = this.generatePatientHTML(patient);
      
      // Create PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });
      
      // Create a new file path with the desired name
      const newFilePath = `${uri.slice(0, uri.lastIndexOf('/') + 1)}Patient_Report.pdf`;
      
      // Rename the file
      await FileSystem.moveAsync({
        from: uri,
        to: newFilePath
      });
      
      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        // Share the PDF with the new file path
        await Sharing.shareAsync(newFilePath, {
          mimeType: 'application/pdf',
          dialogTitle: `${patient.first_name} ${patient.last_name} - Patient Data`,
          UTI: 'com.adobe.pdf'
        });
        return true;
      } else {
        console.error('Sharing is not available on this device');
        return false;
      }
    } catch (error) {
      console.error('Error exporting patient data to PDF:', error);
      return false;
    }
  }
}