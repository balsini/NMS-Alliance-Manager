import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // Vendored third-party code: not covered by our tests.
    exclude: [...configDefaults.exclude, "src/lib/nms-core/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/lib/**/*.{ts,tsx}"],
      exclude: ["src/lib/nms-core/**", "**/*.test.{ts,tsx}"],
    },
  },
});
