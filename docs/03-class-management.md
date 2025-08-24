# 授業管理 (Class Management Context)

## ドメインイベント・コマンド・エラー

### 📌 ClassStarted / 授業開始された
授業が正式に開始され、履修学生の参加が可能になったことを表すイベント。このイベントから出席記録や課題出題などの授業活動が可能となる。
- **トリガーコマンド**: `StartClass` / 授業を開始する
- **発生しうるドメインエラー**:
  - `NoEnrolledStudents` / 履修者が0名
  - `ClassroomUnavailable` / 教室が利用不可
  - `InstructorNotAssigned` / 教員が割り当てられていない

### 📌 AttendanceRecorded / 出席記録された
学生の出席状況（出席・欠席・遅刻・公欠）が正式に記録されたことを表すイベント。成績評価の基礎データとなる重要な記録。
- **トリガーコマンド**: `RecordAttendance` / 出席を記録する
- **発生しうるドメインエラー**:
  - `ClassNotStarted` / 授業が開始されていない
  - `StudentNotEnrolled` / 履修していない学生
  - `AttendanceAlreadyRecorded` / 既に出席記録済み

### 📌 TaskAssigned / 課題出題された
授業において新しい課題が正式に出題されたことを表すイベント。課題の内容、提出期限、配点が確定し、学生への通知が可能となる。
- **トリガーコマンド**: `AssignTask` / 課題を出題する
- **発生しうるドメインエラー**:
  - `ClassNotStarted` / 授業が開始されていない
  - `DeadlineInPast` / 提出期限が過去

### 📌 AssignmentSubmitted / 課題提出された
学生が課題を正式に提出したことを表すイベント。提出期限内での正当な提出を記録し、評価プロセスの開始を可能にする。
- **トリガーコマンド**: `SubmitAssignment` / 課題を提出する
- **発生しうるドメインエラー**:
  - `DeadlineExceeded` / 提出期限超過
  - `TaskNotAssigned` / 課題が出題されていない
  - `StudentNotEnrolled` / 履修していない学生
  - `AssignmentAlreadySubmitted` / 既に提出済み

### 📌 ExamConducted / 試験実施された
定期試験や小テストが正式に実施されたことを表すイベント。試験の実施記録として、参加学生や実施条件を記録。
- **トリガーコマンド**: `ConductExam` / 試験を実施する
- **発生しうるドメインエラー**:
  - `ExamRoomNotReserved` / 試験会場が確保されていない
  - `ExamScheduleConflict` / 試験日程が重複

## 集約 (Aggregates)

### ClassSession（集約ルート）
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

### Assignment（集約ルート）
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

## リードモデル (Read Models)
- **StudentAttendanceRecord** - 学生別出席記録
- **ClassScheduleView** - 授業スケジュール表示
- **AssignmentStatusView** - 課題提出状況
- **AttendanceStatistics** - 出席統計