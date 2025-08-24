import * as Schema from '@effect/schema/Schema';

const InstructorIdSchema = Schema.String.pipe(
  Schema.brand('InstructorId'),
  Schema.minLength(1),
  Schema.pattern(/^INST[0-9]{6}$/)
);

export type InstructorId = Schema.Schema.Type<typeof InstructorIdSchema>;

export const InstructorId = {
  Schema: InstructorIdSchema,
  make: (id: string): InstructorId => Schema.decodeSync(InstructorIdSchema)(id),
  random: (): InstructorId => InstructorIdSchema.pipe(
    Schema.decodeSync
  )(`INST${Math.random().toString().slice(2, 8)}`)
} as const;