# 最小限履修フロー プロダクトバックログ

## 🎯 目標
履修科目選択から授業管理開始までのエンドツーエンドフローをサポートする最小限のMVP実装
- **想定期間**: 1-2週間
- **核となるイベント連鎖**: `RegistrationConfirmed` → `ClassStarted`

## 📚 除外機能（後回し）
- 科目一覧確認機能
- 時間割重複チェック機能
- 単位数制限チェック機能
- 前提科目チェック機能

## 🏗️ エピック構成（優先順位順）

### Epic 1: 基盤となる共有カーネル
**価値**: 全コンテキストで使用する基本的な識別子・型の統一

#### Story 1.1: 共有識別子定義
**As a** システム開発者  
**I want** 基本的な識別子を定義する  
**So that** 各コンテキスト間で一貫した識別子を使用できる

**受け入れ条件**:
```gherkin
Given システムが起動している
When 共有識別子を使用する
Then StudentId形式（S + 8桁数字）で学生を識別できる
And CourseId形式（C + 6桁数字）で科目を識別できる  
And InstructorId形式（I + 6桁数字）で教員を識別できる
And SemesterId形式（YYYY-Season）で学期を識別できる
```

**技術的受け入れ条件**:
- Brand型によるプリミティブ値の型安全性
- Effect型システムとの統合
- バリデーション機能

**実装ファイル**: 
- `src/shared-kernel/identifiers.ts`
- `src/shared-kernel/identifiers.test.ts`

---

#### Story 1.2: 共有値オブジェクト定義
**As a** システム開発者  
**I want** 共有されるバリューオブジェクトを定義する  
**So that** コンテキスト間で一貫したデータ表現を使用できる

**受け入れ条件**:
```gherkin
Given 識別子が定義されている
When CreditUnitを作成する
Then 正の整数値のみを受け入れる
And Grade値（S/A/B/C/D/F/W/I）を定義できる
```

**実装ファイル**: 
- `src/shared-kernel/value-objects.ts`
- `src/shared-kernel/value-objects.test.ts`

---

### Epic 2: 履修管理コンテキスト（最小限）
**価値**: 学生が科目を選択し、承認を得るまでの基本フロー

#### Story 2.1: 履修科目選択
**As a** 学生  
**I want** 履修したい科目を選択する  
**So that** 履修登録に向けて科目を準備できる

**受け入れ条件**:
```gherkin
Given 学生ID "S12345678" がシステムに存在する
And 科目ID "C123456" が提供されている
And 学期ID "2024-Spring" が設定されている
When 学生が科目を選択するコマンドを実行する
Then CourseSelected イベントが発生する
And 学生の履修選択状況が保存される
```

**技術的受け入れ条件**:
- SelectCourse コマンドの実装
- CourseSelected イベントの実装  
- StudentRegistration 集約の基本実装
- 制約チェック機能は除外（最小実装）

**実装ファイル**:
- `src/course-registration/commands/select-course.ts`
- `src/course-registration/events/course-selected.ts`
- `src/course-registration/aggregates/student-registration.ts`
- `src/course-registration/commands/select-course.test.ts`

---

#### Story 2.2: 履修登録提出
**As a** 学生  
**I want** 選択した科目セットを履修登録として提出する  
**So that** 教務職員による承認を受けられる

**受け入れ条件**:
```gherkin
Given 学生が少なくとも1科目を選択している
When 履修登録提出コマンドを実行する
Then RegistrationSubmitted イベントが発生する
And 履修ステータスが "submitted" に変更される
And 提出日時が記録される
```

**技術的受け入れ条件**:
- SubmitRegistration コマンドの実装
- RegistrationSubmitted イベントの実装
- 基本的な検証のみ（最小実装）

**実装ファイル**:
- `src/course-registration/commands/submit-registration.ts`
- `src/course-registration/events/registration-submitted.ts`
- `src/course-registration/commands/submit-registration.test.ts`

---

#### Story 2.3: 履修承認
**As a** 教務職員  
**I want** 提出された履修登録を承認する  
**So that** 学生が正式に授業に参加できるようになる

**受け入れ条件**:
```gherkin
Given 履修登録が提出されている
When 教務職員が承認コマンドを実行する  
Then RegistrationConfirmed イベントが発生する
And 履修ステータスが "confirmed" に変更される
And 承認日時が記録される
```

**技術的受け入れ条件**:
- ApproveRegistration コマンドの実装
- RegistrationConfirmed イベントの実装
- 基本的な権限チェック

