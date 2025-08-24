# エージェントシステム活用ガイド

## エージェント概要
特化型エージェントによる段階的開発支援システム。一貫した品質とパターンで開発加速。

**主要エージェント**:
1. **domain-expert**: 要件整理・ストーリー作成
2. **designing-committer**: CQRS技術設計・タスク分解
3. **programming-committer**: TDD実装・テスト通過
4. **refactoring-committer**: コード品質向上・技術的負債解消
5. **qa-ing-committer**: テスト戦略・品質検証
6. **retrospecting-committer**: 振り返り・継続改善

## 標準開発フロー
```
domain-expert → designing-committer → programming-committer → [refactoring-committer] → qa-ing-committer
```

**成果物管理**: `.claude/tmp/{story-name}/` にストーリー単位で保存
- `user-story.md` (domain-expert)
- `design-and-tasks.md` (designing-committer)
- `qa-report.md` (qa-ing-committer)

## 品質基準統一

- 全テスト通過、TypeScriptエラー0、カバレッジ90%以上
- Effect-TSパターン強制、AcceptanceTDD必須

## academic-record-agent向け実装ガイドライン

### 🎯 基本方針

**参照コードのパターンを忐実に再現**し、一貫した品質で実装します。

#### ✅ 必須遵守項目

1. **Effect-TS優先**: Promise使用禁止、全てEffect.genで実装
2. **Brand型強制**: 全ての識別子・バリューオブジェクトはBrand型で定義
3. **型安全**: any型禁止、Effect.Effect<Success, Error, Dependencies>完全指定
4. **JSDoc必須**: @param, @returns, @throws, @remarkで完全文書化
5. **イミュータブル**: 全てのドメインオブジェクトは不変性維持
6. **AcceptanceTDD**: Given-When-Thenパターンで段階的実装

### 📋 コマンド実装チェックリスト

#### Step 1: インターフェース定義
```typescript
// ✅ 必須: readonlyでのimmutableコマンド定義
export interface SubmitGradeCommand {
  readonly studentId: StudentId;
  readonly courseId: CourseId;
  readonly grade: Grade;
  readonly submittedBy: InstructorId;
}
```

#### Step 2: JSDoc文書化
```typescript
/**
 * 成績を提出するコマンド
 * @param command - 提出する成績の情報
 * @returns - 提出された成績のID
 * @throws - 学生が存在しない場合
 * @throws - 授業が存在しない場合
 * @throws - 成績が既に提出済みの場合
 * @remark この関数はイベントソーシングパターンで成績提出イベントを生成・保存・発行します
 */
```

#### Step 3: 完全な型注釈
```typescript
export const submitGrade = (
  command: SubmitGradeCommand
): Effect.Effect<
  GradeId,                                          // 成功時の戻り値
  StudentNotFound | CourseNotFound | GradeAlreadyExists | EventStoreError, // エラー型
  StudentRepository | CourseRepository | GradeRepository | EventStore | EventBus // 依存関係
> =>
```

#### Step 4: Effect.gen実装パターン
```typescript
Effect.gen(function* () {
  // 依存関係取得
  const eventStore = yield* EventStore;
  const eventBus = yield* EventBus;
  const { studentId, courseId, grade, submittedBy } = command;

  // ビジネスルール検証
  yield* ensureStudentExists(studentId);
  yield* ensureCourseExists(courseId);
  yield* ensureGradeNotSubmitted(studentId, courseId);

  // イベント生成・保存・発行
  const gradeId = yield* GradeId.create(studentId, courseId);
  const event = createGradeSubmittedEvent(gradeId, studentId, courseId, grade, submittedBy);
  yield* eventStore.appendEvent(gradeId, "Grade", event);
  yield* eventBus.publish(event);

  return gradeId;
});
```

### 📝 テスト実装チェックリスト

