import * as Effect from 'effect/Effect';
import * as Schema from '@effect/schema/Schema';
import { StudentId, SemesterId } from '../../../../shared-kernel/index.js';
import { CourseType } from '../../domain/value-objects/index.js';
import { EventStore } from '../../../../infrastructure/event-store/index.js';
import { StudentRegistration } from '../../domain/aggregates/StudentRegistration.js';
import type { StudentRegistration as StudentRegistrationType } from '../../domain/aggregates/StudentRegistration.js';
import type { CoursesSelected } from '../../domain/events/RegistrationEvents.js';

/**
 * 学生履修登録が見つからない場合のエラー
 */
export class NotFoundStudentRegistration extends Error {
  readonly _tag = "NotFoundStudentRegistration";

  constructor(
    public readonly studentId: StudentId,
    public readonly semesterId: SemesterId
  ) {
    super(`StudentRegistration not found for student ${studentId} in semester ${semesterId}`);
  }
}

/**
 * GetStudentRegistration クエリスキーマ
 */
export const GetStudentRegistrationQuerySchema = Schema.Struct({
  studentId: StudentId.Schema.annotations({ title: "学生ID" }),
  semesterId: SemesterId.Schema.annotations({ title: "学期ID" })
});

export type GetStudentRegistrationQuery = Schema.Schema.Type<typeof GetStudentRegistrationQuerySchema>;

/**
 * 実際の累積単位数を含む拡張ビュー
 * CreditUnitの制約を回避して実際の単位数を追跡
 */
export interface StudentRegistrationWithActualCredits extends StudentRegistrationType {
  readonly actualTotalCredits: number; // CreditUnit制約を超えた実際の累積値
}


/**
 * GetStudentRegistration クエリハンドラー
 * EventStoreからイベントを読み取って最新のStudentRegistration状態を再構築
 */
export const GetStudentRegistrationHandler = {
  handle: (query: GetStudentRegistrationQuery): Effect.Effect<StudentRegistrationWithActualCredits, NotFoundStudentRegistration | Error, EventStore> =>
    Effect.gen(function* () {
      // 1. EventStoreから該当ストリームのイベントを取得
      const eventStore = yield* EventStore;
      const streamId = `student-registration-${query.studentId}-${query.semesterId}`;

      // 2. イベントを読み取り（ストリームが存在しない場合はNotFoundStudentRegistrationエラーを返す）
      const events = yield* Effect.either(eventStore.read(streamId));

      if (events._tag === "Left") {
        // ストリームが存在しない場合
        return yield* Effect.fail(
          new NotFoundStudentRegistration(query.studentId, query.semesterId)
        );
      }

      // 3. イベントから状態を再構築
      let registration = StudentRegistration.make(query.studentId, query.semesterId);
      let version = 0;
      let totalCreditsAccumulator = 0;

      for (const event of events.right) {
        if (event.type === 'CoursesSelected') {
          const coursesSelectedEvent = event as CoursesSelected & { type: string; aggregateId?: string; version?: number };

          // イベントから選択科目情報を抽出して状態を更新
          for (const courseSelection of coursesSelectedEvent.courseSelections) {
            const selectedCourse = {
              courseId: courseSelection.courseId,
              credits: courseSelection.credits,
              courseType: CourseType.make(CourseType.Value.Elective), // デフォルト値
              isRequired: false // デフォルト値
            };

            // 状態を直接更新（プロジェクションでは制限チェックを行わない）
            registration = {
              ...registration,
              selectedCourses: [...registration.selectedCourses, selectedCourse],
              totalCredits: totalCreditsAccumulator + Number(courseSelection.credits)
            };

            totalCreditsAccumulator += Number(courseSelection.credits);
          }
          version = event.version || version + 1;
        }
      }

      // 4. 実際の累積単位数を含む拡張オブジェクトを返す
      return {
        ...registration,
        actualTotalCredits: totalCreditsAccumulator // CreditUnitの制約でおかしなことになってる件。
      };
    })
} as const;