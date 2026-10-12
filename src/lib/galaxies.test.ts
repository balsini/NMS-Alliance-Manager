import { describe, expect, it } from "vitest";
import { galaxyLabel, galaxyNames } from "./galaxies";

describe("galaxyLabel", () => {
  it("has one name for each of the 256 galaxies", () => {
    expect(galaxyNames).toHaveLength(256);
    expect(new Set(galaxyNames).size).toBe(256);
  });

  it("returns the galaxy name", () => {
    expect(galaxyLabel(0)).toBe("Euclide");
    expect(galaxyLabel(255)).toBe(galaxyNames[255]);
  });

  it("falls back to a generic label outside the known range", () => {
    expect(galaxyLabel(256)).toBe("Galassia 256");
    expect(galaxyLabel(-1)).toBe("Galassia -1");
  });
});
