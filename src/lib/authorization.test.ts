import { describe, expect, it, vi } from "vitest";
import type { AllianceMember } from "./member-types";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { hasRole } = await import("./authorization");

function memberWithRole(role: AllianceMember["role"]) {
  return { role } as AllianceMember;
}

describe("hasRole", () => {
  it("denies a missing member", () => {
    expect(hasRole(null, "user")).toBe(false);
  });

  it("follows the order user, moderator, admin", () => {
    expect(hasRole(memberWithRole("user"), "user")).toBe(true);
    expect(hasRole(memberWithRole("user"), "moderator")).toBe(false);
    expect(hasRole(memberWithRole("moderator"), "moderator")).toBe(true);
    expect(hasRole(memberWithRole("moderator"), "admin")).toBe(false);
    expect(hasRole(memberWithRole("admin"), "moderator")).toBe(true);
    expect(hasRole(memberWithRole("admin"), "admin")).toBe(true);
  });
});
