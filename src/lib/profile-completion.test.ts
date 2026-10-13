import { describe, expect, it } from "vitest";
import { ENTITY_TYPES, getProfileSteps } from "./entity-profiles";
import { getRemainingProfileSteps } from "./profile-completion";

describe("optional entity-specific profile completion", () => {
  it.each(ENTITY_TYPES)("includes every unanswered non-basic question for %s", (type) => {
    expect(getRemainingProfileSteps(type, {})).toEqual(getProfileSteps(type).filter((s) => s.bucket !== "basic"));
  });
  it("keeps skipped questions and excludes saved answers", () => {
    const steps = getProfileSteps("Manufacturer").filter((s) => s.bucket !== "basic");
    const first = steps[0]?.fields[0];
    if (!first) throw new Error("Manufacturer must have onboarding questions");
    const remaining = getRemainingProfileSteps("Manufacturer", { [first.id]: ["Denim"] });
    expect(remaining.flatMap((s) => s.fields).some((f) => f.id === first.id)).toBe(false);
    expect(remaining.flatMap((s) => s.fields).length).toBe(steps.flatMap((s) => s.fields).length - 1);
  });
});