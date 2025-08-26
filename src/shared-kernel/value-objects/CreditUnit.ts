import * as Schema from '@effect/schema/Schema';

const CreditUnitSchema = Schema.Number.pipe(
  Schema.brand('CreditUnit'),
  Schema.greaterThanOrEqualTo(0),
  Schema.lessThanOrEqualTo(10), // トータルにもつかうため 10以下はやりすぎ
  Schema.multipleOf(0.5)
);

export type CreditUnit = Schema.Schema.Type<typeof CreditUnitSchema>;

export const CreditUnit = {
  Schema: CreditUnitSchema,
  make: (value: number): CreditUnit => Schema.decodeSync(CreditUnitSchema)(value),
  zero: (): CreditUnit => Schema.decodeSync(CreditUnitSchema)(0),
  add: (a: CreditUnit, b: CreditUnit): CreditUnit =>
    Schema.decodeSync(CreditUnitSchema)(a + b),
  subtract: (a: CreditUnit, b: CreditUnit): CreditUnit => {
    const result = a - b;
    if (result < 0) {
      throw new Error("Credit units cannot be negative");
    }
    return Schema.decodeSync(CreditUnitSchema)(result);
  },
  multiply: (credits: CreditUnit, multiplier: number): CreditUnit =>
    Schema.decodeSync(CreditUnitSchema)(credits * multiplier),
  sum: (credits: CreditUnit[]): CreditUnit =>
    credits.reduce((acc, credit) =>
      Schema.decodeSync(CreditUnitSchema)(acc + credit),
      Schema.decodeSync(CreditUnitSchema)(0)
    )
} as const;