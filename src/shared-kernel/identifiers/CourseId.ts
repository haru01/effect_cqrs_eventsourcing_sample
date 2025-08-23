import * as Schema from '@effect/schema/Schema';

export const CourseId = Schema.String.pipe(
  Schema.brand('CourseId'),
  Schema.minLength(1),
  Schema.pattern(/^[A-Z]{2,4}[0-9]{3,4}$/)
);

export type CourseId = Schema.Schema.Type<typeof CourseId>;

export const make = (id: string): CourseId => Schema.decodeSync(CourseId)(id);

export const random = (): CourseId => {
  const subjects = ['CS', 'MATH', 'ENG', 'PHYS', 'CHEM', 'BIO'];
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  const number = Math.floor(Math.random() * 900) + 100;
  return make(`${subject}${number}`);
};