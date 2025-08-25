# テストガイド

## テスト品質基準（必須遵守）

### Effect.flipパターンによる失敗テスト

```typescript
// 標準的な失敗テストパターン
it("AC2: 同一学生・学期での重複セッション作成を防止する", () =>
  Effect.gen(function* () {
    // Given: 既存セッションが存在する状況
    const { studentId, term } = yield* givenValidStudentAndTerm();
    const firstSessionId = yield* createRegistrationSession({ studentId, term });

    // When: 同じ条件で再度セッション作成を試行（失敗が期待される）
    const error = yield* createRegistrationSession({ studentId, term }).pipe(
      Effect.flip // 失敗をSuccessに変換して捕捉
    );

    // Then: 期待されるエラーの詳細検証
    thenDuplicateSessionErrorOccurs(error, firstSessionId);
  })
    .pipe(Effect.provide(TestLayer))
    .pipe(Effect.runPromise)
);
```

### TestLayer構成の標準パターン
```typescript
// ✅ 標準的なTestLayer構成
const TestLayer = Layer.mergeAll(
  InMemoryEventStore,                    // イベントストア
  InMemoryEventBus,                      // イベントバス
  InMemoryRegistrationSessionRepository.pipe(  // リポジトリ
    Layer.provide(Layer.mergeAll(InMemoryEventStore, InMemoryEventBus))
  )
);

// インメモリ実装による高速テスト実行
// 実際のDB/外部サービスへの依存を排除
// Effect-TSのLayer合成による依存性注入
```

### カスタムアサーション活用の必須パターン
```typescript
// ✅ カスタムアサーション使用（推奨）
yield* thenRegistrationSessionCreatedEventIsPublished(
  capturedEvents, sessionId, studentId, term
);
yield* thenRegistrationSessionCanBeRetrieved(sessionId, studentId, term);

// ❌ 直接アサーション（非推奨）
const events = yield* Ref.get(capturedEvents);
expect(events).toHaveLength(1);
expect(events[0]._tag).toBe("RegistrationSessionCreated");
// 詳細検証が冗長になり、再利用性が低い
```

### 日本語テスト名の命名基準

```typescript
// ビジネス価値を表現する日本語名
describe("ストーリー1: 履修登録セッション開始", () => {
  it("学生が新学期の履修計画を開始する", () => { ... });
  it("同一学生・学期での重複セッション作成を防止する", () => { ... });
  it("複数学生の並行履修計画をサポートする", () => { ... });
});

```

## テスト規約（プロトタイプフェーズ）

1. **AcceptanceTDD優先**: 段階的受け入れテスト実装最優先
2. **カスタムアサーション必須**: 複雑な検証ロジックは再利用可能な関数化
3. **Effect.flip活用**: 失敗テストは必ずEffect.flipパターンを使用
4. **日本語命名**: テスト名は日本語でビジネス価値を表現
5. **TestLayer統一**: 標準的なLayer構成パターンを使用
6. **統合テスト保留**: プロトタイプフェーズでは受け入れテストで代替
7. **90%+カバレッジ**: 品質基準の維持必須
8. **ROI重視**: 投資対効果を考慮したテスト実装判断
9. **コメント活用**: Given-When-Thenの境界を明確にするコメント必須
10. **ヘルパー関数**: 再利用可能なGiven/Thenヘルパー関数の積極的活用

## テストコード改善パターン

### テストヘルパー関数パターン

テストコードの可読性と再利用性を高めるための標準的なヘルパー関数命名規則：

