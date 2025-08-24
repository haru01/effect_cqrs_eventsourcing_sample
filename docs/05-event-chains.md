# イベント連鎖

## コンテキスト内でのイベント連鎖

### 履修管理
```
RegistrationPeriodStarted → CourseSelected → RegistrationSubmitted → RegistrationConfirmed
                                                                   ↓
                                                              CourseDropped
```

### 授業管理
```
ClassStarted → AttendanceRecorded
            → TaskAssigned → AssignmentSubmitted
            → ExamConducted
```

### 成績・単位管理
```
GradeEntered → GradeFinalized → GradePublished
            ↓                 ↓
         GradeCorrected    CreditAwarded → GraduationEvaluated
```

## コンテキスト間でのイベント連鎖

### 主要なビジネスフロー

#### 学期開始から履修確定まで
```
履修管理: RegistrationPeriodStarted → CourseSelected → RegistrationSubmitted → RegistrationConfirmed
```

*注意: 学事暦は共有カーネルで管理され、各コンテキストから参照される*

#### 履修確定から授業開始まで
```
履修管理: RegistrationConfirmed
    ↓ (enables)
授業管理: ClassStarted → AttendanceRecorded / TaskAssigned / ExamConducted
```

#### 授業活動から成績確定まで
```
授業管理: ExamConducted / AssignmentSubmitted
    ↓ (provides data for)
成績・単位管理: GradeEntered → GradeFinalized → GradePublished
```

#### 成績確定から単位認定・卒業判定まで
```
成績・単位管理: GradeFinalized
    ↓ (triggers)
成績・単位管理: CreditAwarded → GraduationEvaluated
```

#### 学期終了プロセス
```
成績・単位管理: GradeFinalized (all grades)
    ↓ (semester completion tracked in shared kernel)
*学期終了は共有カーネルのAcademicCalendarで管理*
```