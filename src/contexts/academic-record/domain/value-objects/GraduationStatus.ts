import * as Schema from '@effect/schema/Schema';

export enum GraduationStatusValue {
  Eligible = "eligible",
  NotEligible = "not_eligible",
  Graduated = "graduated"
}

const GraduationStatusSchema = Schema.Enums(GraduationStatusValue);

export type GraduationStatus = Schema.Schema.Type<typeof GraduationStatusSchema>;

export const GraduationStatus = {
  Schema: GraduationStatusSchema,
  Value: GraduationStatusValue,
  make: (value: GraduationStatusValue): GraduationStatus => 
    Schema.decodeSync(GraduationStatusSchema)(value),
  canGraduate: (status: GraduationStatus): boolean => 
    status === GraduationStatusValue.Eligible,
  Eligible: GraduationStatusValue.Eligible,
  NotEligible: GraduationStatusValue.NotEligible,
  Graduated: GraduationStatusValue.Graduated
} as const;