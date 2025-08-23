import * as Schema from '@effect/schema/Schema';

export enum CourseTypeValue {
  Required = "required",
  Elective = "elective", 
  General = "general"
}

export const CourseType = Schema.Enums(CourseTypeValue);

export type CourseType = Schema.Schema.Type<typeof CourseType>;

export const make = (value: CourseTypeValue): CourseType => 
  Schema.decodeSync(CourseType)(value);

export const isRequired = (type: CourseType): boolean => 
  type === CourseTypeValue.Required;