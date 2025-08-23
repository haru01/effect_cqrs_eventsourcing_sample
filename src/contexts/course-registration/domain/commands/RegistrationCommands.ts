import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId } from '@shared/index.js';

export const StartRegistrationPeriod = Schema.Struct({
  type: Schema.Literal("StartRegistrationPeriod"),
  semesterId: SemesterId.SemesterId,
  startDate: Schema.Date,
  endDate: Schema.Date
});

export type StartRegistrationPeriod = Schema.Schema.Type<typeof StartRegistrationPeriod>;

export const SelectCourse = Schema.Struct({
  type: Schema.Literal("SelectCourse"),
  studentId: StudentId.StudentId,
  semesterId: SemesterId.SemesterId,
  courseId: CourseId.CourseId
});

export type SelectCourse = Schema.Schema.Type<typeof SelectCourse>;

export const SubmitRegistration = Schema.Struct({
  type: Schema.Literal("SubmitRegistration"),
  studentId: StudentId.StudentId,
  semesterId: SemesterId.SemesterId
});

export type SubmitRegistration = Schema.Schema.Type<typeof SubmitRegistration>;

export const ApproveRegistration = Schema.Struct({
  type: Schema.Literal("ApproveRegistration"),
  studentId: StudentId.StudentId,
  semesterId: SemesterId.SemesterId
});

export type ApproveRegistration = Schema.Schema.Type<typeof ApproveRegistration>;

export const DropCourse = Schema.Struct({
  type: Schema.Literal("DropCourse"),
  studentId: StudentId.StudentId,
  semesterId: SemesterId.SemesterId,
  courseId: CourseId.CourseId
});

export type DropCourse = Schema.Schema.Type<typeof DropCourse>;

export type RegistrationCommand =
  | StartRegistrationPeriod
  | SelectCourse
  | SubmitRegistration
  | ApproveRegistration
  | DropCourse;