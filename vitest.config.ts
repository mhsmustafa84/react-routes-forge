import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Individual test files opt into jsdom via `@vitest-environment jsdom`.
    // The default stays 'node' so existing core tests are unaffected.
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
  },
});
