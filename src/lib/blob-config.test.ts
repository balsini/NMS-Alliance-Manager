import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getBlobAuthOptions } from "./blob-config";

describe("getBlobAuthOptions", () => {
  beforeEach(() => {
    for (const key of [
      "LOCAL_AUTH",
      "VERCEL",
      "VERCEL_OIDC_TOKEN",
      "NMS_STORE_ID",
      "BLOB_STORE_ID",
      "NMS_READ_WRITE_TOKEN",
      "BLOB_READ_WRITE_TOKEN",
    ]) {
      vi.stubEnv(key, "");
    }
  });

  afterEach(() => vi.unstubAllEnvs());

  it("uses local files when nothing is configured", () => {
    expect(getBlobAuthOptions()).toBeNull();
  });

  it("never uses Blob with local login, even when a token is set", () => {
    vi.stubEnv("LOCAL_AUTH", "true");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "token");
    expect(getBlobAuthOptions()).toBeNull();
  });

  it("uses the store id with OIDC on Vercel", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("NMS_STORE_ID", "store_1");
    expect(getBlobAuthOptions()).toEqual({ storeId: "store_1" });
  });

  it("accepts the alternative store id and token names", () => {
    vi.stubEnv("BLOB_STORE_ID", "store_2");
    vi.stubEnv("VERCEL_OIDC_TOKEN", "oidc");
    expect(getBlobAuthOptions()).toEqual({ storeId: "store_2" });
    vi.stubEnv("BLOB_STORE_ID", "");
    vi.stubEnv("NMS_READ_WRITE_TOKEN", "token");
    expect(getBlobAuthOptions()).toEqual({ token: "token" });
  });

  it("prefers OIDC over a token when both are available on Vercel", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("NMS_STORE_ID", "store_1");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "token");
    expect(getBlobAuthOptions()).toEqual({ storeId: "store_1" });
  });

  it("uses the store id outside Vercel when there is no token", () => {
    vi.stubEnv("NMS_STORE_ID", "store_1");
    expect(getBlobAuthOptions()).toEqual({ storeId: "store_1" });
  });

  it("fails on Vercel without a store", () => {
    vi.stubEnv("VERCEL", "1");
    expect(() => getBlobAuthOptions()).toThrow(/BLOB_STORE_ID or NMS_STORE_ID/);
  });
});
