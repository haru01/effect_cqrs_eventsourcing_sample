import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId, InstructorId } from '@shared/index.js';
import { ClassSessionId, AssignmentId } from '../identifiers/index.js';
import { AttendanceStatus, SessionStatus } from '../value-objects/index.js';

/**
 * 出席記録スキーマ
 * 学生の授業出席状況を記録する
 */
export const AttendanceRecordSchema = Schema.Struct({
  studentId: StudentId.Schema.annotations({ title: "学生ID" }),
  status: AttendanceStatus.Schema.annotations({ title: "出席ステータス" }),
  recordedAt: Schema.Date.annotations({ title: "記録日時" })
});

export type AttendanceRecord = Schema.Schema.Type<typeof AttendanceRecordSchema>;

/**
 * 授業セッションスキーマ
 * 個別の授業回の情報と出席・課題状況を管理する集約ルート
 */
export const ClassSessionSchema = Schema.Struct({
  classSessionId: ClassSessionId.Schema.annotations({ title: "授業セッションID" }),
  courseId: CourseId.Schema.annotations({ title: "科目ID" }),
  semesterId: SemesterId.Schema.annotations({ title: "学期ID" }),
  instructorId: InstructorId.Schema.annotations({ title: "教員ID" }),
  sessionDate: Schema.Date.annotations({ title: "授業日" }),
  enrolledStudents: Schema.Array(StudentId.Schema).annotations({ title: "履修学生リスト" }),
  attendanceRecords: Schema.Array(AttendanceRecordSchema).annotations({ title: "出席記録" }),
  assignments: Schema.Array(AssignmentId.Schema).annotations({ title: "課題リスト" }),
  sessionStatus: SessionStatus.Schema.annotations({ title: "授業ステータス" })
});

export type ClassSession = Schema.Schema.Type<typeof ClassSessionSchema>;

export const AttendanceRecordModule = {
  Schema: AttendanceRecordSchema
} as const;

export const ClassSessionModule = {
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
    const existingRecordIndex = session.attendanceRecords.findIndex((r: AttendanceRecord) => r.studentId === studentId);
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

export { ClassSessionModule as ClassSession, AttendanceRecordModule as AttendanceRecord };