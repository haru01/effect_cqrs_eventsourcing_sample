import * as Schema from '@effect/schema/Schema';

export enum RegistrationStatusValue {
  Draft = "draft",
  Submitted = "submitted",
  Confirmed = "confirmed",
  Dropped = "dropped"
}

const RegistrationStatusSchema = Schema.Enums(RegistrationStatusValue);

export type RegistrationStatus = Schema.Schema.Type<typeof RegistrationStatusSchema>;

export const RegistrationStatus = {
  Schema: RegistrationStatusSchema,
  Value: RegistrationStatusValue,
  make: (value: RegistrationStatusValue): RegistrationStatus =>
    Schema.decodeSync(RegistrationStatusSchema)(value),
  isDraft: (status: RegistrationStatus): boolean =>
    status === RegistrationStatusValue.Draft,
  isSubmitted: (status: RegistrationStatus): boolean =>
    status === RegistrationStatusValue.Submitted,
  isConfirmed: (status: RegistrationStatus): boolean =>
    status === RegistrationStatusValue.Confirmed,
  isDropped: (status: RegistrationStatus): boolean =>
    status === RegistrationStatusValue.Dropped,
  Draft: RegistrationStatusValue.Draft,
  Submitted: RegistrationStatusValue.Submitted,
  Confirmed: RegistrationStatusValue.Confirmed,
  Dropped: RegistrationStatusValue.Dropped
} as const;