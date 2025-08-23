import * as Schema from '@effect/schema/Schema';

export const SemesterId = Schema.String.pipe(
  Schema.brand('SemesterId'),
  Schema.minLength(1),
  Schema.pattern(/^[0-9]{4}-(Spring|Summer|Fall)$/)
);

export type SemesterId = Schema.Schema.Type<typeof SemesterId>;

export const make = (id: string): SemesterId => Schema.decodeSync(SemesterId)(id);

export const fromYearAndSeason = (year: number, season: 'Spring' | 'Summer' | 'Fall'): SemesterId =>
  make(`${year}-${season}`);