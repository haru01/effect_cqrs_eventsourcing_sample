import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId, CreditUnit } from '@shared/index.js';
import { CourseType } from '../value-objects/index.js';

/**
 * CourseSelected イベントスキーマ
 * 学生が履修科目を選択したことを表すドメインイベント
 */
export const CourseSelectedSchema = Schema.Struct({
  studentId: StudentId.Schema.annotations({ title: "学生ID" }),
  semesterId: SemesterId.Schema.annotations({ title: "学期ID" }),
  courseId: CourseId.Schema.annotations({ title: "科目ID" }),
  credits: CreditUnit.Schema.annotations({ title: "単位数" }),
  courseType: CourseType.Schema.annotations({ title: "科目種別" }),
  isRequired: Schema.Boolean.annotations({ title: "必修科目フラグ" }),
  timestamp: Schema.Date.annotations({ title: "発生日時" }),
  totalCredits: CreditUnit.Schema.annotations({ title: "合計単位数" })
});

export type CourseSelected = Schema.Schema.Type<typeof CourseSelectedSchema>;

export const CourseSelected = {
  Schema: CourseSelectedSchema,
  make: (params: {
    studentId: StudentId;
    semesterId: SemesterId;
    courseId: CourseId;
    credits: CreditUnit;
    courseType: CourseType;
    isRequired: boolean;
    timestamp: Date;
    totalCredits: CreditUnit;
  }): CourseSelected => ({
    studentId: params.studentId,
    semesterId: params.semesterId,
    courseId: params.courseId,
    credits: params.credits,
    courseType: params.courseType,
    isRequired: params.isRequired,
    timestamp: params.timestamp,
    totalCredits: params.totalCredits
  })
} as const;