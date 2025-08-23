import * as Schema from '@effect/schema/Schema';

export enum RegistrationStatusValue {
  Draft = "draft",
  Submitted = "submitted", 
  Confirmed = "confirmed",
  Dropped = "dropped"
}

export const RegistrationStatus = Schema.Enums(RegistrationStatusValue);

export type RegistrationStatus = Schema.Schema.Type<typeof RegistrationStatus>;

export const make = (value: RegistrationStatusValue): RegistrationStatus => 
  Schema.decodeSync(RegistrationStatus)(value);

export const isDraft = (status: RegistrationStatus): boolean => 
  status === RegistrationStatusValue.Draft;

export const isSubmitted = (status: RegistrationStatus): boolean => 
  status === RegistrationStatusValue.Submitted;

export const isConfirmed = (status: RegistrationStatus): boolean => 
  status === RegistrationStatusValue.Confirmed;

export const isDropped = (status: RegistrationStatus): boolean => 
  status === RegistrationStatusValue.Dropped;