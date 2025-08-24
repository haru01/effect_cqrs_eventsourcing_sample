import * as Schema from '@effect/schema/Schema';

export enum SessionStatusValue {
  Scheduled = "scheduled",
  InProgress = "in_progress",
  Completed = "completed",
  Cancelled = "cancelled"
}

const SessionStatusSchema = Schema.Enums(SessionStatusValue);

export type SessionStatus = Schema.Schema.Type<typeof SessionStatusSchema>;

export const SessionStatus = {
  Schema: SessionStatusSchema,
  Value: SessionStatusValue,
  make: (value: SessionStatusValue): SessionStatus => 
    Schema.decodeSync(SessionStatusSchema)(value),
  isActive: (status: SessionStatus): boolean => 
    status === SessionStatusValue.InProgress,
  Scheduled: SessionStatusValue.Scheduled,
  InProgress: SessionStatusValue.InProgress,
  Completed: SessionStatusValue.Completed,
  Cancelled: SessionStatusValue.Cancelled
} as const;