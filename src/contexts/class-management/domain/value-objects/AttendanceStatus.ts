import * as Schema from '@effect/schema/Schema';

export enum AttendanceStatusValue {
  Present = "present",
  Absent = "absent",
  Late = "late",
  Excused = "excused"
}

const AttendanceStatusSchema = Schema.Enums(AttendanceStatusValue);

export type AttendanceStatus = Schema.Schema.Type<typeof AttendanceStatusSchema>;

export const AttendanceStatus = {
  Schema: AttendanceStatusSchema,
  Value: AttendanceStatusValue,
  make: (value: AttendanceStatusValue): AttendanceStatus => 
    Schema.decodeSync(AttendanceStatusSchema)(value),
  isPresent: (status: AttendanceStatus): boolean => 
    status === AttendanceStatusValue.Present,
  isAbsent: (status: AttendanceStatus): boolean => 
    status === AttendanceStatusValue.Absent,
  Present: AttendanceStatusValue.Present,
  Absent: AttendanceStatusValue.Absent,
  Late: AttendanceStatusValue.Late,
  Excused: AttendanceStatusValue.Excused
} as const;