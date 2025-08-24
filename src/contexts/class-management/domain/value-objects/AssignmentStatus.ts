import * as Schema from '@effect/schema/Schema';

export enum AssignmentStatusValue {
  Draft = "draft",
  Published = "published",
  Closed = "closed"
}

const AssignmentStatusSchema = Schema.Enums(AssignmentStatusValue);

export type AssignmentStatus = Schema.Schema.Type<typeof AssignmentStatusSchema>;

export const AssignmentStatus = {
  Schema: AssignmentStatusSchema,
  Value: AssignmentStatusValue,
  make: (value: AssignmentStatusValue): AssignmentStatus => 
    Schema.decodeSync(AssignmentStatusSchema)(value),
  isPublished: (status: AssignmentStatus): boolean => 
    status === AssignmentStatusValue.Published,
  Draft: AssignmentStatusValue.Draft,
  Published: AssignmentStatusValue.Published,
  Closed: AssignmentStatusValue.Closed
} as const;