# 履修管理 (Course Registration Context)

## ドメインイベント・コマンド・エラー

### 📌 RegistrationPeriodStarted / 履修登録期間開始された
履修登録期間が正式に開始され、学生が科目選択を行えるようになったことを表すイベント。
- **トリガーコマンド**: `StartRegistrationPeriod` / 履修登録期間を開始する
- **発生しうるドメインエラー**:
  - `PreviousSemesterNotEnded` / 前学期が終了していない
  - `RegistrationPeriodAlreadyStarted` / 既に登録期間が開始済み

### 📌 CourseSelected / 履修科目選択された
学生が特定の科目を履修対象として選択したことを表すイベント。時間割や単位数の制約をクリアした正当な選択を記録。
- **トリガーコマンド**: `SelectCourse` / 履修科目を選択する
- **発生しうるドメインエラー**:
  - `OutsideRegistrationPeriod` / 履修登録期間外
  - `ScheduleConflict` / 時間割が重複している
  - `CreditLimitExceeded` / 履修上限を超過
  - `PrerequisiteNotMet` / 前提科目未履修

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