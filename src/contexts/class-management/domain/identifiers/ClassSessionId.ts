import * as Schema from '@effect/schema/Schema';

export const ClassSessionId = Schema.String.pipe(
  Schema.brand('ClassSessionId'),
  Schema.minLength(1),
  Schema.pattern(/^CS[0-9]{8}$/)
);

export type ClassSessionId = Schema.Schema.Type<typeof ClassSessionId>;

export const make = (id: string): ClassSessionId => Schema.decodeSync(ClassSessionId)(id);

export const random = (): ClassSessionId => make(`CS${Math.random().toString().slice(2, 10)}`);