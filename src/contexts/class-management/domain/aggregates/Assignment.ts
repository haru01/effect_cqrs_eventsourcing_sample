import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId } from '@shared/index.js';
import { AssignmentId } from '../identifiers/index.js';
import { AssignmentStatus } from '../value-objects/index.js';

export const SubmissionRecord = Schema.Struct({
  studentId: StudentId.StudentId,
  submittedAt: Schema.Date,
  content: Schema.String,
  score: Schema.optional(Schema.Number),
  feedback: Schema.optional(Schema.String)
});

export type SubmissionRecord = Schema.Schema.Type<typeof SubmissionRecord>;

export const Assignment = Schema.Struct({
  assignmentId: AssignmentId.AssignmentId,
  courseId: CourseId.CourseId,
  title: Schema.String,
  description: Schema.String,
  dueDate: Schema.Date,
  maxScore: Schema.Number,
  submissions: Schema.Array(SubmissionRecord),
  status: AssignmentStatus.AssignmentStatus
});

export type Assignment = Schema.Schema.Type<typeof Assignment>;

export const make = (
  assignmentId: AssignmentId.AssignmentId,
  courseId: CourseId.CourseId,
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
  status: AssignmentStatus.AssignmentStatusValue.Draft
});

export const submitAssignment = (
  assignment: Assignment,
  studentId: StudentId.StudentId,
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
};