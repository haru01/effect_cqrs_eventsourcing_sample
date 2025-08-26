# 履修管理 (Course Registration Context)

## ドメインイベント・コマンド・エラー

### 📌 RegistrationPeriodStarted / 履修登録期間開始された
履修登録期間が正式に開始され、学生が科目選択を行えるようになったことを表すイベント。
- **トリガーコマンド**: `StartRegistrationPeriod` / 履修登録期間を開始する
- **発生しうるドメインエラー**:
  - `PreviousSemesterNotEnded` / 前学期が終了していない
  - `RegistrationPeriodAlreadyStarted` / 既に登録期間が開始済み

### 📌 CoursesSelected / 履修科目群選択された
学生が複数の科目を一括して履修対象として選択したことを表すイベント。時間割や単位数の制約をクリアした複数科目の選択を記録。
- **トリガーコマンド**: `SelectCourses` / 複数履修科目を選択する
- **発生しうるドメインエラー**:
  - `OutsideRegistrationPeriod` / 履修登録期間外
  - `ScheduleConflictDetected` / 科目間で時間割が重複
  - `CreditLimitExceeded` / 合計単位数が履修上限を超過
  - `PrerequisiteNotMet` / いずれかの科目で前提科目未履修
  - `DuplicateCoursesInSelection` / 同一科目の重複選択
  - `SomeCoursesCapacityFull` / 一部科目で定員満了

### 📌 RegistrationSubmitted / 履修登録提出された
学生が選択した科目セットを正式に履修登録として提出したことを表すイベント。必修科目や最低単位数の要件を満たした状態での提出を記録。
- **トリガーコマンド**: `SubmitRegistration` / 履修登録を提出する
- **発生しうるドメインエラー**:
  - `NoCourseSelected` / 選択科目が空
  - `RequiredCourseMissing` / 必修科目が不足
  - `BelowMinimumCredits` / 最低履修単位未満

### 📌 RegistrationConfirmed / 履修登録確定された
提出された履修登録が教務システムによって正式に承認・確定されたことを表すイベント。このイベント以降、学生は授業に正式に参加可能となる。
- **トリガーコマンド**: `ApproveRegistration` / 履修登録を承認する
- **発生しうるドメインエラー**:
  - `RegistrationNotSubmitted` / 提出されていない登録
  - `CourseCapacityExceeded` / 科目定員超過
  - `InsufficientPermission` / 承認権限なし

### 📌 CourseDropped / 履修取消された
確定した履修登録から特定の科目が正式に取り消されたことを表すイベント。取消期限内での正当な手続きによる履修変更を記録。
- **トリガーコマンド**: `DropCourse` / 履修を取り消す
- **発生しうるドメインエラー**:
  - `OutsideDropPeriod` / 履修変更期間外
  - `CannotDropRequiredCourse` / 必修科目は取消不可
  - `BelowMinimumCreditsAfterDrop` / 最低履修単位を下回る

## 集約 (Aggregates)

### StudentRegistration（集約ルート）
```typescript
StudentRegistration {
  studentId: StudentId           // 学生識別子
  semesterId: SemesterId        // 対象学期
  selectedCourses: SelectedCourse[]  // 選択科目リスト
  registrationStatus: RegistrationStatus  // 履修ステータス（このコンテキスト固有）
  totalCredits: CreditUnit      // 合計単位数
  submittedAt?: Date           // 提出日時
  confirmedAt?: Date           // 確定日時
}

SelectedCourse {
  courseId: CourseId
  credits: CreditUnit
  courseType: CourseType        // このコンテキスト固有の列挙型
  isRequired: boolean
}

// 履修管理コンテキスト固有の列挙型
enum RegistrationStatus {
  Draft = "draft",
  Submitted = "submitted",
  Confirmed = "confirmed",
  Dropped = "dropped"
}

enum CourseType {
  Required = "required",
  Elective = "elective",
  General = "general"
}
```

### RegistrationPeriod（集約ルート）
```typescript
RegistrationPeriod {
  semesterId: SemesterId        // 対象学期
  startDate: Date              // 登録開始日
  endDate: Date                // 登録終了日
  dropDeadline: Date           // 履修取消期限
  status: PeriodStatus         // 期間ステータス（Active, Closed, Suspended）
}
```

## リードモデル (Read Models)
- **StudentRegistrationView** - 学生の履修登録状況ビュー
- **CourseEnrollmentSummary** - 科目別履修者数集計
- **RegistrationStatistics** - 履修登録統計

## 実装例

### Story 2.1: 複数履修科目選択の実装

#### Pure Event Sourcing アプローチ

本システムでは Pure Event Sourcing を採用しており、集約は状態を保持せずイベントのみを生成します。複数科目の一括選択に対応し、科目間の整合性チェックも実装します。

