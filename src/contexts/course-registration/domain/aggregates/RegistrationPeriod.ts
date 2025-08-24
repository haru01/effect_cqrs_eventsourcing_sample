import * as Schema from '@effect/schema/Schema';
import { SemesterId } from '@shared/index.js';

export enum PeriodStatusValue {
  Active = "active",
  Closed = "closed",
  Suspended = "suspended"
}

export const PeriodStatusSchema = Schema.Enums(PeriodStatusValue);

export type PeriodStatus = Schema.Schema.Type<typeof PeriodStatusSchema>;

/**
 * 履修登録期間スキーマ
 * 学期ごとの履修登録と履修取消の期間を管理する集約ルート
 */
export const RegistrationPeriodSchema = Schema.Struct({
  semesterId: SemesterId.Schema.annotations({ title: "学期ID" }),
  startDate: Schema.Date.annotations({ title: "登録開始日" }),
  endDate: Schema.Date.annotations({ title: "登録終了日" }),
  dropDeadline: Schema.Date.annotations({ title: "履修取消期限" }),
  status: PeriodStatusSchema.annotations({ title: "期間ステータス" })
});

export type RegistrationPeriod = Schema.Schema.Type<typeof RegistrationPeriodSchema>;

export const RegistrationPeriodModule = {
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

export { RegistrationPeriodModule as RegistrationPeriod };