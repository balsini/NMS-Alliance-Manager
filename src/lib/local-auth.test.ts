import { afterEach, describe, expect, it, vi } from "vitest";
import { isValidNmsFriendCode } from "@/lib/member-types";
import { editableLocalAccounts, findLocalAccount, getLocalAccountOptions, isFixedLocalAccount, localAccounts } from "./local-auth";

describe("localAccounts", () => {
  it.each(["email", "nmsName", "nmsCode"] as const)("has a unique %s for every account", (field) => {
    const values = localAccounts.map((account) => account[field].toLowerCase());
    expect(new Set(values).size).toBe(values.length);
  });

  it("uses valid NMS friend codes", () => {
    for (const account of localAccounts) expect(isValidNmsFriendCode(account.nmsCode)).toBe(true);
  });

  it("has a main admin with explorer as the default specialty", () => {
    const [mainAdmin] = localAccounts.filter((account) => account.role === "admin");
    expect(mainAdmin.specialty).toBe("explorer");
  });
});

describe("findLocalAccount", () => {
  it("finds an account by email, ignoring case and spaces", () => {
    const account = localAccounts[0];
    expect(findLocalAccount(` ${account.email.toUpperCase()} `)).toBe(account);
  });

  it("ignores unknown emails", () => {
    expect(findLocalAccount("nobody@local")).toBeUndefined();
    expect(findLocalAccount(undefined)).toBeUndefined();
  });
});

describe("isFixedLocalAccount", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("fixes every local account except the editable ones when local login is on", () => {
    vi.stubEnv("LOCAL_AUTH", "true");
    for (const email of editableLocalAccounts) {
      expect(isFixedLocalAccount(email)).toBe(false);
      expect(isFixedLocalAccount(` ${email.toUpperCase()} `)).toBe(false);
    }
    for (const account of localAccounts.filter((item) => !editableLocalAccounts.includes(item.email))) {
      expect(isFixedLocalAccount(account.email)).toBe(true);
    }
  });

  it("never affects Google users", () => {
    vi.stubEnv("LOCAL_AUTH", "true");
    expect(isFixedLocalAccount("someone@gmail.com")).toBe(false);
  });

  it("is off when local login is disabled", () => {
    vi.stubEnv("LOCAL_AUTH", "false");
    expect(isFixedLocalAccount("moderator@local")).toBe(false);
  });
});

describe("getLocalAccountOptions", () => {
  it("is disabled unless LOCAL_AUTH is true", () => {
    expect(getLocalAccountOptions()).toBeUndefined();
  });
});
