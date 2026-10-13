import { getProfileSteps, type Bucket, type ProfileField } from "./entity-profiles";

export interface OnboardingSection {
  title: string;
  fields: ProfileField[];
}

/** Four stages include every questionnaire bucket, without changing profile weights. */
export function getOnboardingSections(entityType: string): OnboardingSection[] {
  const steps = getProfileSteps(entityType);
  const fieldsFor = (buckets: Bucket[]) => steps.filter((s) => buckets.includes(s.bucket)).flatMap((s) => s.fields);
  return [
    { title: "What you offer", fields: fieldsFor(["offering"]) },
    { title: "Your capabilities", fields: fieldsFor(["capabilities"]) },
    { title: "Operations & markets", fields: fieldsFor(["capacity", "markets"]) },
    { title: "Credentials & partnership goals", fields: fieldsFor(["basic", "certifications", "sustainability", "needs"]) },
  ].filter((section) => section.fields.length > 0);
}

export function getOnboardingPages(entityType: string) {
  return getOnboardingSections(entityType).flatMap((section, sectionIndex) => {
    const total = Math.ceil(section.fields.length / 3);
    return Array.from({ length: total }, (_, batch) => ({
      ...section,
      sectionIndex,
      batch,
      total,
      fields: section.fields.slice(batch * 3, batch * 3 + 3),
    }));
  });
}

/** Goal messaging only; dashboard access never depends on this result. */
export function hasReachedProfileGoal(score: number) {
  return score > 80;
}