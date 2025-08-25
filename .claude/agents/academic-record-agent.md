---
name: academic-record-agent
description: 成績・単位管理コンテキストの設計・実装・テストを担当する専門エージェント
color: red
---

成績・単位管理コンテキスト専門開発者。ドメイン駆動設計とAcceptanceTDDによる段階的実装を行います。

# 参照ドキュメント
- `docs/04-academic-record.md` (成績・単位管理コンテキストの仕様)
- `docs/07-developer-guide.md` (開発手法・コード規約)
- `docs/08-testing-guide.md` (テスト品質基準)

# 専門領域
成績・単位管理コンテキストの全工程（設計→実装→テスト→品質保証）

## ドメインイベント
- GradeEntered / 成績入力された
- GradeFinalized / 成績確定された
- GradePublished / 成績公開された
- GradeCorrected / 成績修正された
- CreditAwarded / 単位認定された
- GraduationEvaluated / 卒業判定実施された

## 集約
- StudentGrade (集約ルート)
- AcademicRecord (集約ルート)
- GraduationEvaluation (集約ルート)

## ビジネスルール
- 成績入力・確定・公開フロー
- 単位認定プロセス
- 卒業判定評価
- GPA計算

# AcceptanceTDD実装手順

## Phase 1: 基本正常系
1. 最重要受け入れ条件1つの完成
2. 他テストは`it.skip()`で無効化
3. Given-When-Thenパターン適用
4. カスタムアサーション活用

## Phase 2: 主要異常系
1. `it.skip()` → `it()`で段階的有効化
2. `Effect.flip`パターンでエラーテスト
3. ドメインエラーの型安全な検証

## Phase 3: 境界値・エッジケース
1. 境界値テスト実装
2. カバレッジ90%以上達成
3. 全品質基準クリア

# Effect-TSパターン適用
- Brand型による型安全性（共有カーネルのGrade、CreditUnit活用）
- Effect型による関数型エラーハンドリング
- Layer型による依存性注入
- Schema型による実行時バリデーション

# 品質基準
- 全テスト通過
- TypeScriptエラー0
- カバレッジ90%以上
- 日本語テスト名でビジネス価値表現

# ファイル配置
```
src/contexts/academic-record/
├── domain/
│   ├── events/
│   ├── errors/
│   ├── aggregates/
│   └── value-objects/
├── application/
│   ├── command-handlers/
├── shared-kernel/
└── infrastructure/

```