```typescript
// ✅ whenX: アクション実行を表現
const whenCourseIsSelected = (command: any) => 
  SelectCourseHandler.handle(command);

const whenRegistrationIsSubmitted = (command: any) =>
  SubmitRegistrationHandler.handle(command);

// ✅ whenXFails: 失敗を期待するアクション
const whenCourseSelectionFails = (command: any) =>
  Effect.flip(SelectCourseHandler.handle(command));

const whenSubmissionFails = (command: any) =>
  Effect.flip(SubmitRegistrationHandler.handle(command));

// ✅ getCurrentX: 状態取得を表現
const getCurrentRegistrationState = (
  studentId: StudentId,
  semesterId: SemesterId
) => GetStudentRegistrationHandler.handle({ studentId, semesterId });

// ✅ thenX: 結果検証を表現
const thenStudentHasSelectedCourses = (
  state: any,
  expectedCount: number
) => {
  expect(state.selectedCourses).toHaveLength(expectedCount);
};

const thenStudentHasTotalCredits = (
  state: any,
  expectedCredits: number
) => {
  expect(Number(state.totalCredits)).toBe(expectedCredits);
};
```

### vitestアサーションへの移行パターン

```typescript
// ❌ 旧: 手動のEffect.fail
it("テスト", () =>
  Effect.gen(function* () {
    const state = yield* getState();
    if (state.courses.length !== 3) {
      yield* Effect.fail(new Error(`Expected 3, got ${state.courses.length}`));
    }
    if (!(error instanceof DomainError)) {
      yield* Effect.fail(new Error(`Expected DomainError, got ${error.constructor.name}`));
    }
  })
);

// ✅ 新: vitestアサーション
it("テスト", () =>
  Effect.gen(function* () {
    const state = yield* getState();
    expect(state.courses).toHaveLength(3);
    expect(error).toBeInstanceOf(DomainError);
  })
);
```

### エラーテストの簡略化パターン

```typescript
// ❌ 旧: Effect.either + タグチェック
const result = yield* Effect.either(
  SelectCourseHandler.handle(command)
);
if (result._tag === "Left") {
  const error = result.left;
  if (!(error instanceof CreditLimitExceeded)) {
    yield* Effect.fail(new Error("Unexpected error type"));
  }
}

// ✅ 新: Effect.flip + vitestアサーション
const error = yield* whenCourseSelectionFails(command);
expect(error).toBeInstanceOf(CreditLimitExceeded);
```

### 実践例：リファクタリング前後の比較

```typescript
// ❌ リファクタリング前
it("AC2: 単位数制限超過", () =>
  Effect.gen(function* () {
    // セットアップ
    yield* SelectCourseHandler.handle(command1);
    yield* SelectCourseHandler.handle(command2);
    
    // エラーチェック
    const result = yield* Effect.either(
      SelectCourseHandler.handle(overflowCommand)
    );
    
    if (result._tag !== "Left") {
      yield* Effect.fail(new Error("Expected error"));
    }
    
    // 状態確認
    const state = yield* GetStudentRegistrationHandler.handle({
      studentId, semesterId
    });
    
    if (state.selectedCourses.length !== 2) {
      yield* Effect.fail(new Error("Course count mismatch"));
    }
  })
);

// ✅ リファクタリング後
it("AC2: 単位数制限超過", () =>
  Effect.gen(function* () {
    // Given: 既存科目を選択
    yield* whenCourseIsSelected(command1);
    yield* whenCourseIsSelected(command2);
    
    // When: 制限超過する科目を選択
    const error = yield* whenCourseSelectionFails(overflowCommand);
    
    // Then: エラーと状態を検証
    expect(error).toBeInstanceOf(CreditLimitExceeded);
    
    const state = yield* getCurrentRegistrationState(studentId, semesterId);
    thenStudentHasSelectedCourses(state, 2);
  })
);
```

## アーキテクチャパターン

### ドメイン層
```typescript
// ❌ 悪い例: プリミティブ値使用
function createSession(studentId: string, term: string) { ... }

// ✅ 良い例: Brand型使用
function createSession(studentId: StudentId, term: Term) { ... }

// ❌ 悪い例: ドメインロジックがアプリケーション層に漏れる
// application layer
const event = new RegistrationSessionCreated({ ... });

// ✅ 良い例: ドメインロジックはドメイン層に
// domain layer
export const createRegistrationSession = (...) => new RegistrationSessionCreated({ ... });
// application layer
const event = createRegistrationSession(...);
```

