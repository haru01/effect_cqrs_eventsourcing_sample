import * as Schema from '@effect/schema/Schema';

export const AssignmentId = Schema.String.pipe(
  Schema.brand('AssignmentId'),
  Schema.minLength(1),
  Schema.pattern(/^ASG[0-9]{8}$/)
);

export type AssignmentId = Schema.Schema.Type<typeof AssignmentId>;

export const make = (id: string): AssignmentId => Schema.decodeSync(AssignmentId)(id);

export const random = (): AssignmentId => make(`ASG${Math.random().toString().slice(2, 10)}`);