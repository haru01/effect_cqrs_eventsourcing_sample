import * as Schema from '@effect/schema/Schema';

const ClassSessionIdSchema = Schema.String.pipe(
  Schema.brand('ClassSessionId'),
  Schema.minLength(1),
  Schema.pattern(/^CS[0-9]{8}$/)
);

export type ClassSessionId = Schema.Schema.Type<typeof ClassSessionIdSchema>;

export const ClassSessionId = {
  Schema: ClassSessionIdSchema,
  make: (id: string): ClassSessionId => Schema.decodeSync(ClassSessionIdSchema)(id),
  random: (): ClassSessionId => ClassSessionIdSchema.pipe(
    Schema.decodeSync
  )(`CS${Math.random().toString().slice(2, 10)}`)
} as const;