#### Step 1: Givenヘルパー関数
```typescript
// ✅ 再利用可能なGivenヘルパー関数
const givenValidStudentCourseAndGrade = () =>
  Effect.gen(function* () {
    const studentId = StudentId.make("S12345678"); // 田中太郎
    const courseId = CourseId.make("CS101");        // コンピュータサイエンス入門
    const grade = Grade.make("A");                  // 優秀な成績
    const instructorId = InstructorId.make("T001"); // 佐藤教授
    return { studentId, courseId, grade, instructorId };
  });

const givenEventCapture = () =>
  Effect.gen(function* () {
    const capturedEvents = yield* Ref.make<DomainEvent[]>([]);
    const eventBus = yield* EventBus;
    yield* eventBus.subscribe((event) =>
      Ref.update(capturedEvents, (events) => [...events, event])
    );
    return capturedEvents;
  });
```

#### Step 2: Given-When-Then構造
```typescript
it("教授が学生の成績を正常に提出できる", () =>
  Effect.gen(function* () {
    // === Given: 有効な学生、授業、成績が準備されている ===
    const { studentId, courseId, grade, instructorId } = yield* givenValidStudentCourseAndGrade();
    const capturedEvents = yield* givenEventCapture();

    // === When: 教授が成績を提出する ===
    const gradeId = yield* submitGrade({ studentId, courseId, grade, submittedBy: instructorId });

    // === Then: 成績が正常に提出される ===
    thenGradeIdFormatIsValid(gradeId);
    yield* thenGradeSubmittedEventIsPublished(capturedEvents, gradeId, studentId, courseId, grade);
    yield* thenGradeCanBeRetrieved(gradeId, studentId, courseId, grade);
  })
    .pipe(Effect.provide(TestLayer))
    .pipe(Effect.runPromise)
);
```

#### Step 3: Effect.flip失敗テスト
```typescript
it("存在しない学生への成績提出を拒否する", () =>
  Effect.gen(function* () {
    // === Given: 存在しない学生IDが指定される ===
    const invalidStudentId = StudentId.make("NONEXISTENT");
    const { courseId, grade, instructorId } = yield* givenValidCourseAndGrade();

    // === When: 存在しない学生に成績提出を試行する ===
    const error = yield* submitGrade({ 
      studentId: invalidStudentId, courseId, grade, submittedBy: instructorId 
    }).pipe(Effect.flip);

    // === Then: StudentNotFoundエラーが発生する ===
    thenStudentNotFoundErrorOccurs(error, invalidStudentId);
  })
    .pipe(Effect.provide(TestLayer))
    .pipe(Effect.runPromise)
);
```

### 🔍 品質チェック項目

#### ✅ 実装品質
1. **コードカバレッジ**: 90%以上必須
2. **TypeScriptエラー**: 0個必須
3. **テスト通過**: 全テスト通過必須
4. **コメント品質**: Given-When-Then境界が明確
5. **パターン一貫性**: 参照コードと同じパターン

#### ⚠️ よくある間違い
1. **Promise使用**: async/await使用禁止
2. **any型**: 型安全性を損なう
3. **直接変更**: オブジェクトのミュータブル操作
4. **JSDoc省略**: ドキュメント不十分
5. **エラーハンドリング**: try-catch使用

### 🚫 禁止事項
- Promise/async/awaitの使用
- any型の使用
- ミュータブルオブジェクトの作成
- try-catchエラーハンドリング
- プリミティブ型の直接使用
- JSDocの省略
- 不完全な型注釈

### 🌟 推奨事項
- Effect.genの積極活用
- Brand型による型安全性向上
- Given-When-Thenパターンの徹底
- カスタムアサーションの積極的作成
- ヘルパー関数の再利用
- イベントソーシングパターンの遵守
- 日本語コメントでのビジネス価値表現

## class-management-agent向け実装ガイドライン

### 🎯 特化方針

**授業管理コンテキスト**に特化した実装パターンで、出席管理、課題管理、試験実施の品質を統一します。

#### ✅ class-management固有の必須項目

1. **時間管理**: 授業時間、出席時刻、課題締切の厳密管理
2. **状態遷移**: ClassSession、Assignmentのライフサイクル管理
3. **リアルタイム性**: 出席状況、課題提出状況の即時更新
4. **バッチ処理**: 複数学生の出席記録一括処理
5. **スケジュール連携**: 授業スケジュールとの整合性

### 📋 授業管理コマンド実装チェックリスト

