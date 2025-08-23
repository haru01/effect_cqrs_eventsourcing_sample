import * as Data from 'effect/Data';

export class PreviousSemesterNotEnded extends Data.TaggedError("PreviousSemesterNotEnded")<{
  readonly message: string;
}> {}

export class RegistrationPeriodAlreadyStarted extends Data.TaggedError("RegistrationPeriodAlreadyStarted")<{
  readonly message: string;
}> {}

export class OutsideRegistrationPeriod extends Data.TaggedError("OutsideRegistrationPeriod")<{
  readonly message: string;
}> {}

export class ScheduleConflict extends Data.TaggedError("ScheduleConflict")<{
  readonly message: string;
  readonly conflictingCourses: readonly string[];
}> {}

export class CreditLimitExceeded extends Data.TaggedError("CreditLimitExceeded")<{
  readonly message: string;
  readonly currentCredits: number;
  readonly limit: number;
}> {}

export class PrerequisiteNotMet extends Data.TaggedError("PrerequisiteNotMet")<{
  readonly message: string;
  readonly courseId: string;
  readonly missingPrerequisites: readonly string[];
}> {}

export class NoCourseSelected extends Data.TaggedError("NoCourseSelected")<{
  readonly message: string;
}> {}

export class RequiredCourseMissing extends Data.TaggedError("RequiredCourseMissing")<{
  readonly message: string;
  readonly missingRequiredCourses: readonly string[];
}> {}

export class BelowMinimumCredits extends Data.TaggedError("BelowMinimumCredits")<{
  readonly message: string;
  readonly currentCredits: number;
  readonly minimumCredits: number;
}> {}

export class RegistrationNotSubmitted extends Data.TaggedError("RegistrationNotSubmitted")<{
  readonly message: string;
}> {}

export class CourseCapacityExceeded extends Data.TaggedError("CourseCapacityExceeded")<{
  readonly message: string;
  readonly courseId: string;
  readonly capacity: number;
}> {}

export class InsufficientPermission extends Data.TaggedError("InsufficientPermission")<{
  readonly message: string;
}> {}

export class OutsideDropPeriod extends Data.TaggedError("OutsideDropPeriod")<{
  readonly message: string;
}> {}

export class CannotDropRequiredCourse extends Data.TaggedError("CannotDropRequiredCourse")<{
  readonly message: string;
  readonly courseId: string;
}> {}

export class BelowMinimumCreditsAfterDrop extends Data.TaggedError("BelowMinimumCreditsAfterDrop")<{
  readonly message: string;
  readonly creditsAfterDrop: number;
  readonly minimumCredits: number;
}> {}

export type CourseRegistrationDomainError =
  | PreviousSemesterNotEnded
  | RegistrationPeriodAlreadyStarted  
  | OutsideRegistrationPeriod
  | ScheduleConflict
  | CreditLimitExceeded
  | PrerequisiteNotMet
  | NoCourseSelected
  | RequiredCourseMissing
  | BelowMinimumCredits
  | RegistrationNotSubmitted
  | CourseCapacityExceeded
  | InsufficientPermission
  | OutsideDropPeriod
  | CannotDropRequiredCourse
  | BelowMinimumCreditsAfterDrop;