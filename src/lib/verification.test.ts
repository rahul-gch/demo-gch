import { describe, expect, it } from "vitest";
import { canSetVerificationStatus, validateVerificationFile, verificationChoiceValid } from "./verification";

describe("business verification rules", () => {
  it("requires a document or the upload-later choice", () => {
    expect(verificationChoiceValid(null, false)).toBe(false);
    expect(verificationChoiceValid(null, true)).toBe(true);
    expect(verificationChoiceValid({ size: 1000, type: "application/pdf" }, false)).toBe(true);
  });
  it("rejects files over 10 MB", () => {
    expect(validateVerificationFile({ size: 10 * 1024 * 1024 + 1, type: "application/pdf" })).not.toBeNull();
    expect(validateVerificationFile({ size: 10 * 1024 * 1024, type: "image/png" })).toBeNull();
  });
  it("only platform admins can approve or reject", () => {
    expect(canSetVerificationStatus("verified", false)).toBe(false);
    expect(canSetVerificationStatus("rejected", false)).toBe(false);
    expect(canSetVerificationStatus("verified", true)).toBe(true);
  });
});
