import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId } from '@shared/index.js';

export const RegistrationPeriodStarted = Schema.Struct({
  type: Schema.Literal("RegistrationPeriodStarted"),
  semesterId: SemesterId.SemesterId,
  startDate: Schema.Date,
  endDate: Schema.Date,
  timestamp: Schema.Date
});

export type RegistrationPeriodStarted = Schema.Schema.Type<typeof RegistrationPeriodStarted>;

export const CourseSelected = Schema.Struct({
  type: Schema.Literal("CourseSelected"),
  studentId: StudentId.StudentId,
  semesterId: SemesterId.SemesterId,
  courseId: CourseId.CourseId,
  timestamp: Schema.Date
});

export type CourseSelected = Schema.Schema.Type<typeof CourseSelected>;

export const RegistrationSubmitted = Schema.Struct({
  type: Schema.Literal("RegistrationSubmitted"),
  studentId: StudentId.StudentId,
  semesterId: SemesterId.SemesterId,
  submittedCourses: Schema.Array(CourseId.CourseId),
  timestamp: Schema.Date
});

export type RegistrationSubmitted = Schema.Schema.Type<typeof RegistrationSubmitted>;

export const RegistrationConfirmed = Schema.Struct({
  type: Schema.Literal("RegistrationConfirmed"),
  studentId: StudentId.StudentId,
  semesterId: SemesterId.SemesterId,
  confirmedCourses: Schema.Array(CourseId.CourseId),
  timestamp: Schema.Date
});

export type RegistrationConfirmed = Schema.Schema.Type<typeof RegistrationConfirmed>;

export const CourseDropped = Schema.Struct({
  type: Schema.Literal("CourseDropped"),
  studentId: StudentId.StudentId,
  semesterId: SemesterId.SemesterId,
  courseId: CourseId.CourseId,
  timestamp: Schema.Date
});

export type CourseDropped = Schema.Schema.Type<typeof CourseDropped>;

export type RegistrationEvent =
  | RegistrationPeriodStarted
  | CourseSelected
  | RegistrationSubmitted
  | RegistrationConfirmed
  | CourseDropped;