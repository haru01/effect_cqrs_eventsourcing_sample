import * as Schema from '@effect/schema/Schema';

export const CreditUnit = Schema.Number.pipe(
  Schema.brand('CreditUnit'),
  Schema.greaterThanOrEqualTo(0),
  Schema.lessThanOrEqualTo(10),
  Schema.multipleOf(0.5)
);

export type CreditUnit = Schema.Schema.Type<typeof CreditUnit>;

export const make = (value: number): CreditUnit => Schema.decodeSync(CreditUnit)(value);

export const zero = (): CreditUnit => make(0);

export const add = (a: CreditUnit, b: CreditUnit): CreditUnit => make(a + b);

export const subtract = (a: CreditUnit, b: CreditUnit): CreditUnit => {
  const result = a - b;
  if (result < 0) {
    throw new Error("Credit units cannot be negative");
  }
  return make(result);
};

export const multiply = (credits: CreditUnit, multiplier: number): CreditUnit => make(credits * multiplier);

export const sum = (credits: CreditUnit[]): CreditUnit => 
  credits.reduce((acc, credit) => add(acc, credit), zero());