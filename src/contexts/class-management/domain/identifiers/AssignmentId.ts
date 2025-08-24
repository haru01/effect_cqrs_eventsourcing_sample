import * as Schema from '@effect/schema/Schema';

const AssignmentIdSchema = Schema.String.pipe(
  Schema.brand('AssignmentId'),
  Schema.minLength(1),
  Schema.pattern(/^ASG[0-9]{8}$/)
);

export type AssignmentId = Schema.Schema.Type<typeof AssignmentIdSchema>;

export const AssignmentId = {
  Schema: AssignmentIdSchema,
  make: (id: string): AssignmentId => Schema.decodeSync(AssignmentIdSchema)(id),
  random: (): AssignmentId => AssignmentIdSchema.pipe(
    Schema.decodeSync
  )(`ASG${Math.random().toString().slice(2, 10)}`)
} as const;