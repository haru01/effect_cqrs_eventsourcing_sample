import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId, InstructorId } from '@shared/index.js';
import { ClassSessionId, AssignmentId } from '../identifiers/index.js';
import { AttendanceStatus, SessionStatus } from '../value-objects/index.js';

export const AttendanceRecordSchema = Schema.Struct({
  studentId: StudentId.Schema,
  status: AttendanceStatus.Schema,
  recordedAt: Schema.Date
});

export type AttendanceRecord = Schema.Schema.Type<typeof AttendanceRecordSchema>;

export const ClassSessionSchema = Schema.Struct({
  classSessionId: ClassSessionId.Schema,
  courseId: CourseId.Schema,
  semesterId: SemesterId.Schema,
  instructorId: InstructorId.Schema,
  sessionDate: Schema.Date,
  enrolledStudents: Schema.Array(StudentId.Schema),
  attendanceRecords: Schema.Array(AttendanceRecordSchema),
  assignments: Schema.Array(AssignmentId.Schema),
  sessionStatus: SessionStatus.Schema
});

export type ClassSession = Schema.Schema.Type<typeof ClassSessionSchema>;

export const AttendanceRecord = {
  Schema: AttendanceRecordSchema
} as const;

export const ClassSession = {
  Schema: ClassSessionSchema,
  make: (
    classSessionId: ClassSessionId,
    courseId: CourseId,
    semesterId: SemesterId,
    instructorId: InstructorId,
    sessionDate: Date,
    enrolledStudents: StudentId[]
  ): ClassSession => ({
    classSessionId,
    courseId,
    semesterId,
    instructorId,
    sessionDate,
    enrolledStudents,
    attendanceRecords: [],
    assignments: [],
    sessionStatus: SessionStatus.Value.Scheduled
  }),
  recordAttendance: (
    session: ClassSession,
    studentId: StudentId,
    status: AttendanceStatus
  ): ClassSession => {
    const existingRecordIndex = session.attendanceRecords.findIndex(r => r.studentId === studentId);
    const newRecord: AttendanceRecord = {
      studentId,
      status,
      recordedAt: new Date()
    };

    if (existingRecordIndex >= 0) {
      const updatedRecords = [...session.attendanceRecords];
      updatedRecords[existingRecordIndex] = newRecord;
      return { ...session, attendanceRecords: updatedRecords };
    }

    return {
      ...session,
      attendanceRecords: [...session.attendanceRecords, newRecord]
    };
  }
} as const;