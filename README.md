# Effect CQRS Event Sourcing Sample

TypeScript Effect を使った大学履修・成績管理システムのCQRS・イベントソーシングサンプルプロジェクトです。

## 🎯 プロジェクト概要

本プロジェクトは、**Effect-TS** を活用したCQRS（Command Query Responsibility Segregation）とイベントソーシングパターンの実装例です。大学の履修・成績管理という馴染み深いドメインを通じて、関数型プログラミングによる型安全で堅牢なシステム設計を学ぶことができます。

### 🏗️ アーキテクチャ特徴

- **Effect-TS**: 型安全な関数型プログラミング
- **CQRS**: コマンド側とクエリ側の責務分離
- **Event Sourcing**: 状態変更をイベントとして永続化
- **Domain-Driven Design**: 境界付けられたコンテキストによる設計
- **AcceptanceTDD**: 段階的テスト駆動開発手法

## 🌟 主な特徴

### ✅ 実装済み機能
- **履修登録セッション管理**: Draft状態での科目選択・管理
- **科目一括追加**: バリデーション付きの複数科目登録
- **型安全なドメインモデル**: Brand型による識別子・バリューオブジェクト
- **イベントソーシング基盤**: InMemoryイベントストア・バス実装
- **包括的テスト**: 90%+カバレッジの受け入れテスト

### 🔄 境界付けられたコンテキスト

1. **履修管理** (`course-registration`): 科目選択、履修登録、承認フロー
2. **授業管理** (`class-management`): 出席記録、課題管理、試験実施
3. **成績・単位管理** (`academic-record`): 成績評価、単位認定、卒業判定

## 🚀 クイックスタート

### 前提条件
- Node.js 18+
- npm または yarn

### インストール・実行
```bash
# 依存関係インストール
npm install

# 全テスト実行
npm run test

# テストカバレッジ確認
npm run test:coverage

# TypeScript型チェック
npm run typecheck

# デモプログラム実行
npm run dev
```

### プロジェクト構造
```
src/
├── shared-kernel/          # 共有識別子・バリューオブジェクト
├── contexts/
│   ├── course-registration/  # 履修管理コンテキスト
│   ├── class-management/    # 授業管理コンテキスト（計画中）
│   └── academic-record/     # 成績管理コンテキスト（計画中）
└── infrastructure/         # 共通インフラ実装

tests/
├── stories/               # 受け入れテスト（Given-When-Then）
└── helpers/              # テスト支援関数・アサーション
```

## 📚 学習ガイド

### Effect-TS学習者向け
- **Effect.gen**: 手続き型風の関数型プログラミング
- **Layer/Context**: 依存性注入とテスタビリティ
- **Brand型**: プリミティブ値の型安全な扱い
- **エラーハンドリング**: 型安全な例外処理パターン

### CQRS・イベントソーシング学習者向け
- **コマンド・イベント・エラー**: ドメイン概念の明確な分離
- **集約設計**: ビジネスルールとデータ整合性の管理
- **イベントストア**: 状態再構築とイベント永続化
- **プロジェクション**: 読み取り専用ビューの構築

## 🧪 テスト戦略

### AcceptanceTDD アプローチ
```typescript
// Given-When-Thenパターンの例
it("学生が新学期の履修計画を開始する", () =>
  Effect.gen(function* () {
    // === Given: 学生と学期の前提条件 ===
    const { studentId, term } = yield* givenValidStudentAndTerm();
    const capturedEvents = yield* givenEventCapture();

    // === When: 履修登録セッション作成 ===
    const sessionId = yield* createRegistrationSession({ studentId, term });

    // === Then: 期待される結果の検証 ===
    thenSessionIdFormatIsValid(sessionId);
    yield* thenRegistrationSessionCreatedEventIsPublished(capturedEvents, sessionId);
    yield* thenRegistrationSessionCanBeRetrieved(sessionId, studentId, term);
  })
    .pipe(Effect.provide(TestLayer))
    .pipe(Effect.runPromise)
);
```

### テスト品質基準
- **カバレッジ**: 90%以上必達
- **型安全性**: TypeScriptエラー0個
- **Effect.flip**: 失敗テストの型安全な実装
- **カスタムアサーション**: 再利用可能な検証ロジック

## 📖 詳細ドキュメント

### 設計・実装ガイド
- [📋 概要・アーキテクチャ](./docs/01-overview.md)
- [🎓 履修管理コンテキスト](./docs/02-course-registration.md)
- [🏫 授業管理コンテキスト](./docs/03-class-management.md)
- [📊 成績・単位管理コンテキスト](./docs/04-academic-record.md)
- [🔗 イベント連鎖](./docs/05-event-chains.md)

### 開発者ガイド
- [⚡ TypeScript Effect実装ガイド](./docs/06-implementation-guide.md)
- [🛠️ 開発者向けガイド](./docs/07-developer-guide.md)
- [🧪 テストガイド](./docs/08-testing-guide.md)
- [🤖 エージェントシステム](./docs/09-agent-system.md)

## 🎯 学習目標

本プロジェクトを通じて以下のスキルを習得できます：

### 技術的スキル
- **Effect-TS**: 関数型リアクティブプログラミング
- **型安全性**: Brand型とGenericsの活用
- **CQRS設計**: 責務分離による複雑性管理
- **Event Sourcing**: イベント駆動アーキテクチャ
- **DDD**: ドメイン駆動設計の実践

### 開発手法
- **AcceptanceTDD**: ビジネス価値を重視したテスト駆動開発
- **段階的実装**: Red→Green→Refactorサイクル
- **型駆動開発**: 型システムによる設計品質向上
- **関数型設計**: 不変性と純粋関数による堅牢性

## 🔮 ロードマップ

### Phase 2: セッション提出 (進行中)
- Draft→Submitted状態遷移
- 履修要件バリデーション強化
- 提出後の読み取り専用化

### Phase 3: 授業管理コンテキスト (計画中)
- 出席記録管理
- 課題・試験実施
- スケジュール管理

### Phase 4: 成績・単位管理コンテキスト (計画中)
- 成績評価システム
- 単位認定プロセス
- 卒業判定ロジック

### Phase 5: プロダクション基盤 (将来計画)
- PostgreSQL統合
- REST API実装
- リアルタイムプロジェクション

## 🤝 コントリビューション

本プロジェクトは学習・参考目的のサンプルプロジェクトです。

### 開発方針
- **Effect-TS優先**: Promise使用禁止、全てEffectで実装
- **Brand型活用**: プリミティブ値の直接使用禁止
- **AcceptanceTDD**: 新機能は段階的テスト駆動開発
- **型安全性**: `any`型使用禁止、完全な型注釈
- **不変性**: 全ドメインオブジェクトはイミュータブル

## 📄 ライセンス

MIT License - 学習・参考目的での利用を推奨

## 🙋‍♂️ Q&A

**Q: Effect-TSの学習が初めてですが大丈夫ですか？**
A: 本プロジェクトは段階的にEffect-TSパターンを学べるよう設計されています。基本的なTypeScriptの知識があれば、実装例とドキュメントを通じて学習できます。

**Q: 実際の大学システムで使えますか？**
A: 現在はサンプル・学習用途に特化しています。プロダクション利用には追加の要件定義とインフラ実装が必要です。

**Q: 他のドメインに応用できますか？**
A: はい。本プロジェクトのCQRS・イベントソーシングパターンは、他のビジネスドメインにも応用可能な汎用的な設計となっています。

---

**🎓 Happy Learning with Effect-TS + CQRS + Event Sourcing! 🚀**