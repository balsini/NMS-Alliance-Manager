import { describe, expect, it } from "vitest";
import {
  canViewMission,
  coveredSpecialties,
  decodePortalAddress,
  isDifferentPlanetInSameSystem,
  isMissionInput,
  isMissionPriority,
  isMissionStatus,
  normalizeMissionPriority,
  normalizeMissionStatus,
  portalSearchMatches,
  specialtyAlreadyCovered,
  type Mission,
} from "./missions";

const portal = "0A1B2C3D4E5F";

function makeMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: "mission-1",
    title: "Survey",
    description: "",
    system: "Sol",
    systemAddress: portal,
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

function makeInput(overrides: Record<string, unknown> = {}) {
  const { id, ...input } = makeMission();
  void id;
  return { ...input, ...overrides };
}

describe("normalizeMissionStatus", () => {
  it("keeps current values", () => {
    expect(normalizeMissionStatus("in_progress")).toBe("in_progress");
  });

  it.each([
    ["In corso", "in_progress"],
    ["In attesa", "pending"],
    ["Completata", "completed"],
    ["Completed", "completed"],
  ])("maps the legacy value %s to %s", (legacy, expected) => {
    expect(normalizeMissionStatus(legacy)).toBe(expected);
  });

  it("rejects unknown and non-string values", () => {
    expect(normalizeMissionStatus("unknown")).toBeNull();
    expect(normalizeMissionStatus(3)).toBeNull();
  });
});

describe("normalizeMissionPriority", () => {
  it.each([
    ["urgent", "urgent"],
    ["Urgente", "urgent"],
    ["Alta", "high"],
    ["Normal", "normal"],
  ])("maps %s to %s", (value, expected) => {
    expect(normalizeMissionPriority(value)).toBe(expected);
  });

  it("rejects unknown and non-string values", () => {
    expect(normalizeMissionPriority("critical")).toBeNull();
    expect(normalizeMissionPriority(undefined)).toBeNull();
  });
});

describe("status and priority guards", () => {
  it("accepts only current values", () => {
    expect(isMissionStatus("completed")).toBe(true);
    expect(isMissionStatus("Completata")).toBe(false);
    expect(isMissionPriority("high")).toBe(true);
    expect(isMissionPriority("Alta")).toBe(false);
  });
});

describe("coveredSpecialties", () => {
  it("expands grouped specialties", () => {
    expect(coveredSpecialties("all")).toEqual(["builder", "ranger", "explorer"]);
    expect(coveredSpecialties("explorer_builder")).toEqual(["builder", "explorer"]);
  });

  it("keeps single specialties", () => {
    expect(coveredSpecialties("ranger")).toEqual(["ranger"]);
  });
});

describe("specialtyAlreadyCovered", () => {
  const missions = [makeMission({ id: "a", targetSpecialty: "explorer" })];

  it("detects a specialty already taken in the same system and galaxy", () => {
    expect(specialtyAlreadyCovered("explorer", missions, portal, 0)).toBe(true);
    expect(specialtyAlreadyCovered("all", missions, portal, 0)).toBe(true);
  });

  it("ignores other specialties, systems and galaxies", () => {
    expect(specialtyAlreadyCovered("builder", missions, portal, 0)).toBe(false);
    expect(specialtyAlreadyCovered("explorer", missions, "0A1B2C3D4E60", 0)).toBe(false);
    expect(specialtyAlreadyCovered("explorer", missions, portal, 1)).toBe(false);
  });

  it("compares addresses ignoring case and can exclude a mission", () => {
    expect(specialtyAlreadyCovered("explorer", missions, portal.toLowerCase(), 0)).toBe(true);
    expect(specialtyAlreadyCovered("explorer", missions, portal, 0, "a")).toBe(false);
  });
});

describe("canViewMission", () => {
  const viewer = { publicId: "m1", email: "a@b.c", name: "A", specialty: "ranger" };

  it("shows unassigned missions that match the specialty", () => {
    expect(canViewMission(makeMission({ targetSpecialty: "ranger" }), viewer)).toBe(true);
    expect(canViewMission(makeMission({ targetSpecialty: "all" }), viewer)).toBe(true);
    expect(canViewMission(makeMission({ targetSpecialty: "builder" }), viewer)).toBe(false);
  });

  it("handles the explorer and builder group", () => {
    const mission = makeMission({ targetSpecialty: "explorer_builder" });
    expect(canViewMission(mission, { ...viewer, specialty: "builder" })).toBe(true);
    expect(canViewMission(mission, { ...viewer, specialty: "explorer" })).toBe(true);
    expect(canViewMission(mission, viewer)).toBe(false);
  });

  it("shows assigned missions only to the assignee", () => {
    const mission = makeMission({ assignedMemberId: "m1", assignedTo: "Nick" });
    expect(canViewMission(mission, viewer)).toBe(true);
    expect(canViewMission(mission, { ...viewer, publicId: "m2" })).toBe(false);
    expect(canViewMission(mission, { ...viewer, publicId: undefined })).toBe(false);
  });

  it("hides a mission assigned by name only", () => {
    expect(canViewMission(makeMission({ assignedTo: "Nick" }), viewer)).toBe(false);
  });
});

