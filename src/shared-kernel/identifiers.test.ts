import { describe, it, expect } from 'vitest';
import { StudentId } from './identifiers/StudentId.js';
import { CourseId } from './identifiers/CourseId.js';
import { InstructorId } from './identifiers/InstructorId.js';
import { SemesterId } from './identifiers/SemesterId.js';

describe('Shared Kernel Identifiers', () => {
  describe('StudentId', () => {
    describe('Given a student identifier format requirement', () => {
      it('When creating with valid STU + 7 digits format Then should succeed', () => {
        const validId = "STU1234567";
        const studentId = StudentId.make(validId);
        expect(studentId).toBe(validId);
      });

      it('When creating with invalid format Then should throw error', () => {
        expect(() => StudentId.make("S12345678")).toThrow();
        expect(() => StudentId.make("STU123456")).toThrow();
        expect(() => StudentId.make("STU12345678")).toThrow();
        expect(() => StudentId.make("1234567")).toThrow();
      });

      it('When generating random StudentId Then should follow STU + 7 digits format', () => {
        const randomId = StudentId.random();
        expect(randomId).toMatch(/^STU[0-9]{7}$/);
      });
    });
  });

  describe('CourseId', () => {
    describe('Given a course identifier format requirement', () => {
      it('When creating with valid subject + number format Then should succeed', () => {
        const validIds = ["CS123", "MATH4567", "ENG101"];
        validIds.forEach(id => {
          const courseId = CourseId.make(id);
          expect(courseId).toBe(id);
        });
      });

      it('When creating with invalid format Then should throw error', () => {
        expect(() => CourseId.make("C123456")).toThrow();
        expect(() => CourseId.make("CS12")).toThrow();
        expect(() => CourseId.make("CS12345")).toThrow();
        expect(() => CourseId.make("123456")).toThrow();
      });

      it('When generating random CourseId Then should follow subject + number format', () => {
        const randomId = CourseId.random();
        expect(randomId).toMatch(/^[A-Z]{2,4}[0-9]{3,4}$/);
      });
    });
  });

  describe('InstructorId', () => {
    describe('Given an instructor identifier format requirement', () => {
      it('When creating with valid INST + 6 digits format Then should succeed', () => {
        const validId = "INST123456";
        const instructorId = InstructorId.make(validId);
        expect(instructorId).toBe(validId);
      });

      it('When creating with invalid format Then should throw error', () => {
        expect(() => InstructorId.make("I123456")).toThrow();
        expect(() => InstructorId.make("INST12345")).toThrow();
        expect(() => InstructorId.make("INST1234567")).toThrow();
        expect(() => InstructorId.make("123456")).toThrow();
      });

      it('When generating random InstructorId Then should follow INST + 6 digits format', () => {
        const randomId = InstructorId.random();
        expect(randomId).toMatch(/^INST[0-9]{6}$/);
      });
    });
  });

  describe('SemesterId', () => {
    describe('Given a semester identifier format requirement', () => {
      it('When creating with valid YYYY-Season format Then should succeed', () => {
        const validIds = ["2024-Spring", "2024-Summer", "2024-Fall"];
        validIds.forEach(id => {
          const semesterId = SemesterId.make(id);
          expect(semesterId).toBe(id);
        });
      });

      it('When creating with invalid format Then should throw error', () => {
        expect(() => SemesterId.make("2024-Winter")).toThrow();
        expect(() => SemesterId.make("24-Spring")).toThrow();
        expect(() => SemesterId.make("2024Spring")).toThrow();
        expect(() => SemesterId.make("Spring-2024")).toThrow();
      });

      it('When creating from year and season Then should follow YYYY-Season format', () => {
        const semesterId = SemesterId.fromYearAndSeason(2024, 'Spring');
        expect(semesterId).toBe("2024-Spring");
      });
    });
  });
});