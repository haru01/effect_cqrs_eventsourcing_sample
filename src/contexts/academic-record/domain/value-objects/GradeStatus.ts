import * as Schema from '@effect/schema/Schema';

export enum GradeStatusValue {
  NotEntered = "not_entered",
  Entered = "entered",
  Finalized = "finalized",
  Published = "published"
}

const GradeStatusSchema = Schema.Enums(GradeStatusValue);

export type GradeStatus = Schema.Schema.Type<typeof GradeStatusSchema>;

export const GradeStatus = {
  Schema: GradeStatusSchema,
  Value: GradeStatusValue,
  make: (value: GradeStatusValue): GradeStatus => 
    Schema.decodeSync(GradeStatusSchema)(value),
  isFinalized: (status: GradeStatus): boolean => 
    status === GradeStatusValue.Finalized || status === GradeStatusValue.Published,
  NotEntered: GradeStatusValue.NotEntered,
  Entered: GradeStatusValue.Entered,
  Finalized: GradeStatusValue.Finalized,
  Published: GradeStatusValue.Published
} as const;