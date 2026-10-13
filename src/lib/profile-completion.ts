import { getProfileSteps, isAnswered, type ProfileAnswers } from "./entity-profiles";

export function getRemainingProfileSteps(entityType: string, answers: ProfileAnswers) {
  return getProfileSteps(entityType)
    .filter((step) => step.bucket !== "basic")
    .map((step) => ({ ...step, fields: step.fields.filter((field) => !isAnswered(answers[field.id])) }))
    .filter((step) => step.fields.length > 0);
}