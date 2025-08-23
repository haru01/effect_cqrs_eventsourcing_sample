import * as Schema from '@effect/schema/Schema';

export enum SessionStatusValue {
  Scheduled = "scheduled",
  InProgress = "in_progress",
  Completed = "completed",
  Cancelled = "cancelled"
}

export const SessionStatus = Schema.Enums(SessionStatusValue);

export type SessionStatus = Schema.Schema.Type<typeof SessionStatus>;

export const make = (value: SessionStatusValue): SessionStatus => 
  Schema.decodeSync(SessionStatus)(value);

export const isActive = (status: SessionStatus): boolean => 
  status === SessionStatusValue.InProgress;