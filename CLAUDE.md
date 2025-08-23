## 概要

本設計書は、大学の履修・成績管理システムをイベントソーシング・CQRSパターンで構築するための設計サンプルです。TypeScript Effectを活用した実装を前提としています。

## アーキテクチャ

- **Event Sourcing**: すべての状態変更をイベントとして記録
- **CQRS (Command Query Responsibility Segregation)**: コマンド側とクエリ側を分離
- **TypeScript Effect**: 関数型プログラミングアプローチでの実装
- **Domain-Driven Design**: 境界付けられたコンテキストによる設計
- **Shared Kernel**: 基本エンティティとバリューオブジェクトを共有

## 境界付けられたコンテキスト

### 1. 履修管理 (Course Registration Context)
### 2. 授業管理 (Class Management Context)
### 3. 成績・単位管理 (Academic Record Context)

## 共有カーネル (Shared Kernel)

### 識別子 (Identifiers)
- **StudentId** - 学生識別子（全コンテキストで使用）
- **CourseId** - 科目識別子（全コンテキストで使用）
- **InstructorId** - 教員識別子（授業管理・成績管理で使用）
- **SemesterId** - 学期識別子（全コンテキストで使用）

### 真に共有されるバリューオブジェクト
- **Grade** - 成績（授業管理の課題評価・成績管理の最終成績で共有）
- **CreditUnit** - 単位数（履修管理の単位計算・成績管理の単位認定で共有）

*注意: 各コンテキストは必要な情報のみを保持し、外部参照として識別子を使用する*

---

## 1. 履修管理 (Course Registration Context)

### ドメインイベント・コマンド・エラー

#### 📌 RegistrationPeriodStarted / 履修登録期間開始された
履修登録期間が正式に開始され、学生が科目選択を行えるようになったことを表すイベント。
- **トリガーコマンド**: `StartRegistrationPeriod` / 履修登録期間を開始する
- **発生しうるドメインエラー**:
  - `PreviousSemesterNotEnded` / 前学期が終了していない
  - `RegistrationPeriodAlreadyStarted` / 既に登録期間が開始済み

#### 📌 CourseSelected / 履修科目選択された
学生が特定の科目を履修対象として選択したことを表すイベント。時間割や単位数の制約をクリアした正当な選択を記録。
- **トリガーコマンド**: `SelectCourse` / 履修科目を選択する
- **発生しうるドメインエラー**:
  - `OutsideRegistrationPeriod` / 履修登録期間外
  - `ScheduleConflict` / 時間割が重複している
  - `CreditLimitExceeded` / 履修上限を超過
  - `PrerequisiteNotMet` / 前提科目未履修

#### 📌 RegistrationSubmitted / 履修登録提出された
学生が選択した科目セットを正式に履修登録として提出したことを表すイベント。必修科目や最低単位数の要件を満たした状態での提出を記録。
- **トリガーコマンド**: `SubmitRegistration` / 履修登録を提出する
- **発生しうるドメインエラー**:
  - `NoCourseSelected` / 選択科目が空
  - `RequiredCourseMissing` / 必修科目が不足
  - `BelowMinimumCredits` / 最低履修単位未満

#### 📌 RegistrationConfirmed / 履修登録確定された
提出された履修登録が教務システムによって正式に承認・確定されたことを表すイベント。このイベント以降、学生は授業に正式に参加可能となる。
- **トリガーコマンド**: `ApproveRegistration` / 履修登録を承認する
- **発生しうるドメインエラー**:
  - `RegistrationNotSubmitted` / 提出されていない登録
  - `CourseCapacityExceeded` / 科目定員超過
  - `InsufficientPermission` / 承認権限なし

#### 📌 CourseDropped / 履修取消された
確定した履修登録から特定の科目が正式に取り消されたことを表すイベント。取消期限内での正当な手続きによる履修変更を記録。
- **トリガーコマンド**: `DropCourse` / 履修を取り消す
- **発生しうるドメインエラー**:
  - `OutsideDropPeriod` / 履修変更期間外
  - `CannotDropRequiredCourse` / 必修科目は取消不可
  - `BelowMinimumCreditsAfterDrop` / 最低履修単位を下回る

### 集約 (Aggregates)

#### StudentRegistration（集約ルート）
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

