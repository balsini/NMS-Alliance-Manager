import { describe, expect, it } from "vitest";
import { formatNmsFriendCode, isEmailAddress, isValidNmsFriendCode, normalizeNmsFriendCode } from "./member-types";

describe("normalizeNmsFriendCode", () => {
  it("uppercases and removes spaces and dashes", () => {
    expect(normalizeNmsFriendCode("bmpe-s0b9 rcdmt")).toBe("BMPES0B9RCDMT");
  });
});

describe("formatNmsFriendCode", () => {
  it("groups a full code as 4-4-5", () => {
    expect(formatNmsFriendCode("bmpes0b9rcdmt")).toBe("BMPE-S0B9-RCDMT");
  });

  it("groups partial codes while typing", () => {
    expect(formatNmsFriendCode("bm")).toBe("BM");
    expect(formatNmsFriendCode("bmpes0")).toBe("BMPE-S0");
  });

  it("truncates to 13 characters", () => {
    expect(formatNmsFriendCode("BMPES0B9RCDMTXYZ")).toBe("BMPE-S0B9-RCDMT");
  });

  it("returns an empty string for an empty value", () => {
    expect(formatNmsFriendCode("")).toBe("");
  });
});

describe("isValidNmsFriendCode", () => {
  it("accepts 13 alphanumeric characters, with or without dashes", () => {
    expect(isValidNmsFriendCode("BMPES0B9RCDMT")).toBe(true);
    expect(isValidNmsFriendCode("bmpe-s0b9-rcdmt")).toBe(true);
  });

  it("rejects wrong lengths and symbols", () => {
    expect(isValidNmsFriendCode("BMPES0B9RCDM")).toBe(false);
    expect(isValidNmsFriendCode("BMPES0B9RCDMTX")).toBe(false);
    expect(isValidNmsFriendCode("BMPES0B9RCD!T")).toBe(false);
    expect(isValidNmsFriendCode("")).toBe(false);
  });
});

describe("isEmailAddress", () => {
  it("accepts simple addresses and trims spaces", () => {
    expect(isEmailAddress("user@example.com")).toBe(true);
    expect(isEmailAddress("  user@example.com ")).toBe(true);
  });

  it("rejects values without a domain or with spaces inside", () => {
    expect(isEmailAddress("user")).toBe(false);
    expect(isEmailAddress("user@local")).toBe(false);
    expect(isEmailAddress("us er@example.com")).toBe(false);
  });
});
