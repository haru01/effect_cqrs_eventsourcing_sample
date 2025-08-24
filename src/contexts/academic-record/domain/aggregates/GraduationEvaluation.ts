import * as Schema from '@effect/schema/Schema';
import { StudentId, CourseId, CreditUnit } from '@shared/index.js';
import { GraduationStatus } from '../value-objects/index.js';

/**
 * 卒業要件チェックスキーマ
 * 特定の卒業要件項目の充足状況を表現する
 */
export const RequirementCheckSchema = Schema.Struct({
  requirementType: Schema.String.annotations({ title: "要件種別" }),
  required: Schema.Array(CourseId.Schema).annotations({ title: "必要科目" }),
  completed: Schema.Array(CourseId.Schema).annotations({ title: "修了科目" }),
  isSatisfied: Schema.Boolean.annotations({ title: "要件充足フラグ" })
});

export type RequirementCheck = Schema.Schema.Type<typeof RequirementCheckSchema>;

/**
 * 卒業判定スキーマ
 * 学生の卒業要件充足状況と判定結果を管理する集約ルート
 */
export const GraduationEvaluationSchema = Schema.Struct({
  studentId: StudentId.Schema.annotations({ title: "学生ID" }),
  evaluationDate: Schema.Date.annotations({ title: "判定日" }),
  requiredCredits: CreditUnit.Schema.annotations({ title: "必要単位数" }),
  earnedCredits: CreditUnit.Schema.annotations({ title: "取得単位数" }),
  requiredCourses: Schema.Array(RequirementCheckSchema).annotations({ title: "必修科目チェック" }),
  gpaRequirement: Schema.Number.annotations({ title: "必要GPA" }),
  currentGpa: Schema.Number.annotations({ title: "現在GPA" }),
  graduationStatus: GraduationStatus.Schema.annotations({ title: "卒業可否" }),
  deficiencies: Schema.Array(Schema.String).annotations({ title: "不足要件" })
});

export type GraduationEvaluation = Schema.Schema.Type<typeof GraduationEvaluationSchema>;

export const RequirementCheckModule = {
  Schema: RequirementCheckSchema
} as const;

export const GraduationEvaluationModule = {
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

export { GraduationEvaluationModule as GraduationEvaluation, RequirementCheckModule as RequirementCheck };