import { describe, it } from 'vitest';
import * as Effect from 'effect/Effect';
import { StudentId, CourseId, SemesterId, CreditUnit } from '@shared/index.js';
import { CourseType } from './domain/value-objects/index.js';
import { CreditLimitExceeded } from './domain/errors/DomainErrors.js';
import { SelectCourseHandler } from './application/command-handlers/SelectCourseHandler.js';
import { GetStudentRegistrationHandler, NotFoundStudentRegistration } from './application/query-handlers/GetStudentRegistrationHandler.js';
import { CourseSelected } from './domain/events/CourseSelected.js';
import { TestLayer } from './infrastructure/TestLayer.js';

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
      const credits = CreditUnit.make(2);
      
      const command = {
        studentId,
        semesterId, 
        courseId,
        credits,
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
      if (currentState.selectedCourses.length !== 1) {
        yield* Effect.fail(new Error(`Expected 1 course, got ${currentState.selectedCourses.length}`));
      }
      
      if (Number(currentState.totalCredits) !== 2) {
        yield* Effect.fail(new Error(`Expected 2 credits, got ${currentState.totalCredits}`));
      }
      
      // 選択された科目の詳細を確認
      const selectedCourse = currentState.selectedCourses[0];
      if (selectedCourse.courseId !== courseId) {
        yield* Effect.fail(new Error(`Expected courseId ${courseId}, got ${selectedCourse.courseId}`));
      }
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
      yield* SelectCourseHandler.handle(command1);
      yield* SelectCourseHandler.handle(command2);
      yield* SelectCourseHandler.handle(command3);
      
      // 現在の状態を確認（22単位になっているはず）
      const stateBeforeOverflow = yield* GetStudentRegistrationHandler.handle({
        studentId,
        semesterId
      });
      
      // 累積計算で22単位になっているはず（10 + 10 + 2）
      // 実際の累積単位数で確認（10 + 10 + 2 = 22単位）
      if (stateBeforeOverflow.actualTotalCredits !== 22) {
        yield* Effect.fail(new Error(`Expected 22 actual credits, got ${stateBeforeOverflow.actualTotalCredits}`));
      }
      
      // When: 制限を超過する科目（3単位）を追加選択
      const overflowCommand = {
        studentId,
        semesterId,
        courseId: CourseId.make("CS5674"),
        credits: CreditUnit.make(3),
        courseType: CourseType.Value.Elective,
        isRequired: false
      };
      
      const result = yield* Effect.either(
        SelectCourseHandler.handle(overflowCommand)
      );
      
      // Then: CreditLimitExceededエラーが発生する
      if (result._tag !== "Left") {
        yield* Effect.fail(new Error("Expected CreditLimitExceeded error, but command succeeded"));
      }
      
      const error = result._tag === "Left" ? result.left : null;
      if (!(error instanceof CreditLimitExceeded)) {
        yield* Effect.fail(new Error(`Expected CreditLimitExceeded, got ${error.constructor.name}`));
      }
      
      // And: 失敗後の状態は変わっていない（22単位のまま）
      const stateAfterFailure = yield* GetStudentRegistrationHandler.handle({
        studentId,
        semesterId
      });
      
      if (stateAfterFailure.selectedCourses.length !== 3) {
        yield* Effect.fail(new Error(`Expected 3 courses, got ${stateAfterFailure.selectedCourses.length}`));
      }
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
      
      yield* SelectCourseHandler.handle(command1);
      yield* SelectCourseHandler.handle(command2);
      
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
      const result = yield* Effect.either(
        SelectCourseHandler.handle(boundaryCommand)
      );
      
      // Then: 成功することを確認
      if (result._tag !== "Right") {
        yield* Effect.fail(new Error(`Expected success at boundary (24 credits), got error: ${result.left}`));
      }
      
      if (result._tag === "Right") {
        const event = result.right;
        yield* thenCourseSelectedEventIsPublished(event, studentId, boundaryCommand.courseId);
      } else {
        yield* Effect.fail(new Error("Failed to get event from result"));
      }
      
      // And: 最終的に3つの科目が登録されていることを確認
      const finalState = yield* GetStudentRegistrationHandler.handle({
        studentId,
        semesterId
      });
      
      if (finalState.selectedCourses.length !== 3) {
        yield* Effect.fail(new Error(`Expected 3 courses, got ${finalState.selectedCourses.length}`));
      }
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
      
      yield* SelectCourseHandler.handle(command1);
      yield* SelectCourseHandler.handle(command2);
      yield* SelectCourseHandler.handle(command3);
      
      // When: 2単位の科目を追加選択（合計25単位 > 24単位制限）
      const overflowCommand = {
        studentId,
        semesterId,
        courseId: CourseId.make("CS8004"),
        credits: CreditUnit.make(2),
        courseType: CourseType.Value.Elective,
        isRequired: false
      };
      
      const result = yield* Effect.either(
        SelectCourseHandler.handle(overflowCommand)
      );
      
      // Then: CreditLimitExceeded エラーが発生する
      if (result._tag !== "Left") {
        yield* Effect.fail(new Error("Expected CreditLimitExceeded error, but command succeeded"));
      }
      
      if (result._tag === "Left") {
        const error = result.left;
        if (!(error instanceof CreditLimitExceeded)) {
          yield* Effect.fail(new Error(`Expected CreditLimitExceeded, got ${error?.constructor.name}`));
        }
      } else {
        yield* Effect.fail(new Error("Expected error but got success"));
      }
      
      // And: 失敗後の状態は変わっていない（3つの科目のまま）
      const stateAfterFailure = yield* GetStudentRegistrationHandler.handle({
        studentId,
        semesterId
      });
      
      if (stateAfterFailure.selectedCourses.length !== 3) {
        yield* Effect.fail(new Error(`Expected 3 courses after failure, got ${stateAfterFailure.selectedCourses.length}`));
      }
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
      const result = yield* Effect.either(
        GetStudentRegistrationHandler.handle({
          studentId: nonExistentStudentId,
          semesterId
        })
      );
      
      // Then: NotFoundStudentRegistration エラーが発生する
      if (result._tag !== "Left") {
        yield* Effect.fail(new Error("Expected NotFoundStudentRegistration error, but query succeeded"));
      }
      
      if (result._tag === "Left") {
        const error = result.left;
        if (!(error instanceof NotFoundStudentRegistration)) {
          yield* Effect.fail(new Error(`Expected NotFoundStudentRegistration, got ${error?.constructor.name}`));
        }
        
        // エラーメッセージに学生IDと学期IDが含まれることを確認
        if (!error.message.includes(nonExistentStudentId) || !error.message.includes(semesterId)) {
          yield* Effect.fail(new Error(`Error message should contain student and semester IDs: ${error.message}`));
        }
      }
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
      if (projectedState.selectedCourses.length !== 3) {
        yield* Effect.fail(new Error(`Expected 3 courses, got ${projectedState.selectedCourses.length}`));
      }
      
      // 各科目の詳細確認
      const courseIds = projectedState.selectedCourses.map(c => String(c.courseId));
      if (!courseIds.includes("REQ001") || !courseIds.includes("ELE001") || !courseIds.includes("GEN001")) {
        yield* Effect.fail(new Error(`Missing expected courses in projection: ${courseIds.join(", ")}`));
      }
      
      // 科目種別の確認
      const requiredSelected = projectedState.selectedCourses.find(c => String(c.courseId) === "REQ001");
      if (!requiredSelected?.isRequired || requiredSelected.courseType !== "required") {
        yield* Effect.fail(new Error("Required course properties not correctly projected"));
      }
      
      const electiveSelected = projectedState.selectedCourses.find(c => String(c.courseId) === "ELE001");
      if (electiveSelected?.isRequired || electiveSelected?.courseType !== "elective") {
        yield* Effect.fail(new Error("Elective course properties not correctly projected"));
      }
    }).pipe(
      Effect.provide(TestLayer),
      Effect.runPromise
    )
  );
});

// テスト用アサーション関数
const thenCourseSelectedEventIsPublished = (
  event: CourseSelected,
  studentId: StudentId,
  courseId: CourseId
): Effect.Effect<void, Error> => Effect.gen(function* () {
  if (event.studentId !== studentId) {
    yield* Effect.fail(new Error(`Expected studentId ${studentId}, got ${event.studentId}`));
  }
  if (event.courseId !== courseId) {
    yield* Effect.fail(new Error(`Expected courseId ${courseId}, got ${event.courseId}`));
  }
  // イベントが正常に生成されていることを確認
  if (!event.timestamp || !(event.timestamp instanceof Date)) {
    yield* Effect.fail(new Error("Event timestamp is missing or invalid"));
  }
});