import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, CreditUnit } from '@shared/index.js';
import { GraduationStatus } from '../value-objects/index.js';

export const RequirementCheckSchema = Schema.Struct({
  requirementType: Schema.String,
  required: Schema.Array(CourseId.Schema),
  completed: Schema.Array(CourseId.Schema),
  isSatisfied: Schema.Boolean
});

export type RequirementCheck = Schema.Schema.Type<typeof RequirementCheckSchema>;

export const GraduationEvaluationSchema = Schema.Struct({
  studentId: StudentId.Schema,
  evaluationDate: Schema.Date,
  requiredCredits: CreditUnit.Schema,
  earnedCredits: CreditUnit.Schema,
  requiredCourses: Schema.Array(RequirementCheckSchema),
  gpaRequirement: Schema.Number,
  currentGpa: Schema.Number,
  graduationStatus: GraduationStatus.Schema,
  deficiencies: Schema.Array(Schema.String)
});

export type GraduationEvaluation = Schema.Schema.Type<typeof GraduationEvaluationSchema>;

export const RequirementCheck = {
  Schema: RequirementCheckSchema
} as const;

export const GraduationEvaluation = {
  Schema: GraduationEvaluationSchema,
  make: (
    studentId: StudentId,
    requiredCredits: CreditUnit,
    earnedCredits: CreditUnit,
    currentGpa: number,
    gpaRequirement: number = 2.0
  ): GraduationEvaluation => {
    const deficiencies: string[] = [];
    let status = GraduationStatus.Value.Eligible;

    if (earnedCredits < requiredCredits) {
      deficiencies.push(`Insufficient credits: ${earnedCredits}/${requiredCredits}`);
      status = GraduationStatus.Value.NotEligible;
    }

    if (currentGpa < gpaRequirement) {
      deficiencies.push(`GPA below requirement: ${currentGpa}/${gpaRequirement}`);
      status = GraduationStatus.Value.NotEligible;
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
  },
  addRequirementCheck: (
    evaluation: GraduationEvaluation,
    requirement: RequirementCheck
  ): GraduationEvaluation => {
    const updatedRequirements = [...evaluation.requiredCourses, requirement];

    let status = evaluation.graduationStatus;
    let deficiencies = [...evaluation.deficiencies];

    if (!requirement.isSatisfied) {
      deficiencies.push(`Missing ${requirement.requirementType} requirements`);
      status = GraduationStatus.Value.NotEligible;
    }

    return {
      ...evaluation,
      requiredCourses: updatedRequirements,
      graduationStatus: status,
      deficiencies
    };
  }
} as const;