import { describe, expect, it } from "vitest";
import { ENTITY_TYPES, getProfileDef, type ProfileAnswers } from "./entity-profiles";
import { computeProfileScore } from "./profile-score";
import { canFinishOnboarding, getOnboardingPages, getOnboardingSections } from "./onboarding-sections";

describe("extended optional onboarding", () => {
  it.each(ENTITY_TYPES)("exposes every question once for %s", (type) => {
    const expected = getProfileDef(type).fields.map((f) => f.id).sort();
    const actual = getOnboardingPages(type).flatMap((p) => p.fields.map((f) => f.id)).sort();
    expect(actual).toEqual(expected);
    expect(getOnboardingSections(type).length).toBeLessThanOrEqual(4);
    expect(getOnboardingPages(type).every((p) => p.fields.length <= 3)).toBe(true);
  });
  it.each(ENTITY_TYPES)("can exceed 80% with complete answers for %s", (type) => {
    const answers: ProfileAnswers = {};
    for (const f of getProfileDef(type).fields) answers[f.id] = f.kind === "multi" ? [f.options?.[0] ?? "Cotton"] : f.kind === "number" ? 10 : f.options?.[0] ?? "Test value";
    expect(computeProfileScore(type, answers, { description: "Textile company", website: "https://example.org", city: "Berlin", country: "Germany" }).score).toBeGreaterThan(80);
  });
  it("permits finishing below 80%", () => {
    expect(canFinishOnboarding(0)).toBe(true);
    expect(canFinishOnboarding(79)).toBe(true);
    expect(canFinishOnboarding(81)).toBe(true);
  });
});