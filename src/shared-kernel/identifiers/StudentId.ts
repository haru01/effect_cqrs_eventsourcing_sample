import * as Schema from '@effect/schema/Schema';

const StudentIdSchema = Schema.String.pipe(
  Schema.brand('StudentId'),
  Schema.minLength(1),
  Schema.pattern(/^STU[0-9]{7}$/)
);

export type StudentId = Schema.Schema.Type<typeof StudentIdSchema>;

export const StudentId = {
  Schema: StudentIdSchema,
  make: (id: string): StudentId => Schema.decodeSync(StudentIdSchema)(id),
  random: (): StudentId => StudentIdSchema.pipe(
    Schema.decodeSync
  )(`STU${Math.random().toString().slice(2, 9)}`)
} as const;