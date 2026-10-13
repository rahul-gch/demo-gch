import { describe, expect, it } from "vitest";
import { getProfileSteps, normalizeEntityType, SIGNUP_ENTITY_TYPES } from "./entity-profiles";
import { getRemainingProfileSteps } from "./profile-completion";
import { isManufacturerOrg } from "./org-types";

describe("organization registration types", () => {
  it("excludes Supplier from new registrations", () => {
    expect(SIGNUP_ENTITY_TYPES).not.toContain("Supplier");
  });
  it("keeps Seed excluded", () => {
    expect(SIGNUP_ENTITY_TYPES).not.toContain("Seed");
  });
  it.each(["Trims / Accessories", "Agent", "Recycling Company"])("allows %s", (type) => {
    expect(SIGNUP_ENTITY_TYPES).toContain(type);
    expect(normalizeEntityType(type)).toBe(type);
  });
  it.each([
    ["Trader / Agent", "Agent"],
    ["Trims & Accessories Supplier", "Trims / Accessories"],
    ["Recycler", "Recycling Company"],
  ])("normalizes %s to %s", (legacy, type) => {
    expect(normalizeEntityType(legacy)).toBe(type);
  });
  it("preserves the legacy Supplier questionnaire", () => {
    expect(normalizeEntityType("Supplier")).toBe("Supplier");
    expect(getProfileSteps("Supplier").flatMap((step) => step.fields).map((field) => field.id)).toContain("productsSupplied");
  });
  it.each([
    ["Trims / Accessories", "trimCapabilities"],
    ["Agent", "agentServices"],
    ["Recycling Company", "recyclingProcesses"],
  ])("provides relevant setup and remaining questions for %s", (type, fieldId) => {
    const steps = getProfileSteps(type);
    expect(steps.slice(0, 2).flatMap((step) => step.fields).map((field) => field.id)).toContain(fieldId);
    const remaining = getRemainingProfileSteps(type, { [fieldId]: ["Saved answer"] });
    expect(remaining.flatMap((step) => step.fields).map((field) => field.id)).not.toContain(fieldId);
    expect(remaining.flatMap((step) => step.fields).map((field) => field.id)).toContain("marketsServed");
  });
  it.each(["Trims / Accessories", "Recycling Company"])("retains showroom eligibility for %s", (type) => {
    expect(isManufacturerOrg({ organizationType: type })).toBe(true);
  });
});