# 成績・単位管理 (Academic Record Context)

## ドメインイベント・コマンド・エラー

### 📌 GradeEntered / 成績入力された
教員が学生の成績を正式に入力したことを表すイベント。出席、課題、試験などの成績構成要素を含む評価が記録される。
- **トリガーコマンド**: `EnterGrade` / 成績を入力する
- **発生しうるドメインエラー**:
  - `OutsideGradingPeriod` / 成績入力期間外
  - `StudentNotEnrolled` / 履修していない学生
  - `InsufficientGradingPermission` / 成績入力権限なし

### 📌 MultipleGradesEntered / 複数成績一括入力された
教員が複数学生の成績を一括で入力したことを表すイベント。複数科目履修による効率的な成績管理を実現。
- **トリガーコマンド**: `EnterMultipleGrades` / 複数成績を一括入力する
- **発生しうるドメインエラー**:
  - `OutsideGradingPeriod` / 成績入力期間外
  - `SomeStudentsNotEnrolled` / 一部学生が履修していない
  - `InsufficientGradingPermission` / 成績入力権限なし
  - `DuplicateGradeEntries` / 重複した成績入力
  - `GradeEntryValidationFailures` / 成績入力値の検証エラー

### 📌 GradeFinalized / 成績確定された
入力された成績が教員によって最終確認され、正式に確定されたことを表すイベント。このイベント以降、成績は公式記録となり、単位認定プロセスが開始可能となる。
- **トリガーコマンド**: `FinalizeGrade` / 成績を確定する
- **発生しうるドメインエラー**:
  - `GradeNotEntered` / 成績が入力されていない
  - `GradeAlreadyFinalized` / 既に確定済み
  - `FinalizationDeadlineExceeded` / 確定期限超過

### 📌 GradePublished / 成績公開された
確定された成績が学生に対して正式に公開されたことを表すイベント。学生は自身の成績を確認でき、成績証明書への記載が可能となる。
- **トリガーコマンド**: `PublishGrade` / 成績を公開する
- **発生しうるドメインエラー**:
  - `GradeNotFinalized` / 成績が確定していない
  - `OutsidePublicationPeriod` / 公開期間外

### 📌 GradeCorrected / 成績修正された
確定後の成績に誤りが発見され、正式な手続きを経て修正されたことを表すイベント。修正履歴として記録され、監査証跡となる。
- **トリガーコマンド**: `CorrectGrade` / 成績を修正する
- **発生しうるドメインエラー**:
  - `OutsideCorrectionPeriod` / 成績修正期間外
  - `InsufficientCorrectionPermission` / 修正権限なし
  - `CreditAlreadyAwarded` / 既に単位認定済み

### 📌 CreditAwarded / 単位認定された
学生が科目の単位を正式に取得したことを表すイベント。合格基準を満たした成績に基づき、卒業要件に算入される単位として認定される。
- **トリガーコマンド**: `AwardCredit` / 単位を認定する
- **発生しうるドメインエラー**:
  - `FailingGrade` / 不合格の成績
  - `GradeNotFinalized` / 成績が確定していない
  - `CreditAlreadyAwarded` / 既に単位認定済み

### 📌 GraduationEvaluated / 卒業判定実施された
学生の卒業要件充足状況が正式に評価されたことを表すイベント。必要単位数、必修科目、GPA要件などの総合的な判定結果を記録。
- **トリガーコマンド**: `EvaluateGraduation` / 卒業判定を実施する
- **発生しうるドメインエラー**:
  - `InsufficientCreditsForGraduation` / 卒業要件単位不足
  - `RequiredCoursesNotCompleted` / 必修科目未完了
  - `OutsideGraduationEvaluationPeriod` / 卒業判定期間外

## 集約 (Aggregates)

### StudentGrade（集約ルート）
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

### AcademicRecord（集約ルート）
```typescript
AcademicRecord {
  studentId: StudentId           // 学生識別子
  completedCourses: CompletedCourse[]  // 修了科目（複数科目履修により動的に拡張）
  totalCredits: CreditUnit       // 総取得単位数（共有バリューオブジェクト）
  gpa: number                   // GPA（複数科目成績の加重平均）
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

### GraduationEvaluation（集約ルート）
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

## リードモデル (Read Models)
- **StudentTranscript** - 学生成績証明書
- **GradeDistribution** - 成績分布統計
- **CreditSummary** - 単位取得状況集計
- **GraduationCandidateList** - 卒業候補者一覧