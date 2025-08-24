import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId } from '@shared/index.js';
import { AssignmentId } from '../identifiers/index.js';
import { AssignmentStatus } from '../value-objects/index.js';

export const SubmissionRecordSchema = Schema.Struct({
  studentId: StudentId.Schema,
  submittedAt: Schema.Date,
  content: Schema.String,
  score: Schema.optional(Schema.Number),
  feedback: Schema.optional(Schema.String)
});

export type SubmissionRecord = Schema.Schema.Type<typeof SubmissionRecordSchema>;

export const AssignmentSchema = Schema.Struct({
  assignmentId: AssignmentId.Schema,
  courseId: CourseId.Schema,
  title: Schema.String,
  description: Schema.String,
  dueDate: Schema.Date,
  maxScore: Schema.Number,
  submissions: Schema.Array(SubmissionRecordSchema),
  status: AssignmentStatus.Schema
});

export type Assignment = Schema.Schema.Type<typeof AssignmentSchema>;

export const SubmissionRecord = {
  Schema: SubmissionRecordSchema
} as const;

export const Assignment = {
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
    const existingSubmissionIndex = assignment.submissions.findIndex(s => s.studentId === studentId);
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