import * as Effect from 'effect/Effect';
import { StudentId, SemesterId } from '../../../../shared-kernel/index.js';
import { CoursesSelected } from '../../domain/events/RegistrationEvents.js';
import { SelectCourses } from '../../domain/commands/RegistrationCommands.js';
import { CourseRegistrationDomainError } from '../../domain/errors/DomainErrors.js';
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

      // 2. ドメインによるコース選択処理（集約に対する操作）
      const event = yield* StudentRegistration.selectCourses(
        registration,
        command.courseSelections.map(selection => ({
          courseId: selection.courseId,
          credits: selection.credits
        }))
      );

      // 3. イベントストアへの保存
      const eventStore = yield* EventStore;
      const streamId = `student-registration-${command.studentId}-${command.semesterId}`;
      const domainEvent = {
        ...event,
        aggregateId: streamId
      };
      yield* eventStore.append(streamId, [domainEvent]);

      // 4. 生成されたイベントを返す
      return event;
    })
} as const;

/**
 * 学生の履修登録情報を取得または初期化する
 * EventStoreから現在の状態を読み取り、存在しない場合は初期状態を返す
 * TODO：暫定処置。本来は、RegistrationPeriodStarted / 履修登録期間開始されたが事前に発行されており、studentId, semesterIdで取得できるはず。
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