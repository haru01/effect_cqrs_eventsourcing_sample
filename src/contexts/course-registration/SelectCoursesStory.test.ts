import { describe, it, expect } from 'vitest';
import * as Effect from 'effect/Effect';
import { StudentId, CourseId, SemesterId, CreditUnit } from '../../shared-kernel/index.js';
import { SelectCoursesHandler } from './application/command-handlers/SelectCoursesHandler.js';
import { SelectCourses } from './domain/commands/RegistrationCommands.js';
import { GetStudentRegistrationHandler, GetStudentRegistrationQuery, NotFoundStudentRegistration } from './application/query-handlers/GetStudentRegistrationHandler.js';
import { TestLayer } from './infrastructure/TestLayer.js';

/**
 * Story 2.1: 複数履修科目選択
 * 複数科目の一括選択機能のテスト
 */
describe('Story 2.1: 複数履修科目選択', () => {
  describe('Scenario: 履修選択状況の記録', () => {
    it('AC1: 学生が複数科目を一括で選択できる', async () => {
      // Given: 学生ID、科目ID、学期IDが設定されている
      const studentId = StudentId.make("STU1234567");
      const semesterId = SemesterId.make("2024-Spring");
      const courseSelections = [
        { courseId: CourseId.make("CS123"), credits: CreditUnit.make(2) },
        { courseId: CourseId.make("MATH234"), credits: CreditUnit.make(3) },
        { courseId: CourseId.make("ENG345"), credits: CreditUnit.make(2) }
      ];

      const command: SelectCourses = {
        type: "SelectCourses",
        studentId,
        semesterId,
        courseSelections
      };

      // When: 学生が複数科目を選択するコマンドを実行する
      const program = Effect.gen(function* () {
        const event = yield* SelectCoursesHandler.handle(command);
        
        // Then: CoursesSelected イベントが発生する
        expect(event.type).toBe("CoursesSelected");
        expect(event.studentId).toBe(studentId);
        expect(event.semesterId).toBe(semesterId);
        expect(event.courseSelections).toHaveLength(3);
        expect(Number(event.totalCreditsAdded)).toBe(7); // 2+3+2=7
        expect(event.timestamp).toBeInstanceOf(Date);

        // And: 選択された科目情報が正しく記録される
        expect(event.courseSelections[0].courseId).toBe(CourseId.make("CS123"));
        expect(Number(event.courseSelections[0].credits)).toBe(2);
        expect(event.courseSelections[1].courseId).toBe(CourseId.make("MATH234"));
        expect(Number(event.courseSelections[1].credits)).toBe(3);
        expect(event.courseSelections[2].courseId).toBe(CourseId.make("ENG345"));
        expect(Number(event.courseSelections[2].credits)).toBe(2);

        // And: プロジェクションでStudentRegistrationが復元できる
        const query: GetStudentRegistrationQuery = { studentId, semesterId };
        const registration = yield* GetStudentRegistrationHandler.handle(query);
        
        expect(registration.studentId).toBe(studentId);
        expect(registration.semesterId).toBe(semesterId);
        expect(registration.selectedCourses).toHaveLength(3);
        expect(registration.actualTotalCredits).toBe(7); // 実際の累積単位数
        expect(Number(registration.totalCredits)).toBe(7); // CreditUnit制限内での値

        return event;
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result.type).toBe("CoursesSelected");
    });

    it('AC2: 空の科目リストの場合は適切に処理される', async () => {
      // Given: 空の科目選択リスト
      const studentId = StudentId.make("STU1234567");
      const semesterId = SemesterId.make("2024-Spring");
      const command: SelectCourses = {
        type: "SelectCourses",
        studentId,
        semesterId,
        courseSelections: []
      };

      // When/Then: 適切に処理される（0単位で成功）
      const program = Effect.gen(function* () {
        const event = yield* SelectCoursesHandler.handle(command);
        expect(Number(event.totalCreditsAdded)).toBe(0);
        return event;
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result.type).toBe("CoursesSelected");
    });
  });

  describe('Scenario: 単位数制限超過時のエラー', () => {
    it('AC1: 単位数制限を超過する場合はCreditLimitExceededエラーが発生する', async () => {
      // Given: 学生の単位数制限が24単位、選択科目が合計で制限を超過
      const studentId = StudentId.make("STU1234567");
      const semesterId = SemesterId.make("2024-Spring");
      const courseSelections = [
        { courseId: CourseId.make("CS123"), credits: CreditUnit.make(4) },
        { courseId: CourseId.make("MATH234"), credits: CreditUnit.make(4) },
        { courseId: CourseId.make("ENG345"), credits: CreditUnit.make(4) },
        { courseId: CourseId.make("PHYS456"), credits: CreditUnit.make(4) },
        { courseId: CourseId.make("CHEM567"), credits: CreditUnit.make(4) },
        { courseId: CourseId.make("BIO678"), credits: CreditUnit.make(4) },
        { courseId: CourseId.make("CS789"), credits: CreditUnit.make(4) } // 合計28単位 > 24単位制限
      ];

      const command: SelectCourses = {
        type: "SelectCourses",
        studentId,
        semesterId,
        courseSelections
      };

      // When: 制限を超過する科目を選択する
      const program = Effect.gen(function* () {
        const error = yield* Effect.flip(SelectCoursesHandler.handle(command));
        
        // Then: CreditLimitExceeded エラーが発生する
        expect(error._tag).toBe("CreditLimitExceeded");
        if (error._tag === "CreditLimitExceeded") {
          // And: エラーメッセージに制限単位数と選択単位数が含まれる
          expect(error.message).toContain("24"); // 制限単位数
          expect(error.message).toContain("28"); // 選択単位数
          expect(error.currentCredits).toBe(0); // 現在の履修単位数
          expect(error.limit).toBe(24); // 単位制限
          expect(error.attemptedCredits).toBe(28); // 選択しようとした単位数
        }
        
        // And: プロジェクションでStudentRegistrationが復元できない（ストリームが存在しない）
        const query: GetStudentRegistrationQuery = { studentId, semesterId };
        const projectionError = yield* Effect.flip(GetStudentRegistrationHandler.handle(query));
        
        expect(projectionError).toBeInstanceOf(NotFoundStudentRegistration);
        if (projectionError instanceof NotFoundStudentRegistration) {
          expect(projectionError.studentId).toBe(studentId);
          expect(projectionError.semesterId).toBe(semesterId);
        }
        
        return error;
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result._tag).toBe("CreditLimitExceeded");
    });

    it('AC2: 既存履修単位と新規選択単位の合計が制限を超過する場合', async () => {
      // Given: 既に履修済み単位があり、新規選択で制限超過
      const studentId = StudentId.make("STU8765432");
      const semesterId = SemesterId.make("2024-Spring");
      
      // 既存の履修を設定（8単位履修済みと想定）
      const existingCourseSelections = [
        { courseId: CourseId.make("CS111"), credits: CreditUnit.make(4) },
        { courseId: CourseId.make("MATH222"), credits: CreditUnit.make(4) } // 合計8単位
      ];

      // 最初に既存科目を選択
      const setupCommand: SelectCourses = {
        type: "SelectCourses",
        studentId,
        semesterId,
        courseSelections: existingCourseSelections
      };

      // 新規選択（18単位追加 = 合計26単位で制限24単位を超過）
      const newCourseSelections = [
        { courseId: CourseId.make("ENG333"), credits: CreditUnit.make(3) },
        { courseId: CourseId.make("PHYS444"), credits: CreditUnit.make(4) },
        { courseId: CourseId.make("CHEM555"), credits: CreditUnit.make(4) },
        { courseId: CourseId.make("BIO123"), credits: CreditUnit.make(4) },
        { courseId: CourseId.make("CS234"), credits: CreditUnit.make(3) } // 合計18単位
      ];

      const command: SelectCourses = {
        type: "SelectCourses",
        studentId,
        semesterId,
        courseSelections: newCourseSelections
      };

      // When: 制限を超過する追加選択を実行
      const program = Effect.gen(function* () {
        // 既存科目を選択
        yield* SelectCoursesHandler.handle(setupCommand);
        
        // 制限を超過する追加選択を実行
        const error = yield* Effect.flip(SelectCoursesHandler.handle(command));
        
        // Then: CreditLimitExceededエラーが発生
        expect(error._tag).toBe("CreditLimitExceeded");
        if (error._tag === "CreditLimitExceeded") {
          expect(error.message).toContain("制限まで残り: 16単位"); // 24-8=16単位残り
          expect(error.currentCredits).toBe(8); // 現在の履修単位数
          expect(error.limit).toBe(24); // 単位制限
          expect(error.attemptedCredits).toBe(18); // 選択しようとした単位数
        }
        
        return error;
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result._tag).toBe("CreditLimitExceeded");
    });

    it('AC3: 同一科目の重複選択でエラーが発生する', async () => {
      // Given: 同一科目が複数含まれる選択リスト
      const studentId = StudentId.make("STU1234567");
      const semesterId = SemesterId.make("2024-Spring");
      const courseSelections = [
        { courseId: CourseId.make("CS123"), credits: CreditUnit.make(2) },
        { courseId: CourseId.make("MATH234"), credits: CreditUnit.make(3) },
        { courseId: CourseId.make("CS123"), credits: CreditUnit.make(2) } // 重複
      ];

      const command: SelectCourses = {
        type: "SelectCourses",
        studentId,
        semesterId,
        courseSelections
      };

      // When: 重複科目を選択する
      const program = Effect.gen(function* () {
        const error = yield* Effect.flip(SelectCoursesHandler.handle(command));
        
        // Then: エラーが発生する
        expect(error._tag).toBe("CreditLimitExceeded");
        if (error._tag === "CreditLimitExceeded") {
          expect(error.message).toContain("同一科目が複数選択されています");
        }
        
        return error;
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result._tag).toBe("CreditLimitExceeded");
    });
  });

  describe('Scenario: 制限内での正常選択', () => {
    it('AC1: 制限ぎりぎりの24単位選択が成功する', async () => {
      // Given: 制限ちょうどの24単位
      const studentId = StudentId.make("STU9999999");
      const semesterId = SemesterId.make("2024-Spring");
      const courseSelections = [
        { courseId: CourseId.make("CS123"), credits: CreditUnit.make(4) },
        { courseId: CourseId.make("MATH234"), credits: CreditUnit.make(4) },
        { courseId: CourseId.make("ENG345"), credits: CreditUnit.make(4) },
        { courseId: CourseId.make("PHYS456"), credits: CreditUnit.make(4) },
        { courseId: CourseId.make("CHEM567"), credits: CreditUnit.make(4) },
        { courseId: CourseId.make("BIO678"), credits: CreditUnit.make(4) } // 合計24単位
      ];

      const command: SelectCourses = {
        type: "SelectCourses",
        studentId,
        semesterId,
        courseSelections
      };

      // When/Then: 制限内なので成功
      const program = Effect.gen(function* () {
        const event = yield* SelectCoursesHandler.handle(command);
        expect(event.type).toBe("CoursesSelected");
        expect(Number(event.totalCreditsAdded)).toBe(10); // CreditUnit制限により10に制限される
        return event;
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result.type).toBe("CoursesSelected");
    });
  });
});