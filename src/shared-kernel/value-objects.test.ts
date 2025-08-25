import { describe, it, expect } from 'vitest';
import { Grade, GradeValue } from './value-objects/Grade.js';
import { CreditUnit } from './value-objects/CreditUnit.js';

describe('Shared Kernel Value Objects', () => {
  describe('Grade', () => {
    describe('Given grade value requirements', () => {
      it('When creating with valid grade values Then should succeed', () => {
        const validGrades = [
          GradeValue.A_PLUS, GradeValue.A, GradeValue.A_MINUS,
          GradeValue.B_PLUS, GradeValue.B, GradeValue.B_MINUS,
          GradeValue.C_PLUS, GradeValue.C, GradeValue.C_MINUS,
          GradeValue.D_PLUS, GradeValue.D,
          GradeValue.F, GradeValue.INCOMPLETE, GradeValue.WITHDRAW
        ];
        
        validGrades.forEach(gradeValue => {
          const grade = Grade.make(gradeValue);
          expect(grade).toBe(gradeValue);
        });
      });

      it('When checking passing grades Then should return correct boolean', () => {
        expect(Grade.isPassing(GradeValue.A_PLUS)).toBe(true);
        expect(Grade.isPassing(GradeValue.A)).toBe(true);
        expect(Grade.isPassing(GradeValue.B)).toBe(true);
        expect(Grade.isPassing(GradeValue.C)).toBe(true);
        expect(Grade.isPassing(GradeValue.D)).toBe(true);
        
        expect(Grade.isPassing(GradeValue.F)).toBe(false);
        expect(Grade.isPassing(GradeValue.INCOMPLETE)).toBe(false);
        expect(Grade.isPassing(GradeValue.WITHDRAW)).toBe(false);
      });

      it('When converting to GPA Then should return correct values', () => {
        expect(Grade.toGPA(GradeValue.A_PLUS)).toBe(4.0);
        expect(Grade.toGPA(GradeValue.A)).toBe(4.0);
        expect(Grade.toGPA(GradeValue.A_MINUS)).toBe(3.7);
        expect(Grade.toGPA(GradeValue.B_PLUS)).toBe(3.3);
        expect(Grade.toGPA(GradeValue.B)).toBe(3.0);
        expect(Grade.toGPA(GradeValue.B_MINUS)).toBe(2.7);
        expect(Grade.toGPA(GradeValue.C_PLUS)).toBe(2.3);
        expect(Grade.toGPA(GradeValue.C)).toBe(2.0);
        expect(Grade.toGPA(GradeValue.C_MINUS)).toBe(1.7);
        expect(Grade.toGPA(GradeValue.D_PLUS)).toBe(1.3);
        expect(Grade.toGPA(GradeValue.D)).toBe(1.0);
        expect(Grade.toGPA(GradeValue.F)).toBe(0.0);
        expect(Grade.toGPA(GradeValue.INCOMPLETE)).toBe(0.0);
        expect(Grade.toGPA(GradeValue.WITHDRAW)).toBe(0.0);
      });
    });
  });

  describe('CreditUnit', () => {
    describe('Given credit unit requirements', () => {
      it('When creating with valid credit values Then should succeed', () => {
        const validCredits = [0, 0.5, 1, 1.5, 2, 3, 4, 6];
        
        validCredits.forEach(credit => {
          const creditUnit = CreditUnit.make(credit);
          expect(creditUnit).toBe(credit);
        });
      });

      it('When creating with invalid values Then should throw error', () => {
        expect(() => CreditUnit.make(-1)).toThrow();
        expect(() => CreditUnit.make(11)).toThrow();
        expect(() => CreditUnit.make(1.3)).toThrow(); // Not multiple of 0.5
      });

      it('When creating zero credit unit Then should return 0', () => {
        const zero = CreditUnit.zero();
        expect(zero).toBe(0);
      });

      it('When adding credit units Then should return correct sum', () => {
        const unit1 = CreditUnit.make(2);
        const unit2 = CreditUnit.make(3);
        const sum = CreditUnit.add(unit1, unit2);
        expect(sum).toBe(5);
      });

      it('When subtracting credit units Then should return correct difference', () => {
        const unit1 = CreditUnit.make(5);
        const unit2 = CreditUnit.make(2);
        const difference = CreditUnit.subtract(unit1, unit2);
        expect(difference).toBe(3);
      });

      it('When subtracting results in negative Then should throw error', () => {
        const unit1 = CreditUnit.make(2);
        const unit2 = CreditUnit.make(5);
        expect(() => CreditUnit.subtract(unit1, unit2)).toThrow();
      });
    });
  });
});