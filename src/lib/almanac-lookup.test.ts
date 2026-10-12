import { describe, expect, it } from "vitest";
import { almanacSystemLabel } from "./almanac-lookup";

describe("almanacSystemLabel", () => {
  it("joins the star, economy, conflict and race words", () => {
    const response = {
      lines: {
        band: {
          star: { word: "Yellow" },
          economy: { word: "Trading" },
          conflict: { word: "Low" },
          race: { word: "Gek" },
        },
      },
    };
    expect(almanacSystemLabel(response)).toBe("Yellow · Trading · Low · Gek");
  });

  it("keeps the fixed order and skips missing, blank and invalid words", () => {
    const response = {
      lines: { band: { race: { word: " Korvax " }, economy: { word: "  " }, conflict: {}, star: { word: 5 } } },
    };
    expect(almanacSystemLabel(response)).toBe("Korvax");
  });

  it("returns null when there is nothing to show", () => {
    expect(almanacSystemLabel({})).toBeNull();
    expect(almanacSystemLabel({ lines: [] })).toBeNull();
    expect(almanacSystemLabel({ lines: { band: null } })).toBeNull();
  });
});
