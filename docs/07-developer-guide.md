# 開発者向けガイド

## 開発環境セットアップ
```bash
npm install
npm run test        # 全テスト実行
npm run test:coverage # カバレッジ確認
npm run dev         # デモプログラム実行
npm run typecheck   # TypeScript型チェック
```

## AcceptanceTDD開発手法（必須）

application層のコマンドとクエリの受け入れテストを作成し、ステップバイステップで、実現します。

**原則**: 段階的実装（Red→Green→Refactor）、最小限コード、継続的改善

**3段階アプローチ**:
1. **基本正常系**: 最重要受け入れ条件1つの完成
2. **主要異常系**: エラーケースの段階的実装
3. **境界値・エッジケース**: 包括的品質確保

**テスト構成**: Given-When-Thenパターン、カスタムアサーション活用、段階的テスト有効化（`it.skip()` → `it()`）

**命名規則**: 日本語ストーリー名、AC1/AC2プレフィックス、ビジネス価値重視

### テストヘルパー関数の標準化

テストコードの可読性と再利用性を高めるため、以下の命名規則を採用：

```typescript
// whenX: コマンド実行
const whenCourseIsSelected = (command) => 
  SelectCourseHandler.handle(command);

// whenXFails: エラー期待
const whenCourseSelectionFails = (command) =>
  Effect.flip(SelectCourseHandler.handle(command));

// getCurrentX: 状態取得
const getCurrentRegistrationState = (studentId, semesterId) =>
  GetStudentRegistrationHandler.handle({ studentId, semesterId });

// thenX: 結果検証
const thenStudentHasSelectedCourses = (state, count) => {
  expect(state.selectedCourses).toHaveLength(count);
};
```

### vitestアサーションの活用

Effect.failによる手動エラーではなく、vitestの標準アサーションを使用：

```typescript
// vitestの標準アサーション
expect(state.courses).toHaveLength(3);
expect(error).toBeInstanceOf(CreditLimitExceeded);
expect(state.totalCredits).toBe(24);
```

## コード規約

1. **Effect-TS優先**: Promiseではなく常にEffectを使用
2. **Brand型活用**: プリミティブ値には必ずBrand型を適用
3. **不変性**: すべてのドメインオブジェクトはイミュータブル
4. **AcceptanceTDD必須**: 新機能は必ずAcceptanceTDDで段階的実装
5. **型安全**: `any`型の使用禁止、完全な型注釈

## AcceptanceTDD品質基準（必須）

1. **段階的実装**: 受け入れ条件を1つずつ完了（一括実装禁止）
2. **TDDサイクル**: 各受け入れ条件でRed→Green→Refactorサイクル実行
3. **最小限実装**: 各モードで過剰実装回避、必要最小限の実装
4. **継続的リファクタリング**: 各モード完了時の設計品質向上
5. **テスト進行管理**: `it.skip()` から `it()` への段階的変更記録
6. **モード別コミット**: Phase毎の独立したコミットによる進捗管理