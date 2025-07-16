import {
  PatientCondition,
  PatientEquipment,
  PatientGoal,
  PatientSnapshot,
  PatientEmergencyCare,
  PatientAllergy,
  PatientMedication,
  PatientNote
} from "@/services/database/migrations/v1/schema_v1";

// Sample dates for consistent timestamps
const now = new Date();
const yesterday = new Date(now);
yesterday.setDate(yesterday.getDate() - 1);
const lastWeek = new Date(now);
lastWeek.setDate(lastWeek.getDate() - 7);
const nextMonth = new Date(now);
nextMonth.setMonth(nextMonth.getMonth() + 1);

export const samplePatientSnapshots: Partial<PatientSnapshot>[] = [
  {
    patient_id: 1,
    patient_overview: "Patient is doing well with current treatment plan",
    health_issues: "Mild asthma, seasonal allergies",
    created_date: new Date(lastWeek),
    updated_date: new Date(now),
  }
];

export const samplePatientConditions: Partial<PatientCondition>[] = [
  {
    patient_id: 1,
    condition_name: "Asthma",
    created_date: new Date(lastWeek),
    updated_date: new Date(lastWeek),
    linked_health_system: true
  },
  {
    patient_id: 1,
    condition_name: "Seasonal Allergies",
    created_date: new Date(yesterday),
    updated_date: new Date(yesterday),
    linked_health_system: false
  },
  {
    patient_id: 1,
    condition_name: "High Blood Pressure",
    created_date: new Date(now),
    updated_date: new Date(now),
    linked_health_system: true
  }
];

export const samplePatientEquipment: Partial<PatientEquipment>[] = [
  {
    patient_id: 1,
    equipment_name: "Inhaler",
    equipment_description: "Albuterol inhaler for asthma",
    created_date: new Date(lastWeek),
    updated_date: new Date(now),
    linked_health_system: true
  },
  {
    patient_id: 1,
    equipment_name: "Peak Flow Meter",
    equipment_description: "For monitoring asthma symptoms",
    created_date: new Date(lastWeek),
    updated_date: new Date(now),
    linked_health_system: true
  },
  {
    patient_id: 1,
    equipment_name: "Blood Pressure Monitor",
    equipment_description: "Home blood pressure monitoring device",
    created_date: new Date(yesterday),
    updated_date: new Date(now),
    linked_health_system: false
  },
  {
    patient_id: 1,
    equipment_name: "Nebulizer",
    equipment_description: "For severe asthma symptoms",
    created_date: new Date(now),
    updated_date: new Date(now),
    linked_health_system: true
  }
];

export const samplePatientGoals: Partial<PatientGoal>[] = [
  {
    patient_id: 1,
    goal_description: "Improve asthma control",
    target_date: new Date(nextMonth),
    status: "Active",
    linked_health_system: true,
    created_date: new Date(lastWeek),
    updated_date: new Date(now)
  },
  {
    patient_id: 1,
    goal_description: "Regular blood pressure monitoring",
    target_date: new Date(nextMonth),
    status: "Active",
    linked_health_system: true,
    created_date: new Date(lastWeek),
    updated_date: new Date(now)
  },
  {
    patient_id: 1,
    goal_description: "Maintain healthy diet",
    target_date: new Date(nextMonth),
    status: "On Hold",
    linked_health_system: false,
    created_date: new Date(yesterday),
    updated_date: new Date(now)
  }
];

export const samplePatientEmergencyCare: Partial<PatientEmergencyCare>[] = [
  {
    patient_id: 1,
    topic: "Emergency Contact Information",
    details: "Primary: John Doe (Spouse) - +1234567890\nSecondary: Jane Smith (Sister) - +0987654321",
    linked_health_system: true,
    created_date: new Date(lastWeek),
    updated_date: new Date(now)
  },
  {
    patient_id: 1,
    topic: "Preferred Hospital",
    details: "City General Hospital - 123 Medical Center Drive",
    linked_health_system: true,
    created_date: new Date(lastWeek),
    updated_date: new Date(now)
  },
  {
    patient_id: 1,
    topic: "Emergency Protocol",
    details: "1. Use inhaler immediately for severe asthma\n2. Call emergency contact\n3. Go to nearest ER if symptoms persist",
    linked_health_system: false,
    created_date: new Date(yesterday),
    updated_date: new Date(now)
  }
];

export const samplePatientAllergies: Partial<PatientAllergy>[] = [
  {
    patient_id: 1,
    topic: "Penicillin",
    details: "Severe allergic reaction - hives and difficulty breathing",
    severity: "Severe",
    onset_date: new Date(lastWeek),
    linked_health_system: true,
    created_date: new Date(lastWeek),
    updated_date: new Date(now)
  },
  {
    patient_id: 1,
    topic: "Pollen",
    details: "Seasonal allergies - sneezing and congestion",
    severity: "Moderate",
    onset_date: new Date(lastWeek),
    linked_health_system: false,
    created_date: new Date(lastWeek),
    updated_date: new Date(now)
  },
  {
    patient_id: 1,
    topic: "Shellfish",
    details: "Mild rash and itching",
    severity: "Mild",
    onset_date: new Date(yesterday),
    linked_health_system: true,
    created_date: new Date(yesterday),
    updated_date: new Date(now)
  }
];

export const samplePatientMedications: Partial<PatientMedication>[] = [
  {
    patient_id: 1,
    name: "Albuterol Inhaler",
    details: "2 puffs as needed for asthma symptoms\nPrescribed by Dr. Smith",
    linked_health_system: true,
    created_date: new Date(lastWeek),
    updated_date: new Date(now)
  },
  {
    patient_id: 1,
    name: "Lisinopril",
    details: "10mg daily for blood pressure\nTake in the morning",
    linked_health_system: true,
    created_date: new Date(lastWeek),
    updated_date: new Date(now)
  },
  {
    patient_id: 1,
    name: "Cetirizine",
    details: "10mg daily for allergies\nTake as needed during allergy season",
    linked_health_system: false,
    created_date: new Date(yesterday),
    updated_date: new Date(now)
  }
];

export const samplePatientNotes: Partial<PatientNote>[] = [
  {
    id: 1,
    patient_id: 1,
    topic: "Follow-up Appointment",
    details: "Schedule follow-up with Dr. Smith for blood pressure check",
    reminder_date: new Date("2024-03-15 10:00:00"),
    created_date: new Date("2024-02-15 09:30:00"),
    updated_date: new Date("2024-02-15 09:30:00")
  },
  {
    id: 2,
    patient_id: 1,
    topic: "Medication Refill",
    details: "Need to refill blood pressure medication next week",
    reminder_date: new Date("2024-03-10 14:00:00"),
    created_date: new Date("2024-02-14 15:45:00"),
    updated_date: new Date("2024-02-14 15:45:00")
  },
  {
    id: 3,
    patient_id: 2,
    topic: "Lab Results Review",
    details: "Review latest blood work results with healthcare provider",
    reminder_date: new Date("2024-03-20 11:30:00"),
    created_date: new Date("2024-02-16 13:20:00"),
    updated_date: new Date("2024-02-16 13:20:00")
  }
];
