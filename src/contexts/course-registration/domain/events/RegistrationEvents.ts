import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId } from '@shared/index.js';

export const RegistrationPeriodStartedSchema = Schema.Struct({
  type: Schema.Literal("RegistrationPeriodStarted"),
  semesterId: SemesterId.Schema,
  startDate: Schema.Date,
  endDate: Schema.Date,
  timestamp: Schema.Date
});

export type RegistrationPeriodStarted = Schema.Schema.Type<typeof RegistrationPeriodStartedSchema>;

export const CourseSelectedSchema = Schema.Struct({
  type: Schema.Literal("CourseSelected"),
  studentId: StudentId.Schema,
  semesterId: SemesterId.Schema,
  courseId: CourseId.Schema,
  timestamp: Schema.Date
});

export type CourseSelected = Schema.Schema.Type<typeof CourseSelectedSchema>;

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

export type RegistrationEvent =
  | RegistrationPeriodStarted
  | CourseSelected
  | RegistrationSubmitted
  | RegistrationConfirmed
  | CourseDropped;

  // TODO RegistrationRejected