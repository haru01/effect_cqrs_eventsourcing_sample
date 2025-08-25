# TypeScript Effect実装ガイド

## 実装状況

### ✅ 完了（15-20%）

**基盤実装**: 値オブジェクト（Brand型）、集約（RegistrationSession）、イベント・エラー体系、アプリケーション層、インメモリインフラ、受け入れテスト

**完成ストーリー**:

- ストーリー1: 履修登録セッション開始
- ストーリー2: 科目一括追加（バリデーション付き）

**品質状況**: 90%+カバレッジ、TypeScriptエラー0

**技術特徴**:

- Effect-TSによる型安全な関数型実装
- CQRS/イベントソーシングパターン
- AcceptanceTDD（段階的テスト駆動開発）
- シンプル順次バリデーション

### ❌ 未実装（80-85%）

**次期開発対象**: セッション提出、アドバイザー承認、履修開始・完了、成績付与、PostgreSQL移行、REST API

**設計済みイベント**: RegistrationSessionSubmitted、RegistrationSessionApproved、RegistrationSessionRejected、EnrollmentStarted、EnrollmentCompleted

## 開発ロードマップ

### 🎯 Phase 2: ストーリー3（履修登録提出）

**目標**: Draft→Submitted状態遷移とバリデーション

### Phase 3: 履修ライフサイクル（4-6週間）

**目標**: 承認→履修開始の完全ワークフロー

### Phase 4: プロダクション基盤（8-12週間）

**目標**: PostgreSQL、投影、REST API

## 実装のポイント

### 1. Effect型システムの活用

- **Effect<A, E, R>**: 成功値A、エラーE、必要な依存関係Rを型レベルで表現
- コマンドハンドラー、イベントハンドラーをEffect型で実装

### 2. エラーハンドリング

- ドメインエラーを型安全に表現
- `Effect.fail`でドメインエラーを発生
- `Effect.catchAll`でエラーハンドリング

### 3. 依存性注入

- リポジトリ、イベントストア、外部サービスをContext/Layerで管理
- テスタビリティの向上

### 4. 並行処理

- `Effect.all`、`Effect.forEach`を活用した並行処理
- イベント発行の非同期処理

### 5. スキーマ検証

- `@effect/schema`によるコマンド・イベントの型安全性
- 実行時型チェック

### 6. Advanced Effect Patterns

#### Effect.orElseパターン

フォールバック処理を簡潔に記述するための推奨パターン：

```typescript
// Effect.orElse による優雅な処理
const getOrCreateRegistration = (studentId, semesterId) =>
  GetStudentRegistrationHandler.handle({
    studentId,
    semesterId
  }).pipe(
    Effect.orElse(() => {
      const initialState = StudentRegistration.make(studentId, semesterId);
      return Effect.succeed({
        ...initialState,
        actualTotalCredits: 0
      });
    })
  );
```

#### パイプライン処理での可読性向上

```typescript
const processCommand = (command: Command) =>
  pipe(
    validateCommand(command),
    Effect.flatMap(validCmd => getAggregateState(validCmd.id)),
    Effect.flatMap(state => applyBusinessLogic(state, command)),
    Effect.tap(newState => persistState(newState)),
    Effect.tap(newState => publishEvents(newState.events))
  );
```

#### Effect.flipによるエラーテスト簡略化

