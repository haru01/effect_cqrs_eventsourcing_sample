import * as Effect from 'effect/Effect';
import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId, CreditUnit } from '@shared/index.js';
import { CourseType } from '../../domain/value-objects/index.js';
import type { CourseSelected } from '../../domain/events/CourseSelected.js';
import { CourseRegistrationDomainError } from '../../domain/errors/DomainErrors.js';
import { StudentRegistration, SelectedCourse } from '../../domain/aggregates/StudentRegistration.js';
import { EventStore, EventStoreError } from '../../../../infrastructure/event-store/index.js';
import { GetStudentRegistrationHandler, StudentRegistrationWithActualCredits } from '../query-handlers/GetStudentRegistrationHandler.js';
import { CreditLimitExceeded } from '../../domain/errors/DomainErrors.js';

/**
 * SelectCourse コマンドスキーマ
 */
export const SelectCourseCommandSchema = Schema.Struct({
  studentId: StudentId.Schema.annotations({ title: "学生ID" }),
  semesterId: SemesterId.Schema.annotations({ title: "学期ID" }),
  courseId: CourseId.Schema.annotations({ title: "科目ID" }),
  credits: CreditUnit.Schema.annotations({ title: "単位数" }),
  courseType: CourseType.Schema.annotations({ title: "科目種別" }),
  isRequired: Schema.Boolean.annotations({ title: "必修科目フラグ" })
});

export type SelectCourseCommand = Schema.Schema.Type<typeof SelectCourseCommandSchema>;

/**
 * SelectCourse コマンドハンドラー
 * 単位数制限チェック機能を統合した履修科目選択処理
 */
export const SelectCourseHandler = {
  handle: (command: SelectCourseCommand): Effect.Effect<CourseSelected, CourseRegistrationDomainError | EventStoreError, EventStore> =>
    Effect.gen(function* () {
      // 1. 学生の履修登録情報を取得または初期化
      const registration = yield* getOrCreateStudentRegistration(
        command.studentId,
        command.semesterId
      );

      // 2. 選択科目オブジェクトを作成
      const selectedCourse: SelectedCourse = {
        courseId: command.courseId,
        credits: command.credits,
        courseType: command.courseType,
        isRequired: command.isRequired
      };

      // 3. 実際の累積単位数で制限チェック
      const actualCurrentCredits = registration.actualTotalCredits || 0;
      const additionalCredits = Number(selectedCourse.credits);
      const newTotalCredits = actualCurrentCredits + additionalCredits;
      const creditLimit = 24;
      
      if (newTotalCredits > creditLimit) {
        yield* Effect.fail(new CreditLimitExceeded({
          message: `単位数制限（${creditLimit}単位）を超過します`,
          currentCredits: actualCurrentCredits,
          limit: creditLimit
        }));
      }
      
      // 4. イベント生成（制限チェックに通過した場合のみ）
      const { CourseSelected } = yield* Effect.promise(() => import('../../domain/events/CourseSelected.js'));
      const event = CourseSelected.make({
        studentId: registration.studentId,
        semesterId: registration.semesterId,
        courseId: selectedCourse.courseId,
        credits: selectedCourse.credits,
        courseType: selectedCourse.courseType,
        isRequired: selectedCourse.isRequired,
        timestamp: new Date(),
        totalCredits: CreditUnit.make(Math.min(newTotalCredits, 10)) // CreditUnit制約に合わせて調整
      });

      // 5. イベントストアへの保存
      const eventStore = yield* EventStore;
      const streamId = `student-registration-${command.studentId}-${command.semesterId}`;
      const domainEvent = {
        ...event,
        type: 'CourseSelected',
        aggregateId: streamId
      };
      yield* eventStore.append(streamId, [domainEvent]);

      // 6. 生成されたイベントを返す
      return event;
    })
} as const;

/**
 * 学生の履修登録情報を取得または初期化する
 * EventStoreから現在の状態を読み取り、存在しない場合は初期状態を返す
 */
const getOrCreateStudentRegistration = (
  studentId: StudentId,
  semesterId: SemesterId
): Effect.Effect<StudentRegistrationWithActualCredits, never, EventStore> =>
  Effect.gen(function* () {
    // 既存の状態をクエリハンドラーで取得を試行
    const existingStateResult = yield* Effect.either(
      GetStudentRegistrationHandler.handle({
        studentId,
        semesterId
      })
    );
    
    // 存在する場合はその状態を返す
    if (existingStateResult._tag === "Right") {
      return existingStateResult.right;
    }
    
    // 存在しない場合は初期状態を返す
    const initialState = StudentRegistration.make(studentId, semesterId);
    return {
      ...initialState,
      actualTotalCredits: 0
    };
  });