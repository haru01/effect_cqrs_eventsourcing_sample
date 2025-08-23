import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId, InstructorId, Grade } from '@shared/index.js';
import { GradeStatus } from '../value-objects/index.js';

export const GradeComponent = Schema.Struct({
  componentType: Schema.String,
  score: Schema.Number,
  maxScore: Schema.Number,
  weight: Schema.Number
});

export type GradeComponent = Schema.Schema.Type<typeof GradeComponent>;

export const StudentGrade = Schema.Struct({
  studentId: StudentId.StudentId,
  courseId: CourseId.CourseId,
  semesterId: SemesterId.SemesterId,
  instructorId: InstructorId.InstructorId,
  gradeComponents: Schema.Array(GradeComponent),
  finalGrade: Schema.optional(Grade.Grade),
  gradeStatus: GradeStatus.GradeStatus,
  enteredAt: Schema.optional(Schema.Date),
  finalizedAt: Schema.optional(Schema.Date),
  publishedAt: Schema.optional(Schema.Date)
});

export type StudentGrade = Schema.Schema.Type<typeof StudentGrade>;

export const make = (
  studentId: StudentId.StudentId,
  courseId: CourseId.CourseId,
  semesterId: SemesterId.SemesterId,
  instructorId: InstructorId.InstructorId
): StudentGrade => ({
  studentId,
  courseId,
  semesterId,
  instructorId,
  gradeComponents: [],
  finalGrade: undefined,
  gradeStatus: GradeStatus.GradeStatusValue.NotEntered,
  enteredAt: undefined,
  finalizedAt: undefined,
  publishedAt: undefined
});

export const addGradeComponent = (
  grade: StudentGrade,
  component: GradeComponent
): StudentGrade => ({
  ...grade,
  gradeComponents: [...grade.gradeComponents, component]
});

export const calculateFinalScore = (grade: StudentGrade): number => {
  return grade.gradeComponents.reduce((total, component) => {
    const percentage = component.score / component.maxScore;
    return total + (percentage * component.weight);
  }, 0);
};