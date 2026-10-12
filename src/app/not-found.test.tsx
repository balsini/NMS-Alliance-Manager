import { describe, expect, it } from "vitest";
import NotFound from "@/app/not-found";
import { renderWithLocale } from "@/test/render-with-locale";

describe("NotFound", () => {
  it("renders the Italian 404 page with a link to the first page", () => {
    const html = renderWithLocale(<NotFound />, "it");

    expect(html).toContain("Coordinate fuori rotta");
    expect(html).toContain("Segnale perso");
    expect(html).toContain('href="/stations"');
  });

  it("renders the English 404 page", () => {
    const html = renderWithLocale(<NotFound />, "en");

    expect(html).toContain("Coordinates off course");
    expect(html).toContain("Signal lost");
  });
});
