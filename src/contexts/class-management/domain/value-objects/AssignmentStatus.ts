import * as Schema from '@effect/schema/Schema';

export enum AssignmentStatusValue {
  Draft = "draft",
  Published = "published",
  Closed = "closed"
}

export const AssignmentStatus = Schema.Enums(AssignmentStatusValue);

export type AssignmentStatus = Schema.Schema.Type<typeof AssignmentStatus>;

export const make = (value: AssignmentStatusValue): AssignmentStatus => 
  Schema.decodeSync(AssignmentStatus)(value);

export const isPublished = (status: AssignmentStatus): boolean => 
  status === AssignmentStatusValue.Published;