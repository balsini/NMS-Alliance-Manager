import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir = "";
let store: typeof import("./almanac-store");

beforeEach(async () => {
  dataDir = await mkdtemp(path.join(os.tmpdir(), "nms-almanac-"));
  vi.stubEnv("NMS_DATA_DIR", dataDir);
  vi.stubEnv("LOCAL_AUTH", "true");
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.resetModules();
  store = await import("./almanac-store");
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await rm(dataDir, { recursive: true, force: true });
});

const portalFor = (index: number) => index.toString(16).toUpperCase().padStart(12, "0");

describe("almanac cache", () => {
  it("returns nothing when there is no cache file", async () => {
    expect(await store.readAlmanacResponse(portalFor(1), 0)).toBeNull();
  });

  it("keeps every entry when many lookups are saved at the same time", async () => {
    const count = 40;
    await Promise.all(
      Array.from({ length: count }, (_, index) =>
        store.writeAlmanacResponse(portalFor(index + 1), 0, { portal: portalFor(index + 1), index }),
      ),
    );

    const text = await readFile(path.join(dataDir, "almanac.json"), "utf8");
    expect(() => JSON.parse(text)).not.toThrow();
    for (let index = 0; index < count; index += 1) {
      expect(await store.readAlmanacResponse(portalFor(index + 1), 0), `entry ${index}`).toMatchObject({ index });
    }
  });

  it("keeps the entries of batch writes that run at the same time", async () => {
    await Promise.all([
      store.writeAlmanacResponses([{ portalCode: portalFor(1), galaxy: 0, response: { portal: "a" } }]),
      store.writeAlmanacResponses([{ portalCode: portalFor(2), galaxy: 1, response: { portal: "b" } }]),
      store.writeAlmanacResponse(portalFor(3), 2, { portal: "c" }),
    ]);
    const cache = await store.readAlmanacCache();
    expect(cache(portalFor(1), 0)).toEqual({ portal: "a" });
    expect(cache(portalFor(2), 1)).toEqual({ portal: "b" });
    expect(cache(portalFor(3), 2)).toEqual({ portal: "c" });
  });

  it("does not leave temporary files behind", async () => {
    await Promise.all([1, 2, 3].map((index) => store.writeAlmanacResponse(portalFor(index), 0, { index })));
    expect((await readdir(dataDir)).filter((name) => name.endsWith(".tmp"))).toEqual([]);
  });

  it("starts again from an empty cache when the file is unreadable, keeping a copy of it", async () => {
    await writeFile(path.join(dataDir, "almanac.json"), '{ "ok": {} }\n  "broken": {', "utf8");

    expect(await store.readAlmanacResponse(portalFor(1), 0)).toBeNull();
    expect((await readdir(dataDir)).some((name) => name.startsWith("almanac.json.corrupt-"))).toBe(true);

    await store.writeAlmanacResponse(portalFor(1), 0, { portal: "fresh" });
    expect(await store.readAlmanacResponse(portalFor(1), 0)).toEqual({ portal: "fresh" });
  });
});
