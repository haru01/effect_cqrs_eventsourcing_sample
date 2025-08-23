import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId, InstructorId } from '@shared/index.js';
import { ClassSessionId, AssignmentId } from '../identifiers/index.js';
import { AttendanceStatus, SessionStatus } from '../value-objects/index.js';

export const AttendanceRecord = Schema.Struct({
  studentId: StudentId.StudentId,
  status: AttendanceStatus.AttendanceStatus,
  recordedAt: Schema.Date
});

export type AttendanceRecord = Schema.Schema.Type<typeof AttendanceRecord>;

export const ClassSession = Schema.Struct({
  classSessionId: ClassSessionId.ClassSessionId,
  courseId: CourseId.CourseId,
  semesterId: SemesterId.SemesterId,
  instructorId: InstructorId.InstructorId,
  sessionDate: Schema.Date,
  enrolledStudents: Schema.Array(StudentId.StudentId),
  attendanceRecords: Schema.Array(AttendanceRecord),
  assignments: Schema.Array(AssignmentId.AssignmentId),
  sessionStatus: SessionStatus.SessionStatus
});

export type ClassSession = Schema.Schema.Type<typeof ClassSession>;

export const make = (
  classSessionId: ClassSessionId.ClassSessionId,
  courseId: CourseId.CourseId,
  semesterId: SemesterId.SemesterId,
  instructorId: InstructorId.InstructorId,
  sessionDate: Date,
  enrolledStudents: StudentId.StudentId[]
): ClassSession => ({
  classSessionId,
  courseId,
  semesterId,
  instructorId,
  sessionDate,
  enrolledStudents,
  attendanceRecords: [],
  assignments: [],
  sessionStatus: SessionStatus.SessionStatusValue.Scheduled
});

export const recordAttendance = (
  session: ClassSession,
  studentId: StudentId.StudentId,
  status: AttendanceStatus.AttendanceStatus
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
};