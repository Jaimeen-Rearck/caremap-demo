import { DB_VERSION } from './db';

import * as SchemaV1 from './migrations/v1/schema_v1';
import * as SchemaV2 from './migrations/v2/schema_v2';

const schemas: Record<number, any> = {
  1: SchemaV1,
  2: SchemaV2,
};

const schema = schemas[DB_VERSION];

if (!schema) {
  throw new Error(`Missing exports for DB version ${DB_VERSION}`);
}

export const {
  User,
  Patient,
  PatientSnapshot,
  MedicalCondition,
  MedicalEquipment,
  HighLevelGoal,
  GoalProgress
} = schema;

export type User = typeof schema.User;
export type Patient = typeof schema.Patient;

export const Schema = schema;

export const CURRENT_VERSION = DB_VERSION;