```typescript
// SelectCoursesHandler.ts - 複数科目選択コマンドハンドラー実装例
export const SelectCoursesHandler = {
  handle: ({ studentId, semesterId, courseSelections }: SelectCoursesCommand): 
    Effect.Effect<CoursesSelected, ScheduleConflictDetected | CreditLimitExceeded | DuplicateCoursesInSelection | CourseAlreadySelected> => {
    
    return Effect.gen(function* () {
      // 現在の履修状態を取得（Effect.orElse パターン使用）
      const currentState = yield* GetStudentRegistrationHandler.handle({
        studentId,
        semesterId
      }).pipe(
        Effect.orElse(() => {
          // 履修登録が存在しない場合は初期状態を作成
          const initialState = StudentRegistration.make(studentId, semesterId);
          return Effect.succeed({
            ...initialState,
            actualTotalCredits: 0,
            selectedCourses: []
          });
        })
      );

      // ビジネスルール1: 重複チェック
      const duplicates = courseSelections.filter(selection => 
        courseSelections.filter(s => s.courseId.value === selection.courseId.value).length > 1
      );
      if (duplicates.length > 0) {
        return yield* Effect.fail(new DuplicateCoursesInSelection(
          `同一科目の重複選択: ${duplicates.map(d => d.courseId.value).join(', ')}`
        ));
      }

      // ビジネスルール2: 既選択科目との重複チェック
      const alreadySelected = courseSelections.filter(selection =>
        currentState.selectedCourses.some(existing => existing.courseId.value === selection.courseId.value)
      );
      if (alreadySelected.length > 0) {
        return yield* Effect.fail(new CourseAlreadySelected(
          `既に選択済みの科目: ${alreadySelected.map(s => s.courseId.value).join(', ')}`
        ));
      }

      // ビジネスルール3: 単位上限チェック（24単位）
      const totalNewCredits = courseSelections.reduce((sum, selection) => sum + selection.credits, 0);
      const newTotalCredits = currentState.actualTotalCredits + totalNewCredits;
      if (newTotalCredits > 24) {
        return yield* Effect.fail(new CreditLimitExceeded(
          `履修上限を超過: 現在${currentState.actualTotalCredits}単位 + 追加${totalNewCredits}単位 = ${newTotalCredits}単位 > 24単位`
        ));
      }

      // ビジネスルール4: 時間割重複チェック（簡略化実装例）
      const scheduleConflicts = yield* checkScheduleConflicts(courseSelections);
      if (scheduleConflicts.length > 0) {
        return yield* Effect.fail(new ScheduleConflictDetected(
          `時間割重複: ${scheduleConflicts.map(c => `${c.course1} と ${c.course2}`).join(', ')}`
        ));
      }

      // イベント生成（状態は保持しない）
      const coursesSelected = new CoursesSelected({
        studentId,
        semesterId,
        courseSelections: courseSelections.map(selection => ({
          courseId: selection.courseId,
          credits: selection.credits,
          courseType: selection.courseType,
          isRequired: selection.isRequired
        })),
        totalCreditsAdded: totalNewCredits,
        occurredAt: new Date()
      });

      // EventStore への永続化
      yield* EventStore.append(
        `student-registration-${studentId.value}`,
        coursesSelected,
        'CoursesSelected'
      );

      return coursesSelected;
    });
  }
};
```

#### クエリハンドラーによる状態再構築

```typescript
// GetStudentRegistrationHandler.ts - イベントからの状態再構築
export const GetStudentRegistrationHandler = {
  handle: ({ studentId, semesterId }: GetStudentRegistrationQuery): 
    Effect.Effect<StudentRegistrationView, NotFound> => {
    
    return Effect.gen(function* () {
      const streamId = `student-registration-${studentId.value}`;
      const events = yield* EventStore.getEvents(streamId);
      
      if (events.length === 0) {
        return yield* Effect.fail(new NotFound('履修登録が見つかりません'));
      }
      
      // イベントから状態を再構築
      let actualTotalCredits = 0;
      const selectedCourses: any[] = [];
      
      for (const event of events) {
        if (event.type === 'CoursesSelected') {
          // 複数科目選択
          const payload = event.payload as CoursesSelected;
          payload.courseSelections.forEach(selection => {
            actualTotalCredits += selection.credits;
            selectedCourses.push({
              courseId: selection.courseId,
              credits: selection.credits,
              courseType: selection.courseType,
              isRequired: selection.isRequired
            });
          });
        }
      }
      
      return {
        studentId,
        semesterId,
        selectedCourses,
        actualTotalCredits,
        registrationStatus: 'draft'
      };
    });
  }
};
```

#### AcceptanceTDD テスト実装パターン

