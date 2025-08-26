import * as Effect from 'effect/Effect';
import { StudentId, SemesterId, CreditUnit } from '../../../../shared-kernel/index.js';
import { CoursesSelected } from '../../domain/events/RegistrationEvents.js';
import { SelectCourses } from '../../domain/commands/RegistrationCommands.js';
import { CourseRegistrationDomainError, CreditLimitExceeded } from '../../domain/errors/DomainErrors.js';
import { StudentRegistration } from '../../domain/aggregates/StudentRegistration.js';
import { EventStore, EventStoreError } from '../../../../infrastructure/event-store/index.js';
import { GetStudentRegistrationHandler, StudentRegistrationWithActualCredits } from '../query-handlers/GetStudentRegistrationHandler.js';

/**
 * SelectCourses コマンドハンドラー
 * 複数科目の一括選択処理
 */
export const SelectCoursesHandler = {
  handle: (command: SelectCourses): Effect.Effect<CoursesSelected, CourseRegistrationDomainError | EventStoreError, EventStore> =>
    Effect.gen(function* () {
      // 1. 学生の履修登録情報を取得または初期化
      const registration = yield* getOrCreateStudentRegistration(
        command.studentId,
        command.semesterId
      );

      // 2. 選択科目の重複チェック
      const courseIds = command.courseSelections.map(selection => selection.courseId);
      const uniqueCourseIds = [...new Set(courseIds)];
      if (courseIds.length !== uniqueCourseIds.length) {
        yield* Effect.fail(new CreditLimitExceeded({
          message: "同一科目が複数選択されています",
          currentCredits: 0,
          limit: 0
        }));
      }

      // 3. 既選択科目との重複チェック
      const existingCourseIds = registration.selectedCourses?.map(course => course.courseId) || [];
      const duplicateCourseIds = courseIds.filter(courseId => 
        existingCourseIds.includes(courseId)
      );
      if (duplicateCourseIds.length > 0) {
        yield* Effect.fail(new CreditLimitExceeded({
          message: `既に選択済みの科目が含まれています: ${duplicateCourseIds.join(', ')}`,
          currentCredits: 0,
          limit: 0
        }));
      }

      // 4. 単位数制限チェック（一括計算）
      const actualCurrentCredits = registration.actualTotalCredits || 0;
      const additionalCredits = command.courseSelections.reduce(
        (sum, selection) => sum + Number(selection.credits), 
        0
      );
      const newTotalCredits = actualCurrentCredits + additionalCredits;
      const creditLimit = 24;

      if (newTotalCredits > creditLimit) {
        yield* Effect.fail(new CreditLimitExceeded({
          message: `単位数制限（${creditLimit}単位）を超過します。選択科目合計: ${additionalCredits}単位、制限まで残り: ${creditLimit - actualCurrentCredits}単位`,
          currentCredits: actualCurrentCredits,
          limit: creditLimit,
          attemptedCredits: additionalCredits
        }));
      }

      // 5. CoursesSelected イベント生成
      const event: CoursesSelected = {
        type: "CoursesSelected",
        studentId: command.studentId,
        semesterId: command.semesterId,
        courseSelections: command.courseSelections.map(selection => ({
          courseId: selection.courseId,
          credits: selection.credits
        })),
        totalCreditsAdded: CreditUnit.make(Math.min(additionalCredits, 10)),
        timestamp: new Date()
      };

      // 6. イベントストアへの保存
      const eventStore = yield* EventStore;
      const streamId = `student-registration-${command.studentId}-${command.semesterId}`;
      const domainEvent = {
        ...event,
        aggregateId: streamId
      };
      yield* eventStore.append(streamId, [domainEvent]);

      // 7. 生成されたイベントを返す
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
    // 既存の状態を取得、存在しない場合は初期状態を返す
    return yield* GetStudentRegistrationHandler.handle({
      studentId,
      semesterId
    }).pipe(
      Effect.orElse(() => {
        // 存在しない場合は初期状態を返す
        const initialState = StudentRegistration.make(studentId, semesterId);
        return Effect.succeed({
          ...initialState,
          actualTotalCredits: 0
        });
      })
    );
  });