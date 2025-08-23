import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId, CreditUnit } from '@shared/index.js';
import { RegistrationStatus, CourseType } from '../value-objects/index.js';

export const SelectedCourse = Schema.Struct({
  courseId: CourseId.CourseId,
  credits: CreditUnit.CreditUnit,
  courseType: CourseType.CourseType,
  isRequired: Schema.Boolean
});

export type SelectedCourse = Schema.Schema.Type<typeof SelectedCourse>;

export const StudentRegistration = Schema.Struct({
  studentId: StudentId.StudentId,
  semesterId: SemesterId.SemesterId,
  selectedCourses: Schema.Array(SelectedCourse),
  registrationStatus: RegistrationStatus.RegistrationStatus,
  totalCredits: CreditUnit.CreditUnit,
  submittedAt: Schema.optional(Schema.Date),
  confirmedAt: Schema.optional(Schema.Date)
});

export type StudentRegistration = Schema.Schema.Type<typeof StudentRegistration>;

export const make = (
  studentId: StudentId.StudentId,
  semesterId: SemesterId.SemesterId
): StudentRegistration => ({
  studentId,
  semesterId,
  selectedCourses: [],
  registrationStatus: RegistrationStatus.RegistrationStatusValue.Draft,
  totalCredits: CreditUnit.zero(),
  submittedAt: undefined,
  confirmedAt: undefined
});

export const addCourse = (
  registration: StudentRegistration,
  course: SelectedCourse
): StudentRegistration => ({
  ...registration,
  selectedCourses: [...registration.selectedCourses, course],
  totalCredits: CreditUnit.add(registration.totalCredits, course.credits)
});

export const removeCourse = (
  registration: StudentRegistration,
  courseId: CourseId.CourseId
): StudentRegistration => {
  const courseToRemove = registration.selectedCourses.find(c => c.courseId === courseId);
  if (!courseToRemove) return registration;
  
  return {
    ...registration,
    selectedCourses: registration.selectedCourses.filter(c => c.courseId !== courseId),
    totalCredits: CreditUnit.subtract(registration.totalCredits, courseToRemove.credits)
  };
};