#### RegistrationPeriod（集約ルート）
```typescript
RegistrationPeriod {
  semesterId: SemesterId        // 対象学期
  startDate: Date              // 登録開始日
  endDate: Date                // 登録終了日
  dropDeadline: Date           // 履修取消期限
  status: PeriodStatus         // 期間ステータス（Active, Closed, Suspended）
}
```

### リードモデル (Read Models)
- **StudentRegistrationView** - 学生の履修登録状況ビュー
- **CourseEnrollmentSummary** - 科目別履修者数集計
- **RegistrationStatistics** - 履修登録統計

---

## 2. 授業管理 (Class Management Context)

### ドメインイベント・コマンド・エラー

#### 📌 ClassStarted / 授業開始された
授業が正式に開始され、履修学生の参加が可能になったことを表すイベント。このイベントから出席記録や課題出題などの授業活動が可能となる。
- **トリガーコマンド**: `StartClass` / 授業を開始する
- **発生しうるドメインエラー**:
  - `NoEnrolledStudents` / 履修者が0名
  - `ClassroomUnavailable` / 教室が利用不可
  - `InstructorNotAssigned` / 教員が割り当てられていない

#### 📌 AttendanceRecorded / 出席記録された
学生の出席状況（出席・欠席・遅刻・公欠）が正式に記録されたことを表すイベント。成績評価の基礎データとなる重要な記録。
- **トリガーコマンド**: `RecordAttendance` / 出席を記録する
- **発生しうるドメインエラー**:
  - `ClassNotStarted` / 授業が開始されていない
  - `StudentNotEnrolled` / 履修していない学生
  - `AttendanceAlreadyRecorded` / 既に出席記録済み

#### 📌 TaskAssigned / 課題出題された
授業において新しい課題が正式に出題されたことを表すイベント。課題の内容、提出期限、配点が確定し、学生への通知が可能となる。
- **トリガーコマンド**: `AssignTask` / 課題を出題する
- **発生しうるドメインエラー**:
  - `ClassNotStarted` / 授業が開始されていない
  - `DeadlineInPast` / 提出期限が過去

#### 📌 AssignmentSubmitted / 課題提出された
学生が課題を正式に提出したことを表すイベント。提出期限内での正当な提出を記録し、評価プロセスの開始を可能にする。
- **トリガーコマンド**: `SubmitAssignment` / 課題を提出する
- **発生しうるドメインエラー**:
  - `DeadlineExceeded` / 提出期限超過
  - `TaskNotAssigned` / 課題が出題されていない
  - `StudentNotEnrolled` / 履修していない学生
  - `AssignmentAlreadySubmitted` / 既に提出済み

#### 📌 ExamConducted / 試験実施された
定期試験や小テストが正式に実施されたことを表すイベント。試験の実施記録として、参加学生や実施条件を記録。
- **トリガーコマンド**: `ConductExam` / 試験を実施する
- **発生しうるドメインエラー**:
  - `ExamRoomNotReserved` / 試験会場が確保されていない
  - `ExamScheduleConflict` / 試験日程が重複

### 集約 (Aggregates)

#### ClassSession（集約ルート）
```typescript
ClassSession {
  classSessionId: ClassSessionId    // 授業回識別子（このコンテキスト固有）
  courseId: CourseId               // 科目識別子
  semesterId: SemesterId           // 学期識別子
  instructorId: InstructorId       // 教員識別子
  sessionDate: Date                // 授業日
  enrolledStudents: StudentId[]    // 履修学生リスト
  attendanceRecords: AttendanceRecord[]  // 出席記録
  assignments: AssignmentId[]      // 課題リスト（このコンテキスト固有）
  sessionStatus: SessionStatus     // 授業ステータス（このコンテキスト固有）
}

AttendanceRecord {
  studentId: StudentId
  status: AttendanceStatus        // このコンテキスト固有
  recordedAt: Date
}

// 授業管理コンテキスト固有の識別子・列挙型
type ClassSessionId = string
type AssignmentId = string

enum AttendanceStatus {
  Present = "present",
  Absent = "absent",
  Late = "late",
  Excused = "excused"
}

enum SessionStatus {
  Scheduled = "scheduled",
  InProgress = "in_progress",
  Completed = "completed",
  Cancelled = "cancelled"
}
```

