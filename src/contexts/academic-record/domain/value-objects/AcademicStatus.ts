import * as Schema from '@effect/schema/Schema';

export enum AcademicStatusValue {
  GoodStanding = "good_standing",
  Warning = "warning",
  Probation = "probation"
}

const AcademicStatusSchema = Schema.Enums(AcademicStatusValue);

export type AcademicStatus = Schema.Schema.Type<typeof AcademicStatusSchema>;

export const AcademicStatus = {
  Schema: AcademicStatusSchema,
  Value: AcademicStatusValue,
  make: (value: AcademicStatusValue): AcademicStatus =>
    Schema.decodeSync(AcademicStatusSchema)(value),
  isGoodStanding: (status: AcademicStatus): boolean =>
    status === AcademicStatusValue.GoodStanding,
  GoodStanding: AcademicStatusValue.GoodStanding,
  Warning: AcademicStatusValue.Warning,
  Probation: AcademicStatusValue.Probation
} as const;