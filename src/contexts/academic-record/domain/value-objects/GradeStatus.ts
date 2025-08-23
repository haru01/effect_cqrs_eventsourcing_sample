import * as Schema from '@effect/schema/Schema';

export enum GradeStatusValue {
  NotEntered = "not_entered",
  Entered = "entered",
  Finalized = "finalized",
  Published = "published"
}

export const GradeStatus = Schema.Enums(GradeStatusValue);

export type GradeStatus = Schema.Schema.Type<typeof GradeStatus>;

export const make = (value: GradeStatusValue): GradeStatus => 
  Schema.decodeSync(GradeStatus)(value);

export const isFinalized = (status: GradeStatus): boolean => 
  status === GradeStatusValue.Finalized || status === GradeStatusValue.Published;