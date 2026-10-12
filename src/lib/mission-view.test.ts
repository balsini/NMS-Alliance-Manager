import { describe, expect, it } from "vitest";
import type { AllianceMember } from "./member-types";
import type { Mission } from "./missions";
import { serializeMission } from "./mission-view";

function makeMember(overrides: Partial<AllianceMember>): AllianceMember {
  return {
    publicId: "m1",
    email: "member@example.com",
    name: "Member",
    image: "",
    nmsName: "",
    nmsCode: "",
    platforms: [],
    specialty: "",
    role: "user",
    membershipStatus: "approved",
    approvedBy: "",
    approvedAt: "",
    lastLogin: "",
    ...overrides,
  };
}

function makeMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: "mission-1",
    title: "Survey",
    description: "",
    system: "Sol",
    systemAddress: "0A1B2C3D4E5F",
    galaxy: 0,
    assignedTo: "",
    targetSpecialty: "all",
    dueDate: "2026-01-01",
    status: "pending",
    priority: "normal",
    progress: 0,
    ...overrides,
  };
}

describe("serializeMission", () => {
  it("keeps plain names", () => {
    const mission = makeMission({ createdByName: "Nick", assignedTo: "Sam" });
    const result = serializeMission(mission, []);
    expect(result.createdByName).toBe("Nick");
    expect(result.assignedTo).toBe("Sam");
  });

  it("replaces an email name with the in-game name of the member", () => {
    const members = [makeMember({ publicId: "m1", nmsName: "Nick" })];
    const result = serializeMission(makeMission({ assignedMemberId: "m1", assignedTo: "nick@example.com" }), members);
    expect(result.assignedTo).toBe("Nick");
  });

  it("falls back to the account name when there is no in-game name", () => {
    const members = [makeMember({ publicId: "c1", name: "Creator" })];
    const result = serializeMission(
      makeMission({ createdByMemberId: "c1", createdByName: "creator@example.com" }),
      members,
    );
    expect(result.createdByName).toBe("Creator");
  });

  it("hides emails of members that no longer exist", () => {
    const result = serializeMission(makeMission({ createdByName: "gone@example.com" }), []);
    expect(result.createdByName).toBe("Former member");
  });

  it("marks an assigned member that was removed as a former member", () => {
    const result = serializeMission(makeMission({ assignedMemberId: "missing", assignedTo: "" }), []);
    expect(result.assignedTo).toBe("Former member");
  });

  it("leaves unassigned missions empty", () => {
    expect(serializeMission(makeMission(), []).assignedTo).toBe("");
  });

  it("does not modify the original mission", () => {
    const mission = makeMission({ createdByName: "gone@example.com" });
    serializeMission(mission, []);
    expect(mission.createdByName).toBe("gone@example.com");
  });
});
