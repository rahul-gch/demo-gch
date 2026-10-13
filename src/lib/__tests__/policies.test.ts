import { describe, expect, it } from "vitest";
import { validatePassword } from "../policies";

describe("password policy", () => {
  it("rejects passwords shorter than 8 characters", () => {
    expect(validatePassword("abc1234")).not.toBeNull();
  });
  it("accepts any password of 8 characters", () => {
    expect(validatePassword("abcdefgh")).toBeNull();
  });
});
