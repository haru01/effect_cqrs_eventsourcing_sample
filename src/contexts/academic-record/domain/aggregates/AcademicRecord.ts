import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId, Grade, CreditUnit } from '@shared/index.js';
import { AcademicStatus } from '../value-objects/index.js';

export const CompletedCourse = Schema.Struct({
  courseId: CourseId.CourseId,
  semesterId: SemesterId.SemesterId,
  grade: Grade.Grade,
  credits: CreditUnit.CreditUnit,
  completedAt: Schema.Date
});

export type CompletedCourse = Schema.Schema.Type<typeof CompletedCourse>;

export const AcademicRecord = Schema.Struct({
  studentId: StudentId.StudentId,
  completedCourses: Schema.Array(CompletedCourse),
  totalCredits: CreditUnit.CreditUnit,
  gpa: Schema.Number,
  academicStatus: AcademicStatus.AcademicStatus,
  lastUpdated: Schema.Date
});

export type AcademicRecord = Schema.Schema.Type<typeof AcademicRecord>;

export const make = (studentId: StudentId.StudentId): AcademicRecord => ({
  studentId,
  completedCourses: [],
  totalCredits: CreditUnit.zero(),
  gpa: 0.0,
  academicStatus: AcademicStatus.AcademicStatusValue.GoodStanding,
  lastUpdated: new Date()
});

export const addCompletedCourse = (
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
};

export const calculateGPA = (completedCourses: CompletedCourse[]): number => {
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