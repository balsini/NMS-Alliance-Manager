import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        // Unit tests next to the code.
        resolve: { alias },
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
          // Vendored third-party code: not covered by our tests.
          exclude: [...configDefaults.exclude, "src/lib/nms-core/**"],
        },
      },
      {
        // Store, API, component and page tests in tests/.
        resolve: { alias },
        esbuild: { jsx: "automatic" },
        test: {
          name: "integration",
          include: ["tests/**/*.test.{ts,tsx}"],
          // The stores compute the data/ path from process.cwd(): each file needs its own process (forks) to chdir.
          pool: "forks",
          environment: "node",
          setupFiles: ["tests/setup.ts"],
          mockReset: true,
          restoreMocks: true,
          unstubEnvs: true,
          unstubGlobals: true,
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/lib/nms-core/**", "src/**/*.d.ts", "src/**/*.test.{ts,tsx}", "src/test/**"],
      reporter: ["text-summary", "text", "html", "lcov", "json-summary"],
      reportsDirectory: "coverage",
      // Just below the current coverage: a drop fails npm run test:coverage and CI.
      thresholds: { lines: 95, statements: 94, functions: 89, branches: 90 },
    },
  },
});