describe("decodePortalAddress", () => {
  it("rejects malformed addresses", () => {
    expect(decodePortalAddress("123")).toBeNull();
    expect(decodePortalAddress("0A1B2C3D4E5G")).toBeNull();
  });

  it("decodes a valid address", () => {
    expect(decodePortalAddress(portal)).toEqual({
      kind: "portal",
      planet: 0,
      systemIndex: 0xa1b,
      y: 0x2c,
      z: 0x3d4,
      x: 0xe5f - 4096,
      errors: [],
    });
  });

  it("is case insensitive and reads signed coordinates", () => {
    expect(decodePortalAddress("0123ff3d4e5f")?.y).toBe(-1);
  });

  it("reports invalid parts", () => {
    expect(decodePortalAddress("7A1B2C3D4E5F")?.errors).toEqual(["Planet index 7: allowed range is 0–6."]);
    expect(decodePortalAddress("0FFF2C3D4E5F")?.errors).toEqual(["System index FFF is reserved."]);
    expect(decodePortalAddress("0123803D4E5F")?.errors).toEqual(["Y coordinate 80: unused value."]);
    expect(decodePortalAddress("0123FF000E5F")?.errors).toEqual(["Z coordinate 000: unused value."]);
    expect(decodePortalAddress("0123FF3D4800")?.errors).toEqual(["X coordinate 800: unused value."]);
  });
});

describe("portalSearchMatches", () => {
  it("matches ignoring spaces, dashes and case", () => {
    expect(portalSearchMatches(portal, "0a1b-2c3d")).toBe(true);
    expect(portalSearchMatches(portal, "2C3D 4E")).toBe(true);
  });

  it("does not match empty or different searches", () => {
    expect(portalSearchMatches(portal, "")).toBe(false);
    expect(portalSearchMatches(portal, "9999")).toBe(false);
  });

  it("matches another planet of the same system when the full address is searched", () => {
    expect(portalSearchMatches(portal, "1A1B2C3D4E5F")).toBe(true);
    expect(portalSearchMatches(portal, "1A1B2C3D4E60")).toBe(false);
  });
});

describe("isDifferentPlanetInSameSystem", () => {
  it("is true for another planet of the same system and galaxy", () => {
    expect(isDifferentPlanetInSameSystem(portal, 0, "1A1B2C3D4E5F", 0)).toBe(true);
  });

  it("is false for the same planet, another system or another galaxy", () => {
    expect(isDifferentPlanetInSameSystem(portal, 0, portal, 0)).toBe(false);
    expect(isDifferentPlanetInSameSystem(portal, 0, "1A1B2C3D4E60", 0)).toBe(false);
    expect(isDifferentPlanetInSameSystem(portal, 0, "1A1B2C3D4E5F", 1)).toBe(false);
  });

  it("is false for malformed addresses", () => {
    expect(isDifferentPlanetInSameSystem("123", 0, portal, 0)).toBe(false);
  });
});

describe("isMissionInput", () => {
  it("accepts a valid mission", () => {
    expect(isMissionInput(makeInput())).toBe(true);
  });

  it.each([
    ["an empty title", { title: "  " }],
    ["a long title", { title: "x".repeat(121) }],
    ["long notes", { notes: "x".repeat(1001) }],
    ["an invalid portal address", { systemAddress: "0123803D4E5F" }],
    ["a galaxy above 255", { galaxy: 256 }],
    ["a fractional galaxy", { galaxy: 1.5 }],
    ["an unknown specialty", { targetSpecialty: "pilot" }],
    ["a legacy status", { status: "In corso" }],
    ["progress above 100", { progress: 101 }],
    ["an email field", { createdByEmail: "a@b.c" }],
    ["a stored system status", { systemStatus: "mapped" }],
  ])("rejects %s", (_label, overrides) => {
    expect(isMissionInput(makeInput(overrides))).toBe(false);
  });

  it("rejects non-objects", () => {
    expect(isMissionInput(null)).toBe(false);
    expect(isMissionInput("mission")).toBe(false);
  });
});
