import { describe, expect, it } from "vitest";
import { translations as english } from "./translations/en";
import { translations as italian } from "./translations/it";
import { translate } from "./translations";

function flatKeys(catalog: Record<string, Record<string, string> | undefined>) {
  return Object.values(catalog).flatMap((namespace) => Object.keys(namespace ?? {}));
}

describe("translate", () => {
  it("translates canonical keys", () => {
    expect(translate("en", "common.moderator")).toBe("Moderator");
    expect(translate("it", "common.moderator")).toBe("Moderatore");
  });

  it("replaces placeholders and keeps unknown ones", () => {
    expect(translate("en", "missions.view_notes_for_mission", { title: "Survey" })).toBe("View notes for Survey");
    expect(translate("en", "missions.view_notes_for_mission", {})).toBe("View notes for {title}");
  });

  it("translates legacy strings used as keys", () => {
    expect(translate("en", "Pianeti")).toBe("Planets");
    expect(translate("it", "Planets")).toBe("Pianeti");
  });

  it("falls back to the message when there is no translation", () => {
    expect(translate("it", "No such message")).toBe("No such message");
  });

  it("translates portal decode errors in both languages", () => {
    expect(translate("it", "Planet index 7: allowed range is 0–6.")).toBe("Indice pianeta 7: ammessi da 0 a 6.");
    expect(translate("en", "Indice pianeta 7: ammessi da 0 a 6.")).toBe("Planet index 7: allowed range is 0–6.");
    expect(translate("it", "X coordinate 800: unused value.")).toBe("Coordinata X 800: valore non utilizzato.");
    expect(translate("en", "Coordinata Z 000: valore non utilizzato.")).toBe("Z coordinate 000: unused value.");
  });
});

describe("translation catalogs", () => {
  const englishKeys = new Set(flatKeys(english));
  const italianKeys = new Set(flatKeys(italian));

  it("define every English key in Italian", () => {
    expect([...englishKeys].filter((key) => !italianKeys.has(key))).toEqual([]);
  });

  it("define every Italian key in English", () => {
    expect([...italianKeys].filter((key) => !englishKeys.has(key))).toEqual([]);
  });

  it("use the same placeholders in both languages", () => {
    const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    const flat = (catalog: typeof english) => Object.assign({}, ...Object.values(catalog)) as Record<string, string>;
    const englishText = flat(english);
    const italianText = flat(italian);
    const mismatched = Object.keys(englishText).filter((key) => key in italianText
      && placeholders(englishText[key]).join() !== placeholders(italianText[key]).join());
    expect(mismatched).toEqual([]);
  });
});
