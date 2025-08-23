import * as Schema from '@effect/schema/Schema';

export enum AcademicStatusValue {
  GoodStanding = "good_standing",
  Warning = "warning",
  Probation = "probation"
}

export const AcademicStatus = Schema.Enums(AcademicStatusValue);

export type AcademicStatus = Schema.Schema.Type<typeof AcademicStatus>;

export const make = (value: AcademicStatusValue): AcademicStatus => 
  Schema.decodeSync(AcademicStatus)(value);

export const isGoodStanding = (status: AcademicStatus): boolean => 
  status === AcademicStatusValue.GoodStanding;