#### Assignment（集約ルート）
```typescript
Assignment {
  assignmentId: AssignmentId       // 課題識別子
  courseId: CourseId              // 科目識別子
  title: string                   // 課題タイトル
  description: string             // 課題説明
  dueDate: Date                   // 提出期限
  maxScore: number               // 満点
  submissions: SubmissionRecord[] // 提出記録
  status: AssignmentStatus       // 課題ステータス（このコンテキスト固有）
}

SubmissionRecord {
  studentId: StudentId
  submittedAt: Date
  content: string
  score?: number                 // Grade型ではなく数値スコア
  feedback?: string
}

enum AssignmentStatus {
  Draft = "draft",
  Published = "published",
  Closed = "closed"
}
```

### リードモデル (Read Models)
- **StudentAttendanceRecord** - 学生別出席記録
- **ClassScheduleView** - 授業スケジュール表示
- **AssignmentStatusView** - 課題提出状況
- **AttendanceStatistics** - 出席統計

---

## 3. 成績・単位管理 (Academic Record Context)

### ドメインイベント・コマンド・エラー

#### 📌 GradeEntered / 成績入力された
教員が学生の成績を正式に入力したことを表すイベント。出席、課題、試験などの成績構成要素を含む評価が記録される。
- **トリガーコマンド**: `EnterGrade` / 成績を入力する
- **発生しうるドメインエラー**:
  - `OutsideGradingPeriod` / 成績入力期間外
  - `StudentNotEnrolled` / 履修していない学生
  - `InsufficientGradingPermission` / 成績入力権限なし

#### 📌 GradeFinalized / 成績確定された
入力された成績が教員によって最終確認され、正式に確定されたことを表すイベント。このイベント以降、成績は公式記録となり、単位認定プロセスが開始可能となる。
- **トリガーコマンド**: `FinalizeGrade` / 成績を確定する
- **発生しうるドメインエラー**:
  - `GradeNotEntered` / 成績が入力されていない
  - `GradeAlreadyFinalized` / 既に確定済み
  - `FinalizationDeadlineExceeded` / 確定期限超過

#### 📌 GradePublished / 成績公開された
確定された成績が学生に対して正式に公開されたことを表すイベント。学生は自身の成績を確認でき、成績証明書への記載が可能となる。
- **トリガーコマンド**: `PublishGrade` / 成績を公開する
- **発生しうるドメインエラー**:
  - `GradeNotFinalized` / 成績が確定していない
  - `OutsidePublicationPeriod` / 公開期間外

#### 📌 GradeCorrected / 成績修正された
確定後の成績に誤りが発見され、正式な手続きを経て修正されたことを表すイベント。修正履歴として記録され、監査証跡となる。
- **トリガーコマンド**: `CorrectGrade` / 成績を修正する
- **発生しうるドメインエラー**:
  - `OutsideCorrectionPeriod` / 成績修正期間外
  - `InsufficientCorrectionPermission` / 修正権限なし
  - `CreditAlreadyAwarded` / 既に単位認定済み

#### 📌 CreditAwarded / 単位認定された
学生が科目の単位を正式に取得したことを表すイベント。合格基準を満たした成績に基づき、卒業要件に算入される単位として認定される。
- **トリガーコマンド**: `AwardCredit` / 単位を認定する
- **発生しうるドメインエラー**:
  - `FailingGrade` / 不合格の成績
  - `GradeNotFinalized` / 成績が確定していない
  - `CreditAlreadyAwarded` / 既に単位認定済み

#### 📌 GraduationEvaluated / 卒業判定実施された
学生の卒業要件充足状況が正式に評価されたことを表すイベント。必要単位数、必修科目、GPA要件などの総合的な判定結果を記録。
- **トリガーコマンド**: `EvaluateGraduation` / 卒業判定を実施する
- **発生しうるドメインエラー**:
  - `InsufficientCreditsForGraduation` / 卒業要件単位不足
  - `RequiredCoursesNotCompleted` / 必修科目未完了
  - `OutsideGraduationEvaluationPeriod` / 卒業判定期間外

### 集約 (Aggregates)

#### StudentGrade（集約ルート）
```typescript
StudentGrade {
  studentId: StudentId             // 学生識別子
  courseId: CourseId              // 科目識別子
  semesterId: SemesterId          // 学期識別子
  instructorId: InstructorId      // 教員識別子
  gradeComponents: GradeComponent[] // 成績構成要素
  finalGrade?: Grade              // 最終成績（共有バリューオブジェクト）
  gradeStatus: GradeStatus        // 成績ステータス（このコンテキスト固有）
  enteredAt?: Date               // 入力日時
  finalizedAt?: Date             // 確定日時
  publishedAt?: Date             // 公開日時
}

GradeComponent {
  componentType: string          // 出席、課題、試験等
  score: number
  maxScore: number
  weight: number                 // 重み（%）
}

// 成績管理コンテキスト固有の列挙型
enum GradeStatus {
  NotEntered = "not_entered",
  Entered = "entered",
  Finalized = "finalized",
  Published = "published"
}

enum AcademicStatus {
  GoodStanding = "good_standing",
  Warning = "warning",
  Probation = "probation"
}

enum GraduationStatus {
  Eligible = "eligible",
  NotEligible = "not_eligible",
  Graduated = "graduated"
}
```

