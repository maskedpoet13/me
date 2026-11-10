import { describe, expect, it } from "vitest";
import { isAllowedEmail } from "./allowedEmail";

describe("isAllowedEmail", () => {
  it("accepts the allowed address regardless of case and spaces", () => {
    expect(isAllowedEmail("  Me@Example.com ", "me@example.com")).toBe(true);
  });
  it("rejects other addresses", () => {
    expect(isAllowedEmail("other@example.com", "me@example.com")).toBe(false);
  });
  it("rejects everything when no address is configured", () => {
    expect(isAllowedEmail("me@example.com", undefined)).toBe(false);
    expect(isAllowedEmail("me@example.com", "")).toBe(false);
  });
});
