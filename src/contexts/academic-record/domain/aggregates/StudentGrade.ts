import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId, InstructorId, Grade } from '@shared/index.js';
import { GradeStatus } from '../value-objects/index.js';

export const GradeComponentSchema = Schema.Struct({
  componentType: Schema.String,
  score: Schema.Number,
  maxScore: Schema.Number,
  weight: Schema.Number
});

export type GradeComponent = Schema.Schema.Type<typeof GradeComponentSchema>;

export const StudentGradeSchema = Schema.Struct({
  studentId: StudentId.Schema,
  courseId: CourseId.Schema,
  semesterId: SemesterId.Schema,
  instructorId: InstructorId.Schema,
  gradeComponents: Schema.Array(GradeComponentSchema),
  finalGrade: Schema.optional(Grade.Schema),
  gradeStatus: GradeStatus.Schema,
  enteredAt: Schema.optional(Schema.Date),
  finalizedAt: Schema.optional(Schema.Date),
  publishedAt: Schema.optional(Schema.Date)
});

export type StudentGrade = Schema.Schema.Type<typeof StudentGradeSchema>;

const calculateFinalScore = (grade: StudentGrade): number => {
  return grade.gradeComponents.reduce((total, component) => {
    const percentage = component.score / component.maxScore;
    return total + (percentage * component.weight);
  }, 0);
};

export const GradeComponent = {
  Schema: GradeComponentSchema
} as const;

export const StudentGrade = {
  Schema: StudentGradeSchema,
  make: (
    studentId: StudentId,
    courseId: CourseId,
    semesterId: SemesterId,
    instructorId: InstructorId
  ): StudentGrade => ({
    studentId,
    courseId,
    semesterId,
    instructorId,
    gradeComponents: [],
    finalGrade: undefined,
    gradeStatus: GradeStatus.NotEntered,
    enteredAt: undefined,
    finalizedAt: undefined,
    publishedAt: undefined
  }),
  addGradeComponent: (
    grade: StudentGrade,
    component: GradeComponent
  ): StudentGrade => ({
    ...grade,
    gradeComponents: [...grade.gradeComponents, component]
  }),
  calculateFinalScore
} as const;