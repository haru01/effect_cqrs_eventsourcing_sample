import * as Schema from '@effect/schema/Schema';

export const InstructorId = Schema.String.pipe(
  Schema.brand('InstructorId'),
  Schema.minLength(1),
  Schema.pattern(/^INST[0-9]{6}$/)
);

export type InstructorId = Schema.Schema.Type<typeof InstructorId>;

export const make = (id: string): InstructorId => Schema.decodeSync(InstructorId)(id);

export const random = (): InstructorId => make(`INST${Math.random().toString().slice(2, 8)}`);