import { describe, expect, it } from "vitest";
import { getProfileDef, isAnswered } from "./entity-profiles";

const ids = (t: string) => getProfileDef(t).fields.map((f) => f.id);
const opts = (t: string, id: string) => getProfileDef(t).fields.find((f) => f.id === id)?.options ?? [];

describe("textile entity questions", () => {
  it("Manufacturer has process capabilities, monthly capacity, locations", () => {
    expect(ids("Manufacturer")).toEqual(expect.arrayContaining(["processCapabilities", "monthlyCapacity", "locations"]));
    expect(opts("Manufacturer", "productsManufactured")).toEqual(expect.arrayContaining(["T-shirts", "Polo shirts", "Shorts"]));
  });
  it("Dye House has all six new groups", () => {
    expect(ids("Dye House")).toEqual(expect.arrayContaining(["dyeFacilityType", "printingTypes", "mechanicalFinishing", "chemicalFinishing", "garmentWashing", "environmentalInfrastructure"]));
  });
  it("Mill has facility type, materials, services", () => {
    expect(ids("Mill")).toEqual(expect.arrayContaining(["millFacilityType", "millMaterials", "inHouseServices", "fabricConstruction"]));
    expect(opts("Mill", "fabricTypes")).toEqual(expect.arrayContaining(["Jersey knit", "Chambray", "French terry"]));
  });
  it("a location counts only with a city or country", () => {
    expect(isAnswered([{ name: "Plant A" }])).toBe(false);
    expect(isAnswered([{ city: "Dhaka" }])).toBe(true);
  });
});
