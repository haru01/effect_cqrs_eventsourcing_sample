import * as Schema from '@effect/schema/Schema';

const CourseIdSchema = Schema.String.pipe(
  Schema.brand('CourseId'),
  Schema.minLength(1),
  Schema.pattern(/^[A-Z]{2,4}[0-9]{3,4}$/)
);

export type CourseId = Schema.Schema.Type<typeof CourseIdSchema>;

export const CourseId = {
  Schema: CourseIdSchema,
  make: (id: string): CourseId => Schema.decodeSync(CourseIdSchema)(id),
  random: (): CourseId => {
    const subjects = ['CS', 'MATH', 'ENG', 'PHYS', 'CHEM', 'BIO'];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const number = Math.floor(Math.random() * 900) + 100;
    return CourseIdSchema.pipe(Schema.decodeSync)(`${subject}${number}`);
  }
} as const;