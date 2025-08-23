import * as Schema from '@effect/schema/Schema';

export enum AttendanceStatusValue {
  Present = "present",
  Absent = "absent",
  Late = "late",
  Excused = "excused"
}

export const AttendanceStatus = Schema.Enums(AttendanceStatusValue);

export type AttendanceStatus = Schema.Schema.Type<typeof AttendanceStatus>;

export const make = (value: AttendanceStatusValue): AttendanceStatus => 
  Schema.decodeSync(AttendanceStatus)(value);

export const isPresent = (status: AttendanceStatus): boolean => 
  status === AttendanceStatusValue.Present;

export const isAbsent = (status: AttendanceStatus): boolean => 
  status === AttendanceStatusValue.Absent;