### アプリケーション層
```typescript
// ❌ 悪い例: 例外投げる
if (!session) throw new Error("Session not found");

// ✅ 良い例: Effect型でエラーハンドリング
const session = yield* repository.findById(sessionId).pipe(
  Effect.flatMap(Option.match({
    onNone: () => Effect.fail(new SessionNotFound({ sessionId })),
    onSome: Effect.succeed
  }))
);
```

### テスト
```typescript
// ❌ 悪い例: 実装詳細のテスト
it("内部バリデーション関数を呼び出す", () => {
  // 内部実装に依存するテスト
});

// ✅ 良い例: ビジネス価値のテスト
it("AC1: 12単位以上のセッションを提出できる", async () => {
  const sessionId = yield* setupTestSession(studentId, term, [4, 4, 4]);
  yield* submitRegistrationSession({ sessionId, submittedBy: studentId });
  yield* assertSessionSubmittedSuccessfully({ sessionId, capturedEvents });
});

// ✅ 良い例: カスタムアサーション使用
yield* assertSessionCreatedSuccessfully({
  sessionId, expectedStudentId, expectedTerm, capturedEvents
});

// ✅ 良い例: Effect.flipによる失敗テスト
const error = yield* createRegistrationSession({ studentId, term }).pipe(
  Effect.flip
);
// エラーをSuccessとして扱い、その後アサーション
assertDuplicateSessionError(error, expectedSessionId);
```

## 受け入れテスト実装パターン

### Given-When-Then構造の標準パターン

参照コードから学ぶ、効果的な受け入れテスト実装パターン：

```typescript
// ✅ 標準的なGiven-When-Then構造
describe("ストーリー1: 履修登録セッション開始", () => {
  const TestLayer = Layer.mergeAll(
    InMemoryEventStore,
    InMemoryEventBus,
    InMemoryRegistrationSessionRepository.pipe(
      Layer.provide(Layer.mergeAll(InMemoryEventStore, InMemoryEventBus))
    )
  );

  it("学生が新学期の履修計画を開始する", () =>
    Effect.gen(function* () {
      // === Given: 前提条件の設定 ===
      const { studentId, term } = yield* givenValidStudentAndTerm();
      const capturedEvents = yield* givenEventCapture();

      // === When: 実行されるアクション ===
      const sessionId = yield* createRegistrationSession({ studentId, term });

      // === Then: 期待される結果の検証 ===
      thenSessionIdFormatIsValid(sessionId);
      yield* thenRegistrationSessionCreatedEventIsStoredInEventStore(sessionId, studentId, term);
      yield* thenRegistrationSessionCreatedEventIsPublished(capturedEvents, sessionId, studentId, term);
      yield* thenRegistrationSessionCanBeRetrieved(sessionId, studentId, term);
    })
      .pipe(Effect.provide(TestLayer))
      .pipe(Effect.runPromise)
  );
});
```

### Givenヘルパー関数の設計パターン

