import { describe, expect, it } from "vitest";
import { isValidNmsFriendCode } from "@/lib/member-types";
import { findLocalAccount, getLocalAccountOptions, localAccounts } from "./local-auth";

describe("localAccounts", () => {
  it("has a unique email and specialty pair for every login", () => {
    const logins = localAccounts.map((account) => `${account.email}:${account.specialty}`);
    expect(new Set(logins).size).toBe(logins.length);
  });

  it("has a unique label for every login", () => {
    const labels = localAccounts.map((account) => account.label ?? account.name);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("recognizes every variant of the same email as the same member", () => {
    const byEmail = Map.groupBy(localAccounts, (account) => account.email);
    for (const accounts of byEmail.values()) {
      for (const field of ["name", "nmsName", "nmsCode", "role"] as const) {
        expect(new Set(accounts.map((account) => account[field])).size).toBe(1);
      }
    }
  });

  it("gives each member a unique in-game name and friend code", () => {
    const members = [...Map.groupBy(localAccounts, (account) => account.email).values()].map((accounts) => accounts[0]);
    for (const field of ["nmsName", "nmsCode"] as const) {
      const values = members.map((member) => member[field].toLowerCase());
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it("uses valid NMS friend codes", () => {
    for (const account of localAccounts) expect(isValidNmsFriendCode(account.nmsCode)).toBe(true);
  });
});

describe("findLocalAccount", () => {
  const admins = localAccounts.filter((account) => account.role === "admin");

  it("offers one admin login per specialty", () => {
    expect(admins.map((account) => account.specialty)).toEqual(["ranger", "explorer", "builder"]);
  });

  it("selects the admin variant matching the requested specialty", () => {
    for (const admin of admins) {
      expect(findLocalAccount(admin.email, admin.specialty)?.specialty).toBe(admin.specialty);
    }
  });

  it("falls back to the first variant without a specialty", () => {
    expect(findLocalAccount(admins[0].email)?.specialty).toBe(admins[0].specialty);
  });

  it("ignores unknown emails", () => {
    expect(findLocalAccount("nobody@local")).toBeUndefined();
    expect(findLocalAccount(undefined)).toBeUndefined();
  });
});

describe("getLocalAccountOptions", () => {
  it("is disabled unless LOCAL_AUTH is true", () => {
    expect(getLocalAccountOptions()).toBeUndefined();
  });
});
