import * as Effect from 'effect/Effect';
import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId, CreditUnit } from '@shared/index.js';
import { CourseType } from '../../domain/value-objects/index.js';
import type { CourseSelected } from '../../domain/events/CourseSelected.js';
import { CourseRegistrationDomainError } from '../../domain/errors/DomainErrors.js';
import { StudentRegistration, SelectedCourse } from '../../domain/aggregates/StudentRegistration.js';
import type { StudentRegistration as StudentRegistrationType } from '../../domain/aggregates/StudentRegistration.js';

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
  handle: (command: SelectCourseCommand): Effect.Effect<CourseSelected, CourseRegistrationDomainError> =>
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

      // 3. 単位数制限チェックを含む科目追加処理（イベントのみ生成）
      const event = yield* StudentRegistration.addCourseWithLimitCheck(
        registration,
        selectedCourse
      );

      // 4. イベントストアへの保存（今後実装）
      // yield* EventStore.append(event);

      // 5. 生成されたイベントを返す
      return event;
    })
} as const;

/**
 * 学生の履修登録情報を取得または初期化する
 * TODO: リポジトリパターンで実装
 */
const getOrCreateStudentRegistration = (
  studentId: StudentId,
  semesterId: SemesterId
): Effect.Effect<StudentRegistrationType, never> =>
  Effect.succeed(StudentRegistration.make(studentId, semesterId));