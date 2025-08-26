import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId, CreditUnit } from '../../../../shared-kernel/index.js';

export const StartRegistrationPeriodSchema = Schema.Struct({
  type: Schema.Literal("StartRegistrationPeriod"),
  semesterId: SemesterId.Schema,
  startDate: Schema.Date,
  endDate: Schema.Date
});

export type StartRegistrationPeriod = Schema.Schema.Type<typeof StartRegistrationPeriodSchema>;


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

// Course Selection for multiple courses
export const CourseSelectionSchema = Schema.Struct({
  courseId: CourseId.Schema,
  credits: CreditUnit.Schema
});

export type CourseSelection = Schema.Schema.Type<typeof CourseSelectionSchema>;

export const SelectCoursesSchema = Schema.Struct({
  type: Schema.Literal("SelectCourses"),
  studentId: StudentId.Schema,
  semesterId: SemesterId.Schema,
  courseSelections: Schema.Array(CourseSelectionSchema)
});

export type SelectCourses = Schema.Schema.Type<typeof SelectCoursesSchema>;

export type RegistrationCommand =
  | StartRegistrationPeriod
  | SelectCourses
  | SubmitRegistration
  | ApproveRegistration
  | DropCourse;

  // TODO RejectRegistration