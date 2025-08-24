import * as Schema from '@effect/schema/Schema';
import { SemesterId } from '@shared/index.js';

export enum PeriodStatusValue {
  Active = "active",
  Closed = "closed",
  Suspended = "suspended"
}

export const PeriodStatusSchema = Schema.Enums(PeriodStatusValue);

export type PeriodStatus = Schema.Schema.Type<typeof PeriodStatusSchema>;

export const RegistrationPeriodSchema = Schema.Struct({
  semesterId: SemesterId.Schema,
  startDate: Schema.Date,
  endDate: Schema.Date,
  dropDeadline: Schema.Date,
  status: PeriodStatusSchema
});

export type RegistrationPeriod = Schema.Schema.Type<typeof RegistrationPeriodSchema>;

export const RegistrationPeriod = {
  Schema: RegistrationPeriodSchema,
  make: (
    semesterId: SemesterId,
    startDate: Date,
    endDate: Date,
    dropDeadline: Date
  ): RegistrationPeriod => ({
    semesterId,
    startDate,
    endDate,
    dropDeadline,
    status: PeriodStatusValue.Active
  }),
  isActive: (period: RegistrationPeriod, now: Date = new Date()): boolean => {
    return period.status === PeriodStatusValue.Active &&
           now >= period.startDate &&
           now <= period.endDate;
  },
  canDrop: (period: RegistrationPeriod, now: Date = new Date()): boolean => {
    return period.status === PeriodStatusValue.Active &&
           now <= period.dropDeadline;
  }
} as const;