**実装ファイル**:
- `src/course-registration/commands/approve-registration.ts`
- `src/course-registration/events/registration-confirmed.ts`
- `src/course-registration/commands/approve-registration.test.ts`

---

### Epic 3: 授業管理コンテキスト（最小限）
**価値**: 履修が確定した学生に対して授業を開始する

#### Story 3.1: 授業開始
**As a** 教員  
**I want** 履修が確定した科目の授業を開始する  
**So that** 学生が授業に参加し、学習活動を始められる

**受け入れ条件**:
```gherkin
Given 科目の履修登録が確定している
And 少なくとも1名の学生が履修している
When 教員が授業開始コマンドを実行する
Then ClassStarted イベントが発生する  
And 授業ステータスが "in_progress" に変更される
And 履修学生リストが設定される
```

**技術的受け入れ条件**:
- StartClass コマンドの実装
- ClassStarted イベントの実装
- ClassSession 集約の基本実装
- 履修管理からの学生情報参照機能

**実装ファイル**:
- `src/class-management/commands/start-class.ts`
- `src/class-management/events/class-started.ts`
- `src/class-management/aggregates/class-session.ts`
- `src/class-management/commands/start-class.test.ts`

---

### Epic 4: コンテキスト間連携
**価値**: 履修確定から授業開始への自動化されたフロー

#### Story 4.1: 履修確定から授業開始への連携
**As a** システム  
**I want** 履修が確定された科目の授業を自動的に開始可能状態にする  
**So that** 教員がスムーズに授業を開始できる

**受け入れ条件**:
```gherkin
Given 履修管理コンテキストで RegistrationConfirmed イベントが発生している
When イベントハンドラーが実行される
Then 授業管理コンテキストで履修学生情報が更新される
And 教員が授業開始できる状態になる
```

**技術的受け入れ条件**:
- イベントハンドラーの実装
- コンテキスト間通信の基本実装
- Effect によるエラーハンドリング

**実装ファイル**:
- `src/integration/event-handlers/registration-confirmed-handler.ts`
- `src/integration/event-handlers/registration-confirmed-handler.test.ts`

---

### Epic 5: エンドツーエンドフロー
**価値**: 完全な履修フローの動作確認

#### Story 5.1: 最小限フローのエンドツーエンド実装
**As a** システムユーザー  
**I want** 履修選択から授業開始までの完全なフローを実行する  
**So that** システムが期待通りに動作することを確認できる

**受け入れ条件**:
```gherkin
Given システムが正常に起動している
When 学生が科目を選択し、登録を提出し、教務職員が承認し、教員が授業を開始する
Then 全ての工程が正常に完了する
And 各段階で適切なイベントが発生する  
And 最終的に学生が授業に参加可能な状態になる
```

**技術的受け入れ条件**:
- 統合テストの実装
- エラーハンドリングの確認
- パフォーマンス基準の確認

**実装ファイル**:
- `src/integration/end-to-end.test.ts`
- `src/integration/demo-scenario.ts`

---

## 🚀 実装順序（AcceptanceTDD対応）

### Phase 1: 基盤（1-2日）
1. Story 1.1 → Story 1.2

### Phase 2: 履修管理（2-3日）
2. Story 2.1 → Story 2.2 → Story 2.3

### Phase 3: 授業管理（1-2日）
3. Story 3.1

### Phase 4: 連携（1-2日）
4. Story 4.1

### Phase 5: 統合（1日）
5. Story 5.1

---

## ✅ 完了定義（Definition of Done）

各ストーリーは以下を満たした時点で完了とする：

1. **コードの実装**
   - TypeScript Effect による実装
   - Brand型による型安全性
   - 不変性の維持

2. **テストの実装**
   - Given-When-Then パターンの受け入れテスト
   - 単体テストのカバレッジ > 90%
   - Edge case の考慮

3. **ドキュメント**
   - コード内コメント
   - API仕様（必要に応じて）

4. **品質確認**
   - TypeScript型チェック通過
   - 全テスト通過
   - コードレビュー完了

---

## 📈 成功指標

- **技術指標**
  - エンドツーエンドテスト通過率: 100%
  - コードカバレッジ: > 90%
  - TypeScript エラー: 0件

- **機能指標**  
  - 履修選択から授業開始まで5分以内で完了
  - 同時履修者100名でのパフォーマンス維持
  - 基本的なエラーハンドリング動作

この構成により、最小限の価値ある機能を1-2週間で実装し、段階的に機能を拡張できる基盤を構築できます。