```typescript
it("エラーケースのテスト", () =>
  Effect.gen(function* () {
    const error = yield* handler.handle(invalidCommand).pipe(
      Effect.flip
    );
    
    expect(error).toBeInstanceOf(DomainError);
    expect(error.message).toContain("Expected message");
  })
);

## 推奨ディレクトリ構造

```text
src/
├── shared-kernel/
│   ├── identifiers/
│   │   ├── StudentId.ts
│   │   ├── CourseId.ts
│   │   ├── InstructorId.ts
│   │   └── SemesterId.ts
│   └── value-objects/
│       ├── Grade.ts
│       └── CreditUnit.ts
├── contexts/
│   ├── course-registration/
│   │   ├── domain/
│   │   │   ├── commands/
│   │   │   ├── events/
│   │   │   ├── errors/
│   │   │   ├── aggregates/
│   │   │   │   ├── StudentRegistration.ts
│   │   │   │   └── RegistrationPeriod.ts
│   │   │   └── value-objects/
│   │   │       ├── RegistrationStatus.ts
│   │   │       └── CourseType.ts
│   │   ├── application/
│   │   │   ├── command-handlers/
│   │   │   ├── query-handlers/
│   │   │   └── event-handlers/
│   │   └── infrastructure/
│   │       ├── repositories/
│   │       └── projections/
│   │           ├── StudentRegistrationView.ts
│   │           ├── CourseEnrollmentSummary.ts
│   │           └── RegistrationStatistics.ts
│   ├── class-management/
│   │   ├── domain/
│   │   │   ├── commands/
│   │   │   ├── events/
│   │   │   ├── errors/
│   │   │   ├── aggregates/
│   │   │   │   ├── ClassSession.ts
│   │   │   │   └── Assignment.ts
│   │   │   ├── identifiers/
│   │   │   │   ├── ClassSessionId.ts
│   │   │   │   └── AssignmentId.ts
│   │   │   └── value-objects/
│   │   │       ├── AttendanceStatus.ts
│   │   │       ├── SessionStatus.ts
│   │   │       └── AssignmentStatus.ts
│   │   └── infrastructure/
│   │       └── projections/
│   │           ├── StudentAttendanceRecord.ts
│   │           ├── ClassScheduleView.ts
│   │           ├── AssignmentStatusView.ts
│   │           └── AttendanceStatistics.ts
│   └── academic-record/
│       ├── domain/
│       │   ├── commands/
│       │   ├── events/
│       │   ├── errors/
│       │   ├── aggregates/
│       │   │   ├── StudentGrade.ts
│       │   │   ├── AcademicRecord.ts
│       │   │   └── GraduationEvaluation.ts
│       │   └── value-objects/
│       │       ├── GradeStatus.ts
│       │       ├── AcademicStatus.ts
│       │       └── GraduationStatus.ts
│       └── infrastructure/
│           └── projections/
│               ├── StudentTranscript.ts
│               ├── GradeDistribution.ts
│               ├── CreditSummary.ts
│               └── GraduationCandidateList.ts
├── infrastructure/
│   ├── event-store/
│   ├── projection-engine/
│   └── external-services/
│       ├── student-service/
│       ├── course-service/
│       └── instructor-service/
└── main.ts
```

## コード規約（必須）

### 1. Effect-TS優先

Promiseではなく常にEffectを使用

```typescript
// Effect による型安全な実装
const createSession = (data: SessionData): Effect.Effect<SessionId, SessionError, SessionRepository> =>
  Effect.gen(function* () {
    const session = yield* sessionRepository.save(data);
    return session.id;
  });
```

### 2. Brand型活用

プリミティブ値には必ずBrand型を適用

```typescript
// Brand型による型安全性
function createSession(studentId: StudentId, term: Term) {
  // 型レベルでドメインの意味を表現
}
```

### 3. 不変性維持

すべてのドメインオブジェクトはイミュータブル

```typescript
// イミュータブルオブジェクトの実装
class RegistrationSession {
  constructor(private readonly status: SessionStatus) {}

  submit(): RegistrationSession {
    return new RegistrationSession('submitted'); // 新しいインスタンスを返す
  }
}
```

### 4. AcceptanceTDD必須

新機能は必ずAcceptanceTDDで段階的実装

### 5. 型安全

`any`型の使用禁止、完全な型注釈

## アーキテクチャパターン

### ドメイン層

```typescript
// ドメイン層での適切なロジック配置
// domain layer
export const createRegistrationSession = (...) => new RegistrationSessionCreated({ ... });
// application layer
const event = createRegistrationSession(...);
```

### アプリケーション層

```typescript
// Effect型による型安全なエラーハンドリング
const session = yield* repository.findById(sessionId).pipe(
  Effect.flatMap(Option.match({
    onNone: () => Effect.fail(new SessionNotFound({ sessionId })),
    onSome: Effect.succeed
  }))
);
```

### インフラ層

```typescript
// Layer合成による依存性注入
const ApplicationLayer = Layer.mergeAll(
  EventStoreLayer,
  EventBusLayer,
  RepositoryLayer.pipe(
    Layer.provide(Layer.mergeAll(EventStoreLayer, EventBusLayer))
  )
);
```

## コマンド実装パターン

### 標準的なコマンドハンドラー構造

参照コードから学ぶ、academic-record-agentが従うべき実装パターン：

```typescript
// 標準的なコマンドハンドラー実装パターン
export interface CreateRegistrationSessionCommand {
  readonly studentId: StudentId;
  readonly term: Term;
}

/**
 * 履修登録セッションを作成するコマンド
 * @param command - 作成するセッションの情報
 * @returns - 作成されたセッションのID
 * @throws - セッションが既に存在する場合
 * @throws - セッションIDのパースエラーが発生した場合
 * @throws - イベントストアのエラーが発生した場合
 * @remark この関数は、セッションの状態を変更するのではなく、ドメインイベントを生成して保存・パブリッシュします。
 */
export const createRegistrationSession = (
  command: CreateRegistrationSessionCommand
): Effect.Effect<
  RegistrationSessionId,
  SessionAlreadyExists | InvalidRegistrationSessionId | EventStoreError,
  RegistrationSessionRepository | EventStore | EventBus
