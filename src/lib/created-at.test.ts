import { describe, expect, it } from "vitest";
import { sortByCreatedAtDescending } from "./created-at";

describe("sortByCreatedAtDescending", () => {
  it("sorts the newest first", () => {
    const items = [
      { id: "old", createdAt: "2026-01-01T00:00:00Z" },
      { id: "new", createdAt: "2026-03-01T00:00:00Z" },
      { id: "mid", createdAt: "2026-02-01T00:00:00Z" },
    ];
    expect(sortByCreatedAtDescending(items).map((item) => item.id)).toEqual(["new", "mid", "old"]);
  });

  it("puts items without a valid date last, keeping their order", () => {
    const items = [
      { id: "none-1" },
      { id: "invalid", createdAt: "not a date" },
      { id: "dated", createdAt: "2026-01-01T00:00:00Z" },
      { id: "none-2", createdAt: "" },
    ];
    expect(sortByCreatedAtDescending(items).map((item) => item.id)).toEqual(["dated", "none-1", "invalid", "none-2"]);
  });

  it("keeps the original order for equal dates", () => {
    const items = [
      { id: "a", createdAt: "2026-01-01T00:00:00Z" },
      { id: "b", createdAt: "2026-01-01T00:00:00Z" },
    ];
    expect(sortByCreatedAtDescending(items).map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("does not modify the input", () => {
    const items = [{ id: "a", createdAt: "2026-01-01T00:00:00Z" }, { id: "b", createdAt: "2026-02-01T00:00:00Z" }];
    sortByCreatedAtDescending(items);
    expect(items.map((item) => item.id)).toEqual(["a", "b"]);
  });
});