#### 出席記録コマンド例
```typescript
// ✅ 授業管理特化コマンドインターフェース
export interface RecordAttendanceCommand {
  readonly classSessionId: ClassSessionId;
  readonly studentId: StudentId;
  readonly attendanceStatus: AttendanceStatus;
  readonly recordedAt: Date;
  readonly recordedBy: InstructorId;
}

/**
 * 学生の出席を記録するコマンド
 * @param command - 記録する出席情報
 * @returns - 記録された出席のID
 * @throws - 授業セッションが存在しない場合
 * @throws - 学生が当該授業に登録されていない場合
 * @throws - 出席記録が既に存在する場合
 * @throws - 授業時間外の記録試行の場合
 * @remark 授業開始前30分から終了後30分までのみ記録可能
 */
export const recordAttendance = (
  command: RecordAttendanceCommand
): Effect.Effect<
  AttendanceRecordId,
  ClassSessionNotFound | StudentNotEnrolled | AttendanceAlreadyRecorded | OutsideClassTime | EventStoreError,
  ClassSessionRepository | StudentRepository | AttendanceRepository | EventStore | EventBus
> =>
  Effect.gen(function* () {
    const eventStore = yield* EventStore;
    const eventBus = yield* EventBus;
    const { classSessionId, studentId, attendanceStatus, recordedAt, recordedBy } = command;

    // 授業管理特有のビジネスルール検証
    yield* ensureClassSessionExists(classSessionId);
    yield* ensureStudentEnrolled(classSessionId, studentId);
    yield* ensureAttendanceNotRecorded(classSessionId, studentId);
    yield* ensureWithinClassTime(classSessionId, recordedAt);

    const attendanceId = yield* AttendanceRecordId.create(classSessionId, studentId);
    const event = createAttendanceRecordedEvent(
      attendanceId, classSessionId, studentId, attendanceStatus, recordedAt, recordedBy
    );

    yield* eventStore.appendEvent(attendanceId, "AttendanceRecord", event);
    yield* eventBus.publish(event);

    return attendanceId;
  });
```

#### バッチ処理コマンド例
```typescript
// ✅ 複数学生の一括出席記録
export interface RecordBulkAttendanceCommand {
  readonly classSessionId: ClassSessionId;
  readonly attendanceRecords: readonly {
    readonly studentId: StudentId;
    readonly attendanceStatus: AttendanceStatus;
  }[];
  readonly recordedAt: Date;
  readonly recordedBy: InstructorId;
}

export const recordBulkAttendance = (
  command: RecordBulkAttendanceCommand
): Effect.Effect<
  AttendanceRecordId[],
  ClassSessionNotFound | StudentNotEnrolled | AttendanceAlreadyRecorded | OutsideClassTime | EventStoreError,
  ClassSessionRepository | StudentRepository | AttendanceRepository | EventStore | EventBus
> =>
  Effect.gen(function* () {
    const { classSessionId, attendanceRecords, recordedAt, recordedBy } = command;

    // バッチ処理特有の事前検証
    yield* ensureClassSessionExists(classSessionId);
    yield* ensureWithinClassTime(classSessionId, recordedAt);
    yield* ensureAllStudentsEnrolled(classSessionId, attendanceRecords.map(r => r.studentId));

    // Effect.forEachで並行処理
    const attendanceIds = yield* Effect.forEach(
      attendanceRecords,
      (record) => recordAttendance({
        classSessionId,
        studentId: record.studentId,
        attendanceStatus: record.attendanceStatus,
        recordedAt,
        recordedBy
      }),
      { concurrency: 10 } // 並行数制限
    );

    return attendanceIds;
  });
```

### 📝 授業管理テストパターン

