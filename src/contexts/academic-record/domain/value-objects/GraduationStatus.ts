import * as Schema from '@effect/schema/Schema';

export enum GraduationStatusValue {
  Eligible = "eligible",
  NotEligible = "not_eligible",
  Graduated = "graduated"
}

export const GraduationStatus = Schema.Enums(GraduationStatusValue);

export type GraduationStatus = Schema.Schema.Type<typeof GraduationStatus>;

export const make = (value: GraduationStatusValue): GraduationStatus => 
  Schema.decodeSync(GraduationStatus)(value);

export const canGraduate = (status: GraduationStatus): boolean => 
  status === GraduationStatusValue.Eligible;