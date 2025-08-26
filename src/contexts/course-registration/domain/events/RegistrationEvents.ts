import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId, CreditUnit } from '../../../../shared-kernel/index.js';

export const RegistrationPeriodStartedSchema = Schema.Struct({
  type: Schema.Literal("RegistrationPeriodStarted"),
  semesterId: SemesterId.Schema,
  startDate: Schema.Date,
  endDate: Schema.Date,
  timestamp: Schema.Date
});

export type RegistrationPeriodStarted = Schema.Schema.Type<typeof RegistrationPeriodStartedSchema>;


export const RegistrationSubmittedSchema = Schema.Struct({
  type: Schema.Literal("RegistrationSubmitted"),
  studentId: StudentId.Schema,
  semesterId: SemesterId.Schema,
  submittedCourses: Schema.Array(CourseId.Schema),
  timestamp: Schema.Date
});

export type RegistrationSubmitted = Schema.Schema.Type<typeof RegistrationSubmittedSchema>;

export const RegistrationConfirmedSchema = Schema.Struct({
  type: Schema.Literal("RegistrationConfirmed"),
  studentId: StudentId.Schema,
  semesterId: SemesterId.Schema,
  confirmedCourses: Schema.Array(CourseId.Schema),
  timestamp: Schema.Date
});

export type RegistrationConfirmed = Schema.Schema.Type<typeof RegistrationConfirmedSchema>;

export const CourseDroppedSchema = Schema.Struct({
  type: Schema.Literal("CourseDropped"),
  studentId: StudentId.Schema,
  semesterId: SemesterId.Schema,
  courseId: CourseId.Schema,
  timestamp: Schema.Date
});

export type CourseDropped = Schema.Schema.Type<typeof CourseDroppedSchema>;

// Selected Course for multiple courses event
export const SelectedCourseSchema = Schema.Struct({
  courseId: CourseId.Schema,
  credits: CreditUnit.Schema
});

export type SelectedCourse = Schema.Schema.Type<typeof SelectedCourseSchema>;

export const CoursesSelectedSchema = Schema.Struct({
  type: Schema.Literal("CoursesSelected"),
  studentId: StudentId.Schema,
  semesterId: SemesterId.Schema,
  courseSelections: Schema.Array(SelectedCourseSchema),
  totalCreditsAdded: Schema.Number,
  timestamp: Schema.Date
});

export type CoursesSelected = Schema.Schema.Type<typeof CoursesSelectedSchema>;

export type RegistrationEvent =
  | RegistrationPeriodStarted
  | CoursesSelected
  | RegistrationSubmitted
  | RegistrationConfirmed
  | CourseDropped;

  // TODO RegistrationRejected