import * as Schema from '@effect/schema/Schema';

const SemesterIdSchema = Schema.String.pipe(
  Schema.brand('SemesterId'),
  Schema.minLength(1),
  Schema.pattern(/^[0-9]{4}-(Spring|Summer|Fall)$/)
);

export type SemesterId = Schema.Schema.Type<typeof SemesterIdSchema>;

export const SemesterId = {
  Schema: SemesterIdSchema,
  make: (id: string): SemesterId => Schema.decodeSync(SemesterIdSchema)(id),
  fromYearAndSeason: (year: number, season: 'Spring' | 'Summer' | 'Fall'): SemesterId =>
    SemesterIdSchema.pipe(Schema.decodeSync)(`${year}-${season}`)
} as const;