#### 時間関連テスト
```typescript
// ✅ 授業時間管理テストパターン
const givenClassSessionInProgress = () =>
  Effect.gen(function* () {
    const classSessionId = ClassSessionId.make("CS101-2024S-001");
    const startTime = new Date("2024-04-01T09:00:00Z");
    const endTime = new Date("2024-04-01T10:30:00Z");
    const currentTime = new Date("2024-04-01T09:15:00Z"); // 授業中
    return { classSessionId, startTime, endTime, currentTime };
  });

const givenMultipleStudentsEnrolled = () =>
  Effect.gen(function* () {
    const student1Id = StudentId.make("S12345678"); // 田中太郎
    const student2Id = StudentId.make("S87654321"); // 佐藤花子
    const student3Id = StudentId.make("S11111111"); // 鈴木一郎
    return { student1Id, student2Id, student3Id };
  });

it("教授が授業中に複数学生の出席を一括記録できる", () =>
  Effect.gen(function* () {
    // === Given: 授業が進行中で複数学生が登録されている ===
    const { classSessionId, currentTime } = yield* givenClassSessionInProgress();
    const { student1Id, student2Id, student3Id } = yield* givenMultipleStudentsEnrolled();
    const instructorId = InstructorId.make("T001");
    const capturedEvents = yield* givenEventCapture();

    // === When: 教授が複数学生の出席を一括記録する ===
    const attendanceIds = yield* recordBulkAttendance({
      classSessionId,
      attendanceRecords: [
        { studentId: student1Id, attendanceStatus: AttendanceStatus.make("Present") },
        { studentId: student2Id, attendanceStatus: AttendanceStatus.make("Late") },
        { studentId: student3Id, attendanceStatus: AttendanceStatus.make("Absent") }
      ],
      recordedAt: currentTime,
      recordedBy: instructorId
    });

    // === Then: 全ての学生の出席が正常に記録される ===
    thenBulkAttendanceRecordedSuccessfully(attendanceIds, classSessionId);
    yield* thenAttendanceRecordedEventsArePublished(capturedEvents, attendanceIds, 3);
    yield* thenAttendanceCanBeRetrieved(attendanceIds[0], student1Id, "Present");
    yield* thenAttendanceCanBeRetrieved(attendanceIds[1], student2Id, "Late");
    yield* thenAttendanceCanBeRetrieved(attendanceIds[2], student3Id, "Absent");
  })
    .pipe(Effect.provide(TestLayer))
    .pipe(Effect.runPromise)
);
```

#### 時間制約テスト
```typescript
it("授業時間外の出席記録を拒否する", () =>
  Effect.gen(function* () {
    // === Given: 授業終了後1時間経過している ===
    const classSessionId = ClassSessionId.make("CS101-2024S-001");
    const studentId = StudentId.make("S12345678");
    const instructorId = InstructorId.make("T001");
    const tooLateTime = new Date("2024-04-01T11:30:00Z"); // 授業終了後1時間

    // === When: 授業時間外に出席記録を試行する ===
    const error = yield* recordAttendance({
      classSessionId,
      studentId,
      attendanceStatus: AttendanceStatus.make("Present"),
      recordedAt: tooLateTime,
      recordedBy: instructorId
    }).pipe(Effect.flip);

    // === Then: OutsideClassTimeエラーが発生する ===
    thenOutsideClassTimeErrorOccurs(error, classSessionId, tooLateTime);
  })
    .pipe(Effect.provide(TestLayer))
    .pipe(Effect.runPromise)
);
```

### 🕰️ class-management特有の注意点

1. **時間管理精度**: 授業時刻、締切の厳密な管理必須
2. **リアルタイム性**: 出席状況の即時更新サポート
3. **バッチ処理**: Effect.forEachによる効率的な一括処理
4. **状態遷移**: ClassSessionのライフサイクル管理
5. **同期性**: 課題提出、成績評価とのデータ一貫性

## course-registration-agent向け実装ガイドライン

### 🎯 特化方針

**履修登録コンテキスト**に特化した実装パターンで、履修セッション、科目選択、承認フローの品質を統一します。

#### ✅ course-registration固有の必須項目

1. **セッション状態管理**: Draft→Submitted→Approved/Rejectedのライフサイクル
2. **単位計算**: 履修科目の単位数集計、上限チェック
3. **前提科目チェック**: 履修条件、受講要件の検証
4. **時間割重複チェック**: 授業時間の競合検証
5. **承認フロー**: アドバイザー承認のワークフロー管理

### 📋 履修登録コマンド実装チェックリスト

