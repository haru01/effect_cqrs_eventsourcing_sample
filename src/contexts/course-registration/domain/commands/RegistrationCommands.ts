import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId } from '@shared/index.js';

export const StartRegistrationPeriodSchema = Schema.Struct({
  type: Schema.Literal("StartRegistrationPeriod"),
  semesterId: SemesterId.Schema,
  startDate: Schema.Date,
  endDate: Schema.Date
});

export type StartRegistrationPeriod = Schema.Schema.Type<typeof StartRegistrationPeriodSchema>;

export const SelectCourseSchema = Schema.Struct({
  type: Schema.Literal("SelectCourse"),
  studentId: StudentId.Schema,
  semesterId: SemesterId.Schema,
  courseId: CourseId.Schema
});

export type SelectCourse = Schema.Schema.Type<typeof SelectCourseSchema>;

export const SubmitRegistrationSchema = Schema.Struct({
  type: Schema.Literal("SubmitRegistration"),
  studentId: StudentId.Schema,
  semesterId: SemesterId.Schema
});

export type SubmitRegistration = Schema.Schema.Type<typeof SubmitRegistrationSchema>;

export const ApproveRegistrationSchema = Schema.Struct({
  type: Schema.Literal("ApproveRegistration"),
  studentId: StudentId.Schema,
  semesterId: SemesterId.Schema
});

export type ApproveRegistration = Schema.Schema.Type<typeof ApproveRegistrationSchema>;

export const DropCourseSchema = Schema.Struct({
  type: Schema.Literal("DropCourse"),
  studentId: StudentId.Schema,
  semesterId: SemesterId.Schema,
  courseId: CourseId.Schema
});

export type DropCourse = Schema.Schema.Type<typeof DropCourseSchema>;

export type RegistrationCommand =
  | StartRegistrationPeriod
  | SelectCourse
  | SubmitRegistration
  | ApproveRegistration
  | DropCourse;

  // TODO RejectRegistration