import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId, CreditUnit } from '@shared/index.js';
import { RegistrationStatus, CourseType } from '../value-objects/index.js';

export const SelectedCourseSchema = Schema.Struct({
  courseId: CourseId.Schema,
  credits: CreditUnit.Schema,
  courseType: CourseType.Schema,
  isRequired: Schema.Boolean
});

export type SelectedCourse = Schema.Schema.Type<typeof SelectedCourseSchema>;

export const StudentRegistrationSchema = Schema.Struct({
  studentId: StudentId.Schema,
  semesterId: SemesterId.Schema,
  selectedCourses: Schema.Array(SelectedCourseSchema),
  registrationStatus: RegistrationStatus.Schema,
  totalCredits: CreditUnit.Schema,
  submittedAt: Schema.optional(Schema.Date),
  confirmedAt: Schema.optional(Schema.Date)
});

export type StudentRegistration = Schema.Schema.Type<typeof StudentRegistrationSchema>;

export const SelectedCourse = {
  Schema: SelectedCourseSchema
} as const;

export const StudentRegistration = {
  Schema: StudentRegistrationSchema,
  make: (
    studentId: StudentId,
    semesterId: SemesterId
  ): StudentRegistration => ({
    studentId,
    semesterId,
    selectedCourses: [],
    registrationStatus: RegistrationStatus.Value.Draft,
    totalCredits: CreditUnit.zero(),
    submittedAt: undefined,
    confirmedAt: undefined
  }),
  addCourse: (
    registration: StudentRegistration,
    course: SelectedCourse
  ): StudentRegistration => ({
    ...registration,
    selectedCourses: [...registration.selectedCourses, course],
    totalCredits: CreditUnit.add(registration.totalCredits, course.credits)
  }),
  removeCourse: (
    registration: StudentRegistration,
    courseId: CourseId
  ): StudentRegistration => {
    const courseToRemove = registration.selectedCourses.find(c => c.courseId === courseId);
    if (!courseToRemove) return registration;

    return {
      ...registration,
      selectedCourses: registration.selectedCourses.filter(c => c.courseId !== courseId),
      totalCredits: CreditUnit.subtract(registration.totalCredits, courseToRemove.credits)
    };
  }
} as const;