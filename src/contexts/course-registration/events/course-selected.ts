import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, SemesterId } from '../../../shared-kernel/index.js';

export const CourseSelectedSchema = Schema.Struct({
  eventType: Schema.Literal('CourseSelected'),
  studentId: StudentId.Schema.annotations({ title: "学生ID" }),
  courseId: CourseId.Schema.annotations({ title: "科目ID" }),
  semesterId: SemesterId.Schema.annotations({ title: "学期ID" }),
  selectedAt: Schema.Date.annotations({ title: "選択日時" })
});

export type CourseSelected = Schema.Schema.Type<typeof CourseSelectedSchema>;

export const CourseSelectedModule = {
  Schema: CourseSelectedSchema,
  create: (
    studentId: StudentId,
    courseId: CourseId,
    semesterId: SemesterId,
    selectedAt: Date = new Date()
  ): CourseSelected => ({
    eventType: 'CourseSelected',
    studentId,
    courseId,
    semesterId,
    selectedAt
  })
} as const;

export { CourseSelectedModule as CourseSelected };