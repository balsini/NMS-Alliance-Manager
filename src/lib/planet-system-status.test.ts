import { describe, expect, it } from "vitest";
import {
  editableSystemStatusRoles,
  isMissionSystemStatus,
  normalizeMissionSystemStatus,
  planetSystemStatusKey,
  systemProgressCap,
  systemProgressFloor,
} from "./planet-system-status";

describe("planetSystemStatusKey", () => {
  it("combines galaxy and uppercase portal", () => {
    expect(planetSystemStatusKey("0a1b2c3d4e5f", 3)).toBe("3:0A1B2C3D4E5F");
  });
});

describe("normalizeMissionSystemStatus", () => {
  it("keeps current values", () => {
    expect(normalizeMissionSystemStatus("mapped")).toBe("mapped");
  });

  it.each([
    ["Stazione Riscattata", "station_claimed"],
    ["Sistema rinominato", "renamed"],
    ["Errore dati", "data_error"],
    ["Buildings built", "buildings_built"],
  ])("maps the legacy value %s to %s", (legacy, expected) => {
    expect(normalizeMissionSystemStatus(legacy)).toBe(expected);
  });

  it("rejects unknown and non-string values", () => {
    expect(normalizeMissionSystemStatus("done")).toBeNull();
    expect(normalizeMissionSystemStatus(null)).toBeNull();
  });
});

describe("isMissionSystemStatus", () => {
  it("accepts only current values", () => {
    expect(isMissionSystemStatus("data_uploaded")).toBe(true);
    expect(isMissionSystemStatus("Dati caricati")).toBe(false);
    expect(isMissionSystemStatus(1)).toBe(false);
  });
});

describe("editableSystemStatusRoles", () => {
  it("limits normal users to their specialty", () => {
    expect(editableSystemStatusRoles({ role: "user", specialty: "ranger" })).toEqual(["ranger"]);
  });

  it("lets moderators and admins edit every role", () => {
    expect(editableSystemStatusRoles({ role: "moderator", specialty: "ranger" })).toBeNull();
    expect(editableSystemStatusRoles({ role: "admin", specialty: "builder" })).toBeNull();
  });

  it("limits moderators and admins in simple view", () => {
    expect(editableSystemStatusRoles({ role: "admin", specialty: "builder", simpleView: true })).toEqual(["builder"]);
  });
});

describe("systemProgressFloor", () => {
  it("is zero without completed statuses or for unknown specialties", () => {
    expect(systemProgressFloor([], "explorer")).toBe(0);
    expect(systemProgressFloor(["mapped"], "pilot")).toBe(0);
  });

  it("scales the cap by the share of completed statuses of the role", () => {
    expect(systemProgressFloor(["station_claimed"], "ranger")).toBe(systemProgressCap / 2);
    expect(systemProgressFloor(["station_claimed", "renamed"], "ranger")).toBe(systemProgressCap);
    expect(systemProgressFloor(["mapped"], "explorer")).toBe(27);
  });

  it("ignores statuses of other roles and the data error", () => {
    expect(systemProgressFloor(["buildings_built", "data_error"], "explorer")).toBe(0);
  });
});
