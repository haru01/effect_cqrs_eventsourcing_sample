import * as Schema from '@effect/schema/Schema';
import * as Effect from 'effect/Effect';
import { StudentId, CourseId, SemesterId, CreditUnit } from '../../../../shared-kernel/index.js';
import { RegistrationStatus, CourseType } from '../value-objects/index.js';
import { CreditLimitExceeded } from '../errors/DomainErrors.js';
import { CoursesSelected } from '../events/RegistrationEvents.js';

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

/**
 * コース選択データの型定義
 */
export interface CourseSelection {
  readonly courseId: CourseId;
  readonly credits: CreditUnit;
}

/**
 * 追加単位数を計算し、制限超過時はエラーを返す
 */
const validateAdditionalCredits = (
  registration: StudentRegistration,
  courseSelections: readonly CourseSelection[]
): Effect.Effect<number, CreditLimitExceeded> => {
      // 現在の履修済み単位数を計算
    const currentCredits = registration.selectedCourses.reduce(
      (sum, course) => sum + Number(course.credits),
      0
    );
  const additionalCredits = courseSelections.reduce(
    (sum, selection) => sum + Number(selection.credits),
    0
  );

  if (currentCredits + additionalCredits > CREDIT_LIMIT) {
    return Effect.fail(new CreditLimitExceeded({
      message: `単位数制限（${CREDIT_LIMIT}単位）を超過します。選択科目合計: ${additionalCredits}単位、制限まで残り: ${CREDIT_LIMIT - currentCredits}単位`,
      currentCredits,
      limit: CREDIT_LIMIT,
      attemptedCredits: additionalCredits
    }));
  }

  return Effect.succeed(additionalCredits);
};

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

  /**
   * 集約に対してコース選択を実行し、イベントを生成
   */
  selectCourses: (
    registration: StudentRegistration,
    courseSelections: readonly CourseSelection[]
  ): Effect.Effect<CoursesSelected, CreditLimitExceeded> =>
    Effect.gen(function* () {
      const additionalCredits = yield* validateAdditionalCredits(registration, courseSelections);
      return {
        type: "CoursesSelected" as const,
        studentId: registration.studentId,
        semesterId: registration.semesterId,
        courseSelections: courseSelections.map(selection => ({
          courseId: selection.courseId,
          credits: selection.credits
        })),
        totalCreditsAdded: CreditUnit.make(Math.min(additionalCredits, 10)),
        timestamp: new Date()
      };
    })
} as const;

export { StudentRegistrationModule as StudentRegistration, SelectedCourseModule as SelectedCourse };