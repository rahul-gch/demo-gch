import { describe, it, expect } from "vitest";
import { getProfileDef, withLegacyLocations } from "./entity-profiles";

const ids = (t: string) => getProfileDef(t).fields.map((f) => f.id);

describe("no repeated questions", () => {
  for (const t of ["Manufacturer", "Mill", "Dye House"]) {
    it(`${t} asks capacity once and has one capabilities list`, () => {
      const f = ids(t);
      expect(f.filter((i) => ["capacity", "dyeingCapacity", "monthlyCapacity"].includes(i))).toEqual(["monthlyCapacity"]);
      expect(f).not.toContain("manufacturingCapabilities");
    });
  }
  it("carries old text capacity and capabilities over", () => {
    const a = withLegacyLocations({ capacity: "120,000 pcs / month", manufacturingCapabilities: ["Knitting"] });
    expect(a.monthlyCapacity).toBe(120000);
    expect(a.processCapabilities).toEqual(["Knitting"]);
    expect(a.capacity).toBe("120,000 pcs / month");
  });
});