```typescript
describe('Story 2.1: 複数履修科目選択', () => {
  // テストヘルパー関数
  const whenCoursesAreSelected = (command: SelectCoursesCommand) =>
    SelectCoursesHandler.handle(command);
    
  const whenCourseSelectionFails = (command: SelectCoursesCommand) =>
    Effect.flip(SelectCoursesHandler.handle(command));
    
  const getCurrentRegistrationState = (studentId: StudentId, semesterId: SemesterId) =>
    GetStudentRegistrationHandler.handle({ studentId, semesterId });

  it('AC1: 学生が複数の履修可能な科目を一括選択できる', async () => {
    // Given: 学生と複数の対象科目
    const studentId = StudentId.make("STUD001");
    const semesterId = SemesterId.make("2024-S1");
    const courseSelections = [
      { courseId: CourseId.make("CS101"), credits: 4, courseType: "required", isRequired: true },
      { courseId: CourseId.make("MATH201"), credits: 3, courseType: "elective", isRequired: false },
      { courseId: CourseId.make("PHYS101"), credits: 2, courseType: "general", isRequired: false }
    ];
    
    // When: 複数科目選択を実行
    const result = await Effect.runPromise(whenCoursesAreSelected({
      studentId,
      semesterId, 
      courseSelections
    }));
    
    // Then: 複数科目選択イベントが正常に生成される
    expect(result.studentId).toBe(studentId);
    expect(result.courseSelections).toHaveLength(3);
    expect(result.totalCreditsAdded).toBe(9);
  });

  it('AC2: 同一科目の重複選択はエラーとなる', async () => {
    // Given: 重複する科目を含む選択リスト
    const studentId = StudentId.make("STUD002");
    const semesterId = SemesterId.make("2024-S1");
    const courseSelections = [
      { courseId: CourseId.make("CS101"), credits: 4, courseType: "required", isRequired: true },
      { courseId: CourseId.make("CS101"), credits: 4, courseType: "required", isRequired: true }  // 重複
    ];
    
    // When: 重複科目選択を実行
    const result = await Effect.runPromise(whenCourseSelectionFails({
      studentId, semesterId, courseSelections
    }));
    
    // Then: 重複選択エラーが発生
    expect(result).toBeInstanceOf(DuplicateCoursesInSelection);
    expect(result.message).toContain('同一科目の重複選択');
  });

  it('AC3: 単位上限を超過する複数科目選択はエラーとなる', async () => {
    // Given: 既に履修済みの学生と大量単位の科目選択
    const studentId = StudentId.make("STUD003");
    const semesterId = SemesterId.make("2024-S1");
    
    // 事前に15単位分の科目を選択
    await Effect.runPromise(whenCoursesAreSelected({
      studentId, semesterId,
      courseSelections: [
        { courseId: CourseId.make("CS201"), credits: 15, courseType: "required", isRequired: true }
      ]
    }));
    
    // When: 追加で12単位の複数科目を選択（合計27単位 > 24単位制限）
    const courseSelections = [
      { courseId: CourseId.make("CS301"), credits: 6, courseType: "elective", isRequired: false },
      { courseId: CourseId.make("CS302"), credits: 6, courseType: "elective", isRequired: false }
    ];
    const result = await Effect.runPromise(whenCourseSelectionFails({
      studentId, semesterId, courseSelections
    }));
    
    // Then: 単位上限超過エラーが発生
    expect(result).toBeInstanceOf(CreditLimitExceeded);
    expect(result.message).toContain('履修上限を超過');
  });

  it('AC4: 時間割重複のある複数科目選択はエラーとなる', async () => {
    // Given: 時間割が重複する科目群
    const studentId = StudentId.make("STUD004");
    const semesterId = SemesterId.make("2024-S1");
    const courseSelections = [
      { courseId: CourseId.make("CS401"), credits: 3, courseType: "elective", isRequired: false },
      { courseId: CourseId.make("MATH401"), credits: 3, courseType: "elective", isRequired: false }  // CS401と同時間帯
    ];
    
    // When: 時間割重複のある科目選択を実行
    const result = await Effect.runPromise(whenCourseSelectionFails({
      studentId, semesterId, courseSelections
    }));
    
    // Then: 時間割重複エラーが発生
    expect(result).toBeInstanceOf(ScheduleConflictDetected);
    expect(result.message).toContain('時間割重複');
  });
});
```

### 主要な実装パターン

#### 1. Effect.orElse による優雅なエラーハンドリング

```typescript
GetStudentRegistrationHandler.handle({ studentId, semesterId }).pipe(
  Effect.orElse(() => {
    // 履修登録未存在時の初期状態作成
    const initialState = StudentRegistration.make(studentId, semesterId);
    return Effect.succeed({ ...initialState, actualTotalCredits: 0 });
  })
);
```

#### 2. EventStore での streamId と aggregateId の分離

```typescript
// streamId: 永続化用の物理キー
const streamId = `student-registration-${studentId.value}`;

// aggregateId: ドメイン論理キー（イベント内で使用）
const courseSelected = new CourseSelected({
  studentId, // aggregateId として機能
  // ... other fields
});

yield* EventStore.append(streamId, courseSelected, 'CourseSelected');
```

#### 3. vitestアサーションによるテスト品質向上

```typescript
expect(result.actualTotalCredits).toBe(24);
expect(error).toBeInstanceOf(CreditLimitExceeded);
expect(selectedCourses).toHaveLength(3);
```