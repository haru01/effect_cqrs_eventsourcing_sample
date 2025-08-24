import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId, InstructorId, Grade } from '@shared/index.js';
import { GradeStatus } from '../value-objects/index.js';

/**
 * 成績構成要素スキーマ
 * 出席、課題、試験等の成績評価要素を表現する
 */
export const GradeComponentSchema = Schema.Struct({
  componentType: Schema.String.annotations({ title: "構成要素種別" }),
  score: Schema.Number.annotations({ title: "取得点数" }),
  maxScore: Schema.Number.annotations({ title: "満点" }),
  weight: Schema.Number.annotations({ title: "重み" })
});

export type GradeComponent = Schema.Schema.Type<typeof GradeComponentSchema>;

/**
 * 学生成績スキーマ
 * 個別学生の科目ごとの成績情報と評価状況を管理する集約ルート
 */
export const StudentGradeSchema = Schema.Struct({
  studentId: StudentId.Schema.annotations({ title: "学生ID" }),
  courseId: CourseId.Schema.annotations({ title: "科目ID" }),
  semesterId: SemesterId.Schema.annotations({ title: "学期ID" }),
  instructorId: InstructorId.Schema.annotations({ title: "教員ID" }),
  gradeComponents: Schema.Array(GradeComponentSchema).annotations({ title: "成績構成要素" }),
  finalGrade: Schema.optional(Grade.Schema).annotations({ title: "最終成績" }),
  gradeStatus: GradeStatus.Schema.annotations({ title: "成績ステータス" }),
  enteredAt: Schema.optional(Schema.Date).annotations({ title: "入力日時" }),
  finalizedAt: Schema.optional(Schema.Date).annotations({ title: "確定日時" }),
  publishedAt: Schema.optional(Schema.Date).annotations({ title: "公開日時" })
});

export type StudentGrade = Schema.Schema.Type<typeof StudentGradeSchema>;

const calculateFinalScore = (grade: StudentGrade): number => {
  return grade.gradeComponents.reduce((total, component) => {
    const percentage = component.score / component.maxScore;
    return total + (percentage * component.weight);
  }, 0);
};

export const GradeComponentModule = {
  Schema: GradeComponentSchema
} as const;

export const StudentGradeModule = {
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

export { StudentGradeModule as StudentGrade, GradeComponentModule as GradeComponent };