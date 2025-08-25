import { describe, it, expect } from 'vitest';
import * as Effect from 'effect/Effect';
import { StudentId, CourseId, SemesterId, CreditUnit } from '@shared/index.js';
import { CourseType } from './domain/value-objects/index.js';
import { CreditLimitExceeded } from './domain/errors/DomainErrors.js';
import { SelectCourseHandler } from './application/command-handlers/SelectCourseHandler.js';
import { GetStudentRegistrationHandler, NotFoundStudentRegistration } from './application/query-handlers/GetStudentRegistrationHandler.js';
import { CourseSelected } from './domain/events/CourseSelected.js';
import { TestLayer } from './infrastructure/TestLayer.js';

// テスト用アサーション関数

// コマンドを実行して成功を期待
const whenCourseIsSelected = (
  command: any
): Effect.Effect<CourseSelected, CreditLimitExceeded> =>
  SelectCourseHandler.handle(command);

// コマンドを実行して特定エラーを期待
const whenCourseSelectionFails = <E>(command: any) =>
  Effect.flip(SelectCourseHandler.handle(command));

// CourseSelectedイベントの検証
const thenCourseSelectedEventIsPublished = (
  event: CourseSelected,
  studentId: StudentId,
  courseId: CourseId
): Effect.Effect<void, Error> => {
  expect(event.studentId).toBe(studentId);
  expect(event.courseId).toBe(courseId);
  expect(event.timestamp).toBeInstanceOf(Date);
  return Effect.void;
};

// 履修状態の科目数を検証
const thenStudentHasSelectedCourses = (
  state: any,
  expectedCount: number
) => {
  expect(state.selectedCourses).toHaveLength(expectedCount);
};

// 履修状態の単位数を検証
const thenStudentHasTotalCredits = (
  state: any,
  expectedCredits: number
) => {
  expect(Number(state.totalCredits)).toBe(expectedCredits);
};

// 実際の累積単位数を検証
const thenStudentHasActualTotalCredits = (
  state: any,
  expectedCredits: number
) => {
  expect(state.actualTotalCredits).toBe(expectedCredits);
};

// コマンド作成ヘルパー
const createCourseSelectionCommand = (
  studentId: StudentId,
  semesterId: SemesterId,
  courseId: CourseId,
  credits: number,
  courseType: CourseType = CourseType.Value.Elective,
  isRequired: boolean = false
) => ({
  studentId,
  semesterId,
  courseId,
  credits: CreditUnit.make(credits),
  courseType,
  isRequired
});

/**
 * Story 2.1: 履修科目選択
 * As a 学生
 * I want 履修したい科目を選択する
 * So that 履修登録に向けて科目を準備できる
 */