#### 科目追加コマンド例（参照コードベース）
```typescript
// ✅ 履修登録特化コマンドインターフェース
export interface AddCoursesToSessionCommand {
  readonly sessionId: RegistrationSessionId;
  readonly courseIds: readonly CourseId[];
  readonly addedBy: StudentId;
}

/**
 * 履修セッションに科目を追加するコマンド
 * @param command - 追加する科目情報
 * @returns - 更新されたセッションID
 * @throws - セッションが存在しない場合
 * @throws - セッションがDraft状態でない場合
 * @throws - 科目が存在しない場合
 * @throws - 単位数上限を超過する場合
 * @throws - 時間割が重複する場合
 * @throws - 前提科目を満たしていない場合
 * @remark 履修セッションはDraft状態のみ科目追加可能
 */
export const addCoursesToSession = (
  command: AddCoursesToSessionCommand
): Effect.Effect<
  RegistrationSessionId,
  SessionNotFound | SessionNotInDraft | CourseNotFound | CreditLimitExceeded | 
  ScheduleConflict | PrerequisiteNotMet | EventStoreError,
  RegistrationSessionRepository | CourseRepository | StudentRepository | EventStore | EventBus
> =>
  Effect.gen(function* () {
    const eventStore = yield* EventStore;
    const eventBus = yield* EventBus;
    const { sessionId, courseIds, addedBy } = command;

    // 履修登録特有のビジネスルール検証
    const session = yield* ensureSessionExistsAndInDraft(sessionId);
    yield* ensureAllCoursesExist(courseIds);
    yield* ensureCreditLimitNotExceeded(session, courseIds);
    yield* ensureNoScheduleConflicts(session, courseIds);
    yield* ensurePrerequisitesMet(addedBy, courseIds);

    // バリデーション結果を集約したイベント生成
    const validationResults = yield* validateCourseAddition(session, courseIds);
    const event = createCoursesAddedToSessionEvent(
      sessionId, courseIds, addedBy, validationResults
    );

    yield* eventStore.appendEvent(sessionId, "RegistrationSession", event);
    yield* eventBus.publish(event);

    return sessionId;
  });
```

#### セッション提出コマンド例
```typescript
// ✅ 状態遷移コマンドパターン
export interface SubmitRegistrationSessionCommand {
  readonly sessionId: RegistrationSessionId;
  readonly submittedBy: StudentId;
  readonly submissionComment?: string;
}

export const submitRegistrationSession = (
  command: SubmitRegistrationSessionCommand
): Effect.Effect<
  RegistrationSessionId,
  SessionNotFound | SessionNotInDraft | InsufficientCredits | ScheduleConflict | EventStoreError,
  RegistrationSessionRepository | CourseRepository | EventStore | EventBus
> =>
  Effect.gen(function* () {
    const { sessionId, submittedBy, submissionComment } = command;

    // 提出時の最終バリデーション
    const session = yield* ensureSessionExistsAndInDraft(sessionId);
    yield* ensureFinalValidation(session);

    const event = createSessionSubmittedEvent(sessionId, submittedBy, submissionComment);
    
    yield* eventStore.appendEvent(sessionId, "RegistrationSession", event);
    yield* eventBus.publish(event);

    return sessionId;
  });
```

### 📝 履修登録テストパターン

