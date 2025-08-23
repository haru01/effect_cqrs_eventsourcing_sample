import * as Schema from '@effect/schema/Schema';

export const StudentId = Schema.String.pipe(
  Schema.brand('StudentId'),
  Schema.minLength(1),
  Schema.pattern(/^STU[0-9]{7}$/)
);

export type StudentId = Schema.Schema.Type<typeof StudentId>;

export const make = (id: string): StudentId => Schema.decodeSync(StudentId)(id);

export const random = (): StudentId => make(`STU${Math.random().toString().slice(2, 9)}`);