describe("Story 2.1: 履修科目選択", () => {

  it("AC1: 学生が単位数制限内で履修科目を正常に選択する", () =>
    Effect.gen(function* () {
      // Given: 有効な学生・学期・科目が存在し、単位数制限内
      const studentId = StudentId.make("STU1234567");
      const semesterId = SemesterId.make("2024-Spring");
      const courseId = CourseId.make("CS1234");
      const command = {
        studentId,
        semesterId,
        courseId,
        credits: CreditUnit.make(2),
        courseType: CourseType.Value.Elective,
        isRequired: false
      };

      // When: 学生が科目を選択するコマンドを実行する
      const event = yield* SelectCourseHandler.handle(command);

      // Then: CourseSelected イベントが発生する
      yield* thenCourseSelectedEventIsPublished(event, studentId, courseId);

      // And: EventStoreから現在の履修状況を取得して確認
      const currentState = yield* GetStudentRegistrationHandler.handle({
        studentId,
        semesterId
      });

      // 1つの科目が選択され、2単位が記録されていることを確認
      expect(currentState.selectedCourses).toHaveLength(1);
      expect(Number(currentState.totalCredits)).toBe(2);

      // 選択された科目の詳細を確認
      const selectedCourse = currentState.selectedCourses[0];
      expect(selectedCourse.courseId).toBe(courseId);
    }).pipe(
      Effect.provide(TestLayer),
      Effect.runPromise
    )
  );

  it("AC2: 単位数制限超過時にCreditLimitExceededエラーが発生する", () =>
    Effect.gen(function* () {
      // Given: 複数の科目を選択して22単位まで積み上げる
      const studentId = StudentId.make("STU1234568");
      const semesterId = SemesterId.make("2024-Spring");

      // 1つ目の科目：10単位
      const command1 = {
        studentId,
        semesterId,
        courseId: CourseId.make("CS5671"),
        credits: CreditUnit.make(10),
        courseType: CourseType.Value.Required,
        isRequired: true
      };

      // 2つ目の科目：10単位（累計20単位）
      const command2 = {
        studentId,
        semesterId,
        courseId: CourseId.make("CS5672"),
        credits: CreditUnit.make(10),
        courseType: CourseType.Value.Elective,
        isRequired: false
      };

      // 3つ目の科目：2単位（累計22単位）
      const command3 = {
        studentId,
        semesterId,
        courseId: CourseId.make("CS5673"),
        credits: CreditUnit.make(2),
        courseType: CourseType.Value.General,
        isRequired: false
      };

      // 順次科目を選択して22単位まで積み上げ
      yield* whenCourseIsSelected(command1);
      yield* whenCourseIsSelected(command2);
      yield* whenCourseIsSelected(command3);

      // 現在の状態を確認（22単位になっているはず）
      const stateBeforeOverflow = yield* GetStudentRegistrationHandler.handle({
        studentId,
        semesterId
      });

      // 累積計算で22単位になっているはず（10 + 10 + 2）
      // 実際の累積単位数で確認（10 + 10 + 2 = 22単位）
      expect(stateBeforeOverflow.actualTotalCredits).toBe(22);

      // When: 制限を超過する科目（3単位）を追加選択
      const overflowCommand = {
        studentId,
        semesterId,
        courseId: CourseId.make("CS5674"),
        credits: CreditUnit.make(3),
        courseType: CourseType.Value.Elective,
        isRequired: false
      };

      // Then: CreditLimitExceededエラーが発生する
      const error = yield* whenCourseSelectionFails(overflowCommand)

      expect(error).toBeInstanceOf(CreditLimitExceeded);

      // And: 失敗後の状態は変わっていない（22単位のまま）
      const stateAfterFailure = yield* GetStudentRegistrationHandler.handle({
        studentId,
        semesterId
      });

      expect(stateAfterFailure.selectedCourses).toHaveLength(3);
    }).pipe(
      Effect.provide(TestLayer),
      Effect.runPromise
    )
  );

  it("AC3: 単位数上限ギリギリ（24単位）で科目選択が成功する", () =>
    Effect.gen(function* () {
      // Given: 既存履修科目で20単位を選択済み
      const studentId = StudentId.make("STU1234569");
      const semesterId = SemesterId.make("2024-Spring");

      // 20単位まで積み上げ
      const command1 = {
        studentId,
        semesterId,
        courseId: CourseId.make("CS9001"),
        credits: CreditUnit.make(10),
        courseType: CourseType.Value.Required,
        isRequired: true
      };

      const command2 = {
        studentId,
        semesterId,
        courseId: CourseId.make("CS9002"),
        credits: CreditUnit.make(10),
        courseType: CourseType.Value.Elective,
        isRequired: false
      };

      yield* whenCourseIsSelected(command1);
      yield* whenCourseIsSelected(command2);

      // When: 4単位の科目を追加選択（合計24単位 = 制限値ちょうど）
      const boundaryCommand = {
        studentId,
        semesterId,
        courseId: CourseId.make("CS9003"),
        credits: CreditUnit.make(4),
        courseType: CourseType.Value.General,
        isRequired: false
      };

      // 境界値テスト：24単位ちょうどは成功するはず
      const event = yield* whenCourseIsSelected(boundaryCommand);

      // Then: 成功することを確認
      yield* thenCourseSelectedEventIsPublished(event, studentId, boundaryCommand.courseId);

      // And: 最終的に3つの科目が登録されていることを確認
      const finalState = yield* GetStudentRegistrationHandler.handle({
        studentId,
        semesterId
      });

      expect(finalState.selectedCourses).toHaveLength(3);
    }).pipe(
      Effect.provide(TestLayer),
      Effect.runPromise
    )
  );

  it("AC4: 1単位超過（25単位）で科目選択が失敗する", () =>
    Effect.gen(function* () {
      // Given: 既存履修科目で23単位を選択済み
      const studentId = StudentId.make("STU1234570");
      const semesterId = SemesterId.make("2024-Spring");

      // 23単位まで積み上げ
      const command1 = {
        studentId,
        semesterId,
        courseId: CourseId.make("CS8001"),
        credits: CreditUnit.make(10),
        courseType: CourseType.Value.Required,
        isRequired: true
      };

      const command2 = {
        studentId,
        semesterId,
        courseId: CourseId.make("CS8002"),
        credits: CreditUnit.make(10),
        courseType: CourseType.Value.Elective,
        isRequired: false
      };

      const command3 = {
        studentId,
        semesterId,
        courseId: CourseId.make("CS8003"),
        credits: CreditUnit.make(3),
        courseType: CourseType.Value.General,
        isRequired: false
      };

      yield* whenCourseIsSelected(command1);
      yield* whenCourseIsSelected(command2);
      yield* whenCourseIsSelected(command3);

      // When: 2単位の科目を追加選択（合計25単位 > 24単位制限）
      const overflowCommand = {
        studentId,
        semesterId,
        courseId: CourseId.make("CS8004"),
        credits: CreditUnit.make(2),
        courseType: CourseType.Value.Elective,
        isRequired: false
      };
      const error = yield* whenCourseSelectionFails(overflowCommand);

      // Then: CreditLimitExceeded エラーが発生する
      expect(error).toBeInstanceOf(CreditLimitExceeded);

      // And: 失敗後の状態は変わっていない（3つの科目のまま）
      const stateAfterFailure = yield* GetStudentRegistrationHandler.handle({
        studentId,
        semesterId
      });

      expect(stateAfterFailure.selectedCourses).toHaveLength(3);
    }).pipe(
      Effect.provide(TestLayer),
      Effect.runPromise
    )
  );

  it("AC5: 非存在学生への状態クエリでNotFoundStudentRegistrationエラーが発生する", () =>
    Effect.gen(function* () {
      // Given: 存在しない学生ID
      const nonExistentStudentId = StudentId.make("STU9999999");
      const semesterId = SemesterId.make("2024-Spring");

      // When: 存在しない学生の履修状況をクエリ
      const error = yield* Effect.flip(
        GetStudentRegistrationHandler.handle({
          studentId: nonExistentStudentId,
          semesterId
        })
      );

      // Then: NotFoundStudentRegistration エラーが発生する
      expect(error).toBeInstanceOf(NotFoundStudentRegistration);

      // エラーメッセージに学生IDと学期IDが含まれることを確認
      expect(error.message).toContain(nonExistentStudentId);
      expect(error.message).toContain(semesterId);
    }).pipe(
      Effect.provide(TestLayer),
      Effect.runPromise
    )
  );

  it("AC6: 複数科目選択後の状態プロジェクションが正確である", () =>
    Effect.gen(function* () {
      // Given: 複数の異なる種類の科目を選択
      const studentId = StudentId.make("STU1111111");
      const semesterId = SemesterId.make("2024-Spring");

      const requiredCourse = {
        studentId,
        semesterId,
        courseId: CourseId.make("REQ001"),
        credits: CreditUnit.make(6),
        courseType: CourseType.Value.Required,
        isRequired: true
      };

      const electiveCourse = {
        studentId,
        semesterId,
        courseId: CourseId.make("ELE001"),
        credits: CreditUnit.make(4),
        courseType: CourseType.Value.Elective,
        isRequired: false
      };

      const generalCourse = {
        studentId,
        semesterId,
        courseId: CourseId.make("GEN001"),
        credits: CreditUnit.make(2),
        courseType: CourseType.Value.General,
        isRequired: false
      };

      // When: 順次科目を選択
      yield* SelectCourseHandler.handle(requiredCourse);
      yield* SelectCourseHandler.handle(electiveCourse);
      yield* SelectCourseHandler.handle(generalCourse);

      // Then: プロジェクションされた状態が正確である
      const projectedState = yield* GetStudentRegistrationHandler.handle({
        studentId,
        semesterId
      });

      // 科目数の確認
      expect(projectedState.selectedCourses).toHaveLength(3);

      // 各科目の詳細確認
      const courseIds = projectedState.selectedCourses.map(c => String(c.courseId));
      expect(courseIds).toContain("REQ001");
      expect(courseIds).toContain("ELE001");
      expect(courseIds).toContain("GEN001");

      // 科目種別の確認
      const requiredSelected = projectedState.selectedCourses.find(c => String(c.courseId) === "REQ001");
      expect(requiredSelected?.isRequired).toBe(true);
      expect(requiredSelected?.courseType).toBe("required");

      const electiveSelected = projectedState.selectedCourses.find(c => String(c.courseId) === "ELE001");
      expect(electiveSelected?.isRequired).toBe(false);
      expect(electiveSelected?.courseType).toBe("elective");
    }).pipe(
      Effect.provide(TestLayer),
      Effect.runPromise
    )
  );
});