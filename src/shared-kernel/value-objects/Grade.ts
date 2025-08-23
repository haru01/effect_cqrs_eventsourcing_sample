import * as Schema from '@effect/schema/Schema';

export enum GradeValue {
  A_PLUS = "A+",
  A = "A",
  A_MINUS = "A-", 
  B_PLUS = "B+",
  B = "B",
  B_MINUS = "B-",
  C_PLUS = "C+",
  C = "C",
  C_MINUS = "C-",
  D_PLUS = "D+",
  D = "D",
  F = "F",
  INCOMPLETE = "I",
  WITHDRAW = "W"
}

export const Grade = Schema.Enums(GradeValue);

export type Grade = Schema.Schema.Type<typeof Grade>;

export const make = (value: GradeValue): Grade => Schema.decodeSync(Grade)(value);

export const isPassing = (grade: Grade): boolean => {
  return grade !== GradeValue.F && grade !== GradeValue.INCOMPLETE && grade !== GradeValue.WITHDRAW;
};

export const toGPA = (grade: Grade): number => {
  const gpaMap: Record<GradeValue, number> = {
    [GradeValue.A_PLUS]: 4.0,
    [GradeValue.A]: 4.0,
    [GradeValue.A_MINUS]: 3.7,
    [GradeValue.B_PLUS]: 3.3,
    [GradeValue.B]: 3.0,
    [GradeValue.B_MINUS]: 2.7,
    [GradeValue.C_PLUS]: 2.3,
    [GradeValue.C]: 2.0,
    [GradeValue.C_MINUS]: 1.7,
    [GradeValue.D_PLUS]: 1.3,
    [GradeValue.D]: 1.0,
    [GradeValue.F]: 0.0,
    [GradeValue.INCOMPLETE]: 0.0,
    [GradeValue.WITHDRAW]: 0.0
  };
  return gpaMap[grade];
};