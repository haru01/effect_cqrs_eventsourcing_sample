import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, CreditUnit } from '@shared/index.js';
import { GraduationStatus } from '../value-objects/index.js';

export const RequirementCheck = Schema.Struct({
  requirementType: Schema.String,
  required: Schema.Array(CourseId.CourseId),
  completed: Schema.Array(CourseId.CourseId),
  isSatisfied: Schema.Boolean
});

export type RequirementCheck = Schema.Schema.Type<typeof RequirementCheck>;

export const GraduationEvaluation = Schema.Struct({
  studentId: StudentId.StudentId,
  evaluationDate: Schema.Date,
  requiredCredits: CreditUnit.CreditUnit,
  earnedCredits: CreditUnit.CreditUnit,
  requiredCourses: Schema.Array(RequirementCheck),
  gpaRequirement: Schema.Number,
  currentGpa: Schema.Number,
  graduationStatus: GraduationStatus.GraduationStatus,
  deficiencies: Schema.Array(Schema.String)
});

export type GraduationEvaluation = Schema.Schema.Type<typeof GraduationEvaluation>;

export const make = (
  studentId: StudentId.StudentId,
  requiredCredits: CreditUnit.CreditUnit,
  earnedCredits: CreditUnit.CreditUnit,
  currentGpa: number,
  gpaRequirement: number = 2.0
): GraduationEvaluation => {
  const deficiencies: string[] = [];
  let status = GraduationStatus.GraduationStatusValue.Eligible;

  if (earnedCredits < requiredCredits) {
    deficiencies.push(`Insufficient credits: ${earnedCredits}/${requiredCredits}`);
    status = GraduationStatus.GraduationStatusValue.NotEligible;
  }

  if (currentGpa < gpaRequirement) {
    deficiencies.push(`GPA below requirement: ${currentGpa}/${gpaRequirement}`);
    status = GraduationStatus.GraduationStatusValue.NotEligible;
  }

  return {
    studentId,
    evaluationDate: new Date(),
    requiredCredits,
    earnedCredits,
    requiredCourses: [],
    gpaRequirement,
    currentGpa,
    graduationStatus: status,
    deficiencies
  };
};

export const addRequirementCheck = (
  evaluation: GraduationEvaluation,
  requirement: RequirementCheck
): GraduationEvaluation => {
  const updatedRequirements = [...evaluation.requiredCourses, requirement];
  const allSatisfied = updatedRequirements.every(req => req.isSatisfied);
  
  let status = evaluation.graduationStatus;
  let deficiencies = [...evaluation.deficiencies];
  
  if (!requirement.isSatisfied) {
    deficiencies.push(`Missing ${requirement.requirementType} requirements`);
    status = GraduationStatus.GraduationStatusValue.NotEligible;
  }

  return {
    ...evaluation,
    requiredCourses: updatedRequirements,
    graduationStatus: status,
    deficiencies
  };
};