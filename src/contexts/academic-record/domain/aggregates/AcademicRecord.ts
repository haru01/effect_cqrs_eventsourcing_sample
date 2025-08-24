import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId, Grade, CreditUnit } from '@shared/index.js';
import { AcademicStatus } from '../value-objects/index.js';

export const CompletedCourseSchema = Schema.Struct({
  courseId: CourseId.Schema,
  semesterId: SemesterId.Schema,
  grade: Grade.Schema,
  credits: CreditUnit.Schema,
  completedAt: Schema.Date
});

export type CompletedCourse = Schema.Schema.Type<typeof CompletedCourseSchema>;

export const AcademicRecordSchema = Schema.Struct({
  studentId: StudentId.Schema,
  completedCourses: Schema.Array(CompletedCourseSchema),
  totalCredits: CreditUnit.Schema,
  gpa: Schema.Number,
  academicStatus: AcademicStatus.Schema,
  lastUpdated: Schema.Date
});

export type AcademicRecord = Schema.Schema.Type<typeof AcademicRecordSchema>;

const calculateGPA = (completedCourses: CompletedCourse[]): number => {
  if (completedCourses.length === 0) return 0.0;

  let totalGradePoints = 0;
  let totalCredits = 0;

  for (const course of completedCourses) {
    if (Grade.isPassing(course.grade)) {
      totalGradePoints += Grade.toGPA(course.grade) * course.credits;
      totalCredits += course.credits;
    }
  }

  return totalCredits > 0 ? totalGradePoints / totalCredits : 0.0;
};

export const CompletedCourse = {
  Schema: CompletedCourseSchema
} as const;

export const AcademicRecord = {
  Schema: AcademicRecordSchema,
  make: (studentId: StudentId): AcademicRecord => ({
    studentId,
    completedCourses: [],
    totalCredits: CreditUnit.zero(),
    gpa: 0.0,
    academicStatus: AcademicStatus.Value.GoodStanding,
    lastUpdated: new Date()
  }),
  addCompletedCourse: (
    record: AcademicRecord,
    course: CompletedCourse
  ): AcademicRecord => {
    const updatedCourses = [...record.completedCourses, course];
    const updatedCredits = CreditUnit.add(record.totalCredits, course.credits);
    const updatedGPA = calculateGPA(updatedCourses);

    return {
      ...record,
      completedCourses: updatedCourses,
      totalCredits: updatedCredits,
      gpa: updatedGPA,
      lastUpdated: new Date()
    };
  }
} as const;