#### AcademicRecord（集約ルート）
```typescript
AcademicRecord {
  studentId: StudentId           // 学生識別子
  completedCourses: CompletedCourse[]  // 修了科目
  totalCredits: CreditUnit       // 総取得単位数（共有バリューオブジェクト）
  gpa: number                   // GPA
  academicStatus: AcademicStatus // 学習状況（このコンテキスト固有）
  lastUpdated: Date
}

CompletedCourse {
  courseId: CourseId
  semesterId: SemesterId
  grade: Grade                  // 共有バリューオブジェクト
  credits: CreditUnit           // 共有バリューオブジェクト
  completedAt: Date
}
```

#### GraduationEvaluation（集約ルート）
```typescript
GraduationEvaluation {
  studentId: StudentId           // 学生識別子
  evaluationDate: Date           // 判定日
  requiredCredits: CreditUnit    // 必要単位数（共有バリューオブジェクト）
  earnedCredits: CreditUnit      // 取得単位数（共有バリューオブジェクト）
  requiredCourses: RequirementCheck[]  // 必修科目チェック
  gpaRequirement: number         // 必要GPA
  currentGpa: number            // 現在のGPA
  graduationStatus: GraduationStatus  // 卒業可否（このコンテキスト固有）
  deficiencies: string[]        // 不足要件
}

RequirementCheck {
  requirementType: string       // 必修科目分類
  required: CourseId[]
  completed: CourseId[]
  isSatisfied: boolean
}
```

### リードモデル (Read Models)
- **StudentTranscript** - 学生成績証明書
- **GradeDistribution** - 成績分布統計
- **CreditSummary** - 単位取得状況集計
- **GraduationCandidateList** - 卒業候補者一覧

---

## イベント連鎖

### コンテキスト内でのイベント連鎖

#### 履修管理
```
RegistrationPeriodStarted → CourseSelected → RegistrationSubmitted → RegistrationConfirmed
                                                                   ↓
                                                              CourseDropped
```

#### 授業管理
```
ClassStarted → AttendanceRecorded
            → TaskAssigned → AssignmentSubmitted
            → ExamConducted
```

#### 成績・単位管理
```
GradeEntered → GradeFinalized → GradePublished
            ↓                 ↓
         GradeCorrected    CreditAwarded → GraduationEvaluated
```

### コンテキスト間でのイベント連鎖

#### 主要なビジネスフロー

**学期開始から履修確定まで**
```
履修管理: RegistrationPeriodStarted → CourseSelected → RegistrationSubmitted → RegistrationConfirmed
```

*注意: 学事暦は共有カーネルで管理され、各コンテキストから参照される*

**履修確定から授業開始まで**
```
履修管理: RegistrationConfirmed
    ↓ (enables)
授業管理: ClassStarted → AttendanceRecorded / TaskAssigned / ExamConducted
```

**授業活動から成績確定まで**
```
授業管理: ExamConducted / AssignmentSubmitted
    ↓ (provides data for)
成績・単位管理: GradeEntered → GradeFinalized → GradePublished
```

**成績確定から単位認定・卒業判定まで**
```
成績・単位管理: GradeFinalized
    ↓ (triggers)
成績・単位管理: CreditAwarded → GraduationEvaluated
```

**学期終了プロセス**
```
成績・単位管理: GradeFinalized (all grades)
    ↓ (semester completion tracked in shared kernel)
*学期終了は共有カーネルのAcademicCalendarで管理*
```

---

## TypeScript Effect実装のポイント

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

### 推奨ディレクトリ構造
```
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

このドキュメントは、大学履修・成績管理システムをイベントソーシング・CQRSパターンでTypeScript Effectを使って実装するための設計書です。共有カーネルによって基本エンティティを共有し、3つの境界付けられたコンテキストでビジネスロジックを分離しています。