import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId } from '@shared/index.js';
import { AssignmentId } from '../identifiers/index.js';
import { AssignmentStatus } from '../value-objects/index.js';

/**
 * 課題提出記録スキーマ
 * 学生による課題の提出情報を表現する
 */
export const SubmissionRecordSchema = Schema.Struct({
  studentId: StudentId.Schema.annotations({ title: "学生ID" }),
  submittedAt: Schema.Date.annotations({ title: "提出日時" }),
  content: Schema.String.annotations({ title: "提出内容" }),
  score: Schema.optional(Schema.Number).annotations({ title: "点数" }),
  feedback: Schema.optional(Schema.String).annotations({ title: "フィードバック" })
});

export type SubmissionRecord = Schema.Schema.Type<typeof SubmissionRecordSchema>;

/**
 * 課題スキーマ
 * 授業で出題される課題の情報と提出状況を管理する集約ルート
 */
export const AssignmentSchema = Schema.Struct({
  assignmentId: AssignmentId.Schema.annotations({ title: "課題ID" }),
  courseId: CourseId.Schema.annotations({ title: "科目ID" }),
  title: Schema.String.annotations({ title: "課題タイトル" }),
  description: Schema.String.annotations({ title: "課題説明" }),
  dueDate: Schema.Date.annotations({ title: "提出期限" }),
  maxScore: Schema.Number.annotations({ title: "満点" }),
  submissions: Schema.Array(SubmissionRecordSchema).annotations({ title: "提出記録" }),
  status: AssignmentStatus.Schema.annotations({ title: "課題ステータス" })
});

export type Assignment = Schema.Schema.Type<typeof AssignmentSchema>;

export const SubmissionRecordModule = {
  Schema: SubmissionRecordSchema
} as const;

export const AssignmentModule = {
  Schema: AssignmentSchema,
  make: (
    assignmentId: AssignmentId,
    courseId: CourseId,
    title: string,
    description: string,
    dueDate: Date,
    maxScore: number
  ): Assignment => ({
    assignmentId,
    courseId,
    title,
    description,
    dueDate,
    maxScore,
    submissions: [],
    status: AssignmentStatus.Value.Draft
  }),
  submitAssignment: (
    assignment: Assignment,
    studentId: StudentId,
    content: string
  ): Assignment => {
    const existingSubmissionIndex = assignment.submissions.findIndex((s: SubmissionRecord) => s.studentId === studentId);
    const newSubmission: SubmissionRecord = {
      studentId,
      submittedAt: new Date(),
      content,
      score: undefined,
      feedback: undefined
    };

    if (existingSubmissionIndex >= 0) {
      const updatedSubmissions = [...assignment.submissions];
      updatedSubmissions[existingSubmissionIndex] = newSubmission;
      return { ...assignment, submissions: updatedSubmissions };
    }

    return {
      ...assignment,
      submissions: [...assignment.submissions, newSubmission]
    };
  }
} as const;

export { AssignmentModule as Assignment, SubmissionRecordModule as SubmissionRecord };