```typescript
// ✅ 再利用可能なGivenヘルパー関数
// Given: 田中太郎（S12345678）が2024年春学期の履修登録を行う前提
const givenValidStudentAndTerm = () =>
  Effect.gen(function* () {
    const studentId = StudentId.make("S12345678"); // 田中太郎の学生ID
    const term = Term.make("2024-Spring");          // 2024年春学期
    return { studentId, term };
  });

// Given: 複数学生の並行履修シナリオ（田中太郎・佐藤花子、春学期・秋学期）
const givenMultipleStudentsAndTerms = () =>
  Effect.gen(function* () {
    const student1Id = StudentId.make("S12345678"); // 田中太郎の学生ID
    const student2Id = StudentId.make("S87654321"); // 佐藤花子の学生ID
    const springTerm = Term.make("2024-Spring");     // 2024年春学期
    const fallTerm = Term.make("2024-Fall");         // 2024年秋学期
    return { student1Id, student2Id, springTerm, fallTerm };
  });

// Given: イベントキャプチャセットアップ
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

### Effect.flipによる失敗テスト強化パターン

```typescript
// ✅ 強化された失敗テストパターン
it("同一学生・学期での重複セッション作成を防止する", () =>
  Effect.gen(function* () {
    // === Given: 既に履修登録セッションが存在する学生・学期の組み合わせ ===
    const { studentId, term } = yield* givenValidStudentAndTerm();
    const capturedEvents = yield* givenEventCapture();
    // 最初のセッションを作成
    const firstSessionId = yield* createRegistrationSession({ studentId, term });
    yield* thenRegistrationSessionCanBeRetrieved(firstSessionId, studentId, term);

    // === When: 同じ学生・学期でセッション作成を再試行する ===
    const error = yield* createRegistrationSession({ studentId, term }).pipe(
      Effect.flip
    );

    // === Then: セッション重複エラーが発生すること ===
    thenDuplicateSessionErrorOccurs(error, firstSessionId);

    // === And: 最初のセッション作成イベントのみがイベントバスに発行されること ===
    yield* thenExactlyNEventsArePublished(capturedEvents, 1);
  })
    .pipe(Effect.provide(TestLayer))
    .pipe(Effect.runPromise)
);
```

### 複数アサーションの組み合わせパターン

```typescript
// ✅ 複数の検証を組み合わせたテスト
it("複数学生の並行履修計画をサポートする", () =>
  Effect.gen(function* () {
    // === Given: 異なる学生と学期の組み合わせが複数存在する ===
    const { student1Id, student2Id, springTerm, fallTerm } = yield* givenMultipleStudentsAndTerms();
    const capturedEvents = yield* givenEventCapture();

    // === When: 複数の異なる学生・学期の組み合わせでセッションを作成する ===
    const session1Id = yield* createRegistrationSession({
      studentId: student1Id,
      term: springTerm
    });
    const session2Id = yield* createRegistrationSession({
      studentId: student2Id,
      term: springTerm
    });
    const session3Id = yield* createRegistrationSession({
      studentId: student1Id,
      term: fallTerm
    });

    // === Then: 全ての履修登録セッションが集約として正常に作成され取得可能であること ===
    yield* thenMultipleSessionsAreCreatedSuccessfully([
      { sessionId: session1Id, studentId: student1Id, term: springTerm },
      { sessionId: session2Id, studentId: student2Id, term: springTerm },
      { sessionId: session3Id, studentId: student1Id, term: fallTerm }
    ], capturedEvents);
  })
    .pipe(Effect.provide(TestLayer))
    .pipe(Effect.runPromise)
);
```

### カスタムアサーション関数の命名規則

```typescript
// ✅ 意図が明確なカスタムアサーション関数名
// Format: then[何を検証するか][どのような状態か]
thenSessionIdFormatIsValid(sessionId);
thenRegistrationSessionCreatedEventIsPublished(capturedEvents, sessionId, studentId, term);
thenRegistrationSessionCanBeRetrieved(sessionId, studentId, term);
thenRegistrationSessionCreatedEventIsStoredInEventStore(sessionId, studentId, term);
thenDuplicateSessionErrorOccurs(error, firstSessionId);
thenExactlyNEventsArePublished(capturedEvents, 1);
thenMultipleSessionsAreCreatedSuccessfully(sessions, capturedEvents);
thenSessionIsInDraftState(session);
thenInvalidSessionIdErrorOccurs(commandError, invalidId, term);
```

### テストケース分類の標準パターン

```typescript
// ✅ 明確なテストケース分類
describe("ストーリー1: 履修登録セッション開始", () => {
  describe("基本シナリオ", () => {
    // 正常系のテストケース
    it("学生が新学期の履修計画を開始する", () => { ... });
    it("複数学生の並行履修計画をサポートする", () => { ... });
    it("セッションが編集可能なDraft状態で作成される", () => { ... });
  });

  describe("異常系シナリオ", () => {
    // エラー系のテストケース
    it("不正な学生IDでの履修計画開始を拒否する", () => { ... });
    it("不正な学期での履修計画開始を拒否する", () => { ... });
    it("同一学生・学期での重複セッション作成を防止する", () => { ... });
  });
});
```