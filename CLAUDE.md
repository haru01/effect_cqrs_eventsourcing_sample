# 大学履修・成績管理システム設計書

このドキュメントは複数のファイルに分割されています。各トピックについては以下を参照してください：

## 📚 ドキュメント構成

- [概要・アーキテクチャ・共有カーネル](./docs/01-overview.md)
- [履修管理コンテキスト](./docs/02-course-registration.md)
- [授業管理コンテキスト](./docs/03-class-management.md)
- [成績・単位管理コンテキスト](./docs/04-academic-record.md)
- [イベント連鎖](./docs/05-event-chains.md)
- [TypeScript Effect実装ガイド](./docs/06-implementation-guide.md)
- [開発者向けガイド](./docs/07-developer-guide.md)
- [テストガイド](./docs/08-testing-guide.md)

## 🚀 クイックスタート

### 開発環境セットアップ
```bash
npm install
npm run test        # 全テスト実行
npm run test:coverage # カバレッジ確認
npm run dev         # デモプログラム実行
npm run typecheck   # TypeScript型チェック
```

### AcceptanceTDD開発手法
- 段階的実装（Red→Green→Refactor）
- 最小限コード、継続的改善
- Given-When-Thenパターンでのテスト作成

### コード規約（必須）
- Effect-TS優先（Promiseではなく常にEffect使用）
- Brand型活用（プリミティブ値禁止）
- 不変性維持（イミュータブルオブジェクト）
- AcceptanceTDD必須（新機能の段階的実装）

## 📋 まとめ

本システムは、大学の履修・成績管理をイベントソーシング・CQRSパターンで構築する設計サンプルです。
TypeScript Effectを活用し、以下の3つの境界付けられたコンテキストで実装されています：

1. **履修管理**: 科目選択、履修登録、承認
2. **授業管理**: 出席記録、課題管理、試験実施
3. **成績・単位管理**: 成績評価、単位認定、卒業判定

共有カーネルで基本的な識別子とバリューオブジェクトを統一し、コンテキスト間の整合性を保っています。