import * as Schema from '@effect/schema/Schema';

export enum CourseTypeValue {
  Required = "required",
  Elective = "elective", 
  General = "general"
}

const CourseTypeSchema = Schema.Enums(CourseTypeValue);

export type CourseType = Schema.Schema.Type<typeof CourseTypeSchema>;

export const CourseType = {
  Schema: CourseTypeSchema,
  Value: CourseTypeValue,
  make: (value: CourseTypeValue): CourseType => 
    Schema.decodeSync(CourseTypeSchema)(value),
  isRequired: (type: CourseType): boolean => 
    type === CourseTypeValue.Required,
  Required: CourseTypeValue.Required,
  Elective: CourseTypeValue.Elective,
  General: CourseTypeValue.General
} as const;