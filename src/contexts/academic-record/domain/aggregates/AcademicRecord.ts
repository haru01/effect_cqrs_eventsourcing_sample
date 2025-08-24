import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId, Grade, CreditUnit } from '@shared/index.js';
import { AcademicStatus } from '../value-objects/index.js';

/**
 * 修了科目スキーマ
 * 学生が完了した科目の成績と単位情報を表現する
 */
export const CompletedCourseSchema = Schema.Struct({
  courseId: CourseId.Schema.annotations({ title: "科目ID" }),
  semesterId: SemesterId.Schema.annotations({ title: "学期ID" }),
  grade: Grade.Schema.annotations({ title: "成績" }),
  credits: CreditUnit.Schema.annotations({ title: "単位数" }),
  completedAt: Schema.Date.annotations({ title: "修了日" })
});

export type CompletedCourse = Schema.Schema.Type<typeof CompletedCourseSchema>;

/**
 * 学習記録スキーマ
 * 学生の総合的な学習成果と学習状況を管理する集約ルート
 */
export const AcademicRecordSchema = Schema.Struct({
  studentId: StudentId.Schema.annotations({ title: "学生ID" }),
  completedCourses: Schema.Array(CompletedCourseSchema).annotations({ title: "修了科目リスト" }),
  totalCredits: CreditUnit.Schema.annotations({ title: "総取得単位数" }),
  gpa: Schema.Number.annotations({ title: "GPA" }),
  academicStatus: AcademicStatus.Schema.annotations({ title: "学習状況" }),
  lastUpdated: Schema.Date.annotations({ title: "最終更新日" })
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

export const CompletedCourseModule = {
  Schema: CompletedCourseSchema
} as const;

export const AcademicRecordModule = {
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

export { AcademicRecordModule as AcademicRecord, CompletedCourseModule as CompletedCourse };