import * as Schema from '@effect/schema/Schema';
import * as Effect from 'effect/Effect';
import { StudentId, CourseId, SemesterId, CreditUnit } from '@shared/index.js';
import { RegistrationStatus, CourseType } from '../value-objects/index.js';
import { CreditLimitExceeded } from '../errors/DomainErrors.js';

/**
 * 選択科目スキーマ
 * 学生が選択した科目の情報を表現する
 */
export const SelectedCourseSchema = Schema.Struct({
  courseId: CourseId.Schema.annotations({ title: "科目ID" }),
  credits: CreditUnit.Schema.annotations({ title: "単位数" }),
  courseType: CourseType.Schema.annotations({ title: "科目種別" }),
  isRequired: Schema.Boolean.annotations({ title: "必修科目フラグ" })
});

export type SelectedCourse = Schema.Schema.Type<typeof SelectedCourseSchema>;

/**
 * 学生履修登録スキーマ
 * 学生の履修登録状況と選択科目を管理する集約ルート
 */
export const StudentRegistrationSchema = Schema.Struct({
  studentId: StudentId.Schema.annotations({ title: "学生ID" }),
  semesterId: SemesterId.Schema.annotations({ title: "学期ID" }),
  selectedCourses: Schema.Array(SelectedCourseSchema).annotations({ title: "選択科目リスト" }),
  registrationStatus: RegistrationStatus.Schema.annotations({ title: "履修ステータス" }),
  totalCredits: CreditUnit.Schema.annotations({ title: "合計単位数" }),
  submittedAt: Schema.optional(Schema.Date).annotations({ title: "提出日時" }),
  confirmedAt: Schema.optional(Schema.Date).annotations({ title: "確定日時" })
});

export type StudentRegistration = Schema.Schema.Type<typeof StudentRegistrationSchema>;

export const SelectedCourseModule = {
  Schema: SelectedCourseSchema
} as const;

/**
 * 単位数制限上限（24単位）
 * CreditUnitは10単位制限があるため、比較用に直接値を使用
 */
const CREDIT_LIMIT = 24;

export const StudentRegistrationModule = {
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
  /**
   * 単位数制限チェック付き科目追加
   * 24単位制限を超過する場合はCreditLimitExceededエラーを発生
   */
  addCourseWithLimitCheck: (
    registration: StudentRegistration,
    course: SelectedCourse
  ): Effect.Effect<StudentRegistration, CreditLimitExceeded> =>
    Effect.gen(function* () {
      // CreditUnitの制限を回避して直接数値で計算
      const currentCreditsValue = Number(registration.totalCredits);
      const additionalCreditsValue = Number(course.credits);
      const newTotalCreditsValue = currentCreditsValue + additionalCreditsValue;
      
      if (newTotalCreditsValue > CREDIT_LIMIT) {
        yield* Effect.fail(new CreditLimitExceeded({
          message: `単位数制限（${CREDIT_LIMIT}単位）を超過します`,
          currentCredits: currentCreditsValue,
          limit: CREDIT_LIMIT
        }));
      }
      
      return StudentRegistrationModule.addCourse(registration, course);
    }),
  removeCourse: (
    registration: StudentRegistration,
    courseId: CourseId
  ): StudentRegistration => {
    const courseToRemove = registration.selectedCourses.find((c: SelectedCourse) => c.courseId === courseId);
    if (!courseToRemove) return registration;

    return {
      ...registration,
      selectedCourses: registration.selectedCourses.filter((c: SelectedCourse) => c.courseId !== courseId),
      totalCredits: CreditUnit.subtract(registration.totalCredits, courseToRemove.credits)
    };
  }
} as const;

export { StudentRegistrationModule as StudentRegistration, SelectedCourseModule as SelectedCourse };