> =>
  Effect.gen(function* () {
    const eventStore = yield* EventStore;
    const eventBus = yield* EventBus;

    const { studentId, term } = command;

    // TODO: studentIdで学生の存在を確認するロジックを追加する
    // TODO: termの妥当性を確認するロジックを追加する

    const sessionId = yield* RegistrationSessionId.create(studentId, term);

    yield* ensureNotExists(sessionId);

    const event = createRegistrationSessionEvent(sessionId, studentId, term);

    // イベントを保存（イベントソーシング: セッションは永続化せずイベントのみ保存）
    // 注意: 現在は非同期投影を実装していないため、リポジトリはイベントから再構築
    yield* eventStore.appendEvent(sessionId, "RegistrationSession", event);
    // イベントをパブリッシュ
    yield* eventBus.publish(event);

    return sessionId;
  });
```

### ヘルパー関数パターン

```typescript
// 再利用可能なヘルパー関数の実装パターン
/**
 * セッションが存在しないことを確認するヘルパー関数
 * @param sessionId - 確認するセッションのID
 * @returns - セッションが存在しない場合は何も返さず、存在する場合はSessionAlreadyExistsエラーを投げる
 */
const ensureNotExists = (sessionId: RegistrationSessionId) =>
  Effect.gen(function* () {
    const repository = yield* RegistrationSessionRepository;
    return yield* repository.findById(sessionId).pipe(
      Effect.flatMap(() =>
        Effect.fail(new SessionAlreadyExists({
          sessionId
        }))
      ),
      Effect.catchTag("SessionNotFound", () => Effect.succeed(undefined))
    );
  });
```

### コマンド実装の必須要素

#### 1. 型安全な戻り値とエラー型の明示

```typescript
// 完全な型注釈
Effect.Effect<
  ReturnType,           // 成功時の戻り値
  DomainError1 | DomainError2 | InfraError, // 発生可能なエラー
  Repository | EventStore | EventBus        // 必要な依存関係
>
```

#### 2. Effect.gen による関数型プログラミング

```typescript
// Effect.genによる手続き型風の記述
Effect.gen(function* () {
  const dependency = yield* SomeDependency;
  const result = yield* someOperation();
  yield* anotherOperation(result);
  return finalResult;
});
```

#### 3. ドメイン検証とビジネスルール

```typescript
// ビジネスルールの明確な実装
const sessionId = yield* RegistrationSessionId.create(studentId, term);
yield* ensureNotExists(sessionId);  // 重複チェック
yield* validateBusinessRules();      // ビジネスルール検証
```

#### 4. イベントソーシングパターン

```typescript
// イベント生成・保存・発行の標準パターン
const event = createDomainEvent(aggregateId, ...params);

// イベントストアに保存
yield* eventStore.appendEvent(aggregateId, "AggregateType", event);

// イベントバスで発行
yield* eventBus.publish(event);

return aggregateId;
```

### academic-record-agent向け実装チェックリスト

#### ✅ 必須実装項目

1. **コマンドインターフェース**: readonly プロパティでの型定義
2. **JSDoc**: 完全なドキュメンテーション（@param, @returns, @throws, @remark）
3. **型注釈**: Effect.Effect<Success, Error, Dependencies>の完全指定
4. **Effect.gen**: 全ての非同期処理をEffect.genで実装
5. **依存性注入**: Context経由での依存関係取得
6. **ドメイン検証**: ビジネスルールの明確な実装
7. **エラーハンドリング**: 型安全なドメインエラー処理
8. **イベント処理**: 生成・保存・発行の標準パターン
9. **TODOコメント**: 未実装部分の明確な記載
10. **ヘルパー関数**: 再利用可能な関数の分離

#### 📋 実装時の注意点

- **Brand型**: 全ての識別子とバリューオブジェクトはBrand型で定義
- **不変性**: 全てのオブジェクトはイミュータブル
- **Effect優先**: Promise使用禁止、全てEffectで実装
- **型安全**: any型使用禁止、完全な型注釈必須
- **コメント**: Given-When-Thenパターンでの明確な意図表現

## まとめ

このプロジェクトは **高品質な基盤実装** を持つ優秀なプロトタイプです。Effect-TSによる関数型CQRS/イベントソーシングパターンの実装例として価値があり、今後の段階的な機能拡張により本格的な履修管理システムに発展可能です。

**現在の価値**:

- ✅ アーキテクチャパターンの学習・参考実装
- ✅ Effect-TSエコシステムのベストプラクティス
- ✅ CQRS/イベントソーシングの実践例
- ✅ 型安全な関数型DDD実装

**今後の発展性**:

- 🎯 エンタープライズレベルの履修管理システム
- 🎯 マイクロサービスアーキテクチャの基盤
- 🎯 Effect-TSによる大規模システム開発の参考実装

適切な開発リソースが投入されれば、**6-12ヶ月でプロダクション対応**の履修管理システム構築が可能な優秀な基盤です。