#### 複雑なビジネスルールテスト
```typescript
// ✅ 履修登録特有の複雑テストパターン
const givenStudentWithCourseHistory = () =>
  Effect.gen(function* () {
    const studentId = StudentId.make("S12345678");
    const completedCourseIds = [
      CourseId.make("MATH101"), // 数学基礎（既履修）
      CourseId.make("ENG101")   // 英語基礎（既履修）
    ];
    const availableCredits = 18; // 今学期の履修可能単位数
    return { studentId, completedCourseIds, availableCredits };
  });

const givenCoursesWithPrerequisites = () =>
  Effect.gen(function* () {
    const mathAdvanced = CourseId.make("MATH201"); // 数学応用（前提: MATH101）
    const physicsBasic = CourseId.make("PHYS101");  // 物理基礎（前提: MATH101）
    const programming = CourseId.make("CS101");     // プログラミング基礎（前提なし）
    return { mathAdvanced, physicsBasic, programming };
  });

it("学生が前提科目を満たした科目を正常に追加できる", () =>
  Effect.gen(function* () {
    // === Given: 学生が必要な前提科目を既に履修済み ===
    const { studentId, completedCourseIds, availableCredits } = yield* givenStudentWithCourseHistory();
    const { mathAdvanced, physicsBasic, programming } = yield* givenCoursesWithPrerequisites();
    const sessionId = yield* givenRegistrationSessionInDraft(studentId);
    const capturedEvents = yield* givenEventCapture();

    // === When: 前提科目を満たした科目を追加する ===
    const updatedSessionId = yield* addCoursesToSession({
      sessionId,
      courseIds: [mathAdvanced, physicsBasic, programming], // 合計14単位
      addedBy: studentId
    });

    // === Then: 全ての科目が正常に追加される ===
    thenSessionUpdatedSuccessfully(updatedSessionId, sessionId);
    yield* thenCoursesAddedEventIsPublished(capturedEvents, sessionId, [mathAdvanced, physicsBasic, programming]);
    yield* thenSessionContainsCourses(sessionId, [mathAdvanced, physicsBasic, programming]);
    yield* thenSessionTotalCreditsUpdated(sessionId, 14);
  })
    .pipe(Effect.provide(TestLayer))
    .pipe(Effect.runPromise)
);
```

#### 状態遷移テスト
```typescript
it("学生が必要数以上の科目を追加後にセッションを提出できる", () =>
  Effect.gen(function* () {
    // === Given: 履修セッションに12単位以上の科目が追加済み ===
    const { studentId } = yield* givenValidStudentAndTerm();
    const sessionId = yield* givenRegistrationSessionWithSufficientCredits(studentId, 15);
    const capturedEvents = yield* givenEventCapture();

    // === When: 学生がセッションを提出する ===
    const submittedSessionId = yield* submitRegistrationSession({
      sessionId,
      submittedBy: studentId,
      submissionComment: "履修計画を提出します。よろしくお願いします。"
    });

    // === Then: セッションが正常に提出状態に遷移する ===
    thenSessionSubmittedSuccessfully(submittedSessionId, sessionId);
    yield* thenSessionSubmittedEventIsPublished(capturedEvents, sessionId, studentId);
    yield* thenSessionStatusIsSubmitted(sessionId);
    yield* thenSessionIsReadOnly(sessionId); // 提出後は編集不可
  })
    .pipe(Effect.provide(TestLayer))
    .pipe(Effect.runPromise)
);
```

### 📚 course-registration特有の注意点

1. **履修ルール管理**: 単位上限、前提科目、時間割競合の総合的検証
2. **状態遷移管理**: Draft→Submitted→Approved/Rejectedの厳密管理
3. **バリデーションロジック**: 複数のビジネスルールの組み合わせ検証
4. **データ一貫性**: 科目情報、学生情報との同期性確保
5. **承認フロー**: アドバイザー承認のワークフロー管理

## 共通実装パターン

### ✅ 全エージェント共通の必須項目

1. **Effect.gen必須**: 非同期処理は全てEffect.genで実装
2. **Brand型統一**: 識別子・バリューオブジェクトは必ずBrand型
3. **JSDoc必須**: @param, @returns, @throws, @remarkで完全文書化
4. **型注釈完全**: Effect.Effect<Success, Error, Dependencies>の完全指定
5. **イミュータブル**: readonly修飾子での不変性維持
6. **Given-When-Then**: テストは必ずこのパターンで実装

### 🚨 特に注意が必要な禁止事項

- **Promise/async/await**: 絶対使用禁止
- **any型**: 型安全性を損なうため禁止
- **ミュータブル操作**: 状態の直接変更禁止
- **try-catch**: Effectのエラーハンドリング使用
- **プリミティブ型**: string, numberの直接使用禁止

### 🎆 品質目標

- **カバレッジ**: 90%以上必達
- **TypeScriptエラー**: 0個必達
- **テスト通過率**: 100%必達
- **コード品質**: 参照コードと同等レベル
- **パターン一貫性**: プロジェクト全体で統一