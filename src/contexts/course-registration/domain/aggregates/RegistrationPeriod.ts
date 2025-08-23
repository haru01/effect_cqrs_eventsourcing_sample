import * as Schema from '@effect/schema/Schema';
import { SemesterId } from '@shared/index.js';

export enum PeriodStatusValue {
  Active = "active",
  Closed = "closed", 
  Suspended = "suspended"
}

export const PeriodStatus = Schema.Enums(PeriodStatusValue);

export type PeriodStatus = Schema.Schema.Type<typeof PeriodStatus>;

export const RegistrationPeriod = Schema.Struct({
  semesterId: SemesterId.SemesterId,
  startDate: Schema.Date,
  endDate: Schema.Date,
  dropDeadline: Schema.Date,
  status: PeriodStatus
});

export type RegistrationPeriod = Schema.Schema.Type<typeof RegistrationPeriod>;

export const make = (
  semesterId: SemesterId.SemesterId,
  startDate: Date,
  endDate: Date,
  dropDeadline: Date
): RegistrationPeriod => ({
  semesterId,
  startDate,
  endDate,
  dropDeadline,
  status: PeriodStatusValue.Active
});

export const isActive = (period: RegistrationPeriod, now: Date = new Date()): boolean => {
  return period.status === PeriodStatusValue.Active &&
         now >= period.startDate &&
         now <= period.endDate;
};

export const canDrop = (period: RegistrationPeriod, now: Date = new Date()): boolean => {
  return period.status === PeriodStatusValue.Active &&
         now <= period.dropDeadline;
};