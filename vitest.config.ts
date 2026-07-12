import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    exclude: ["node_modules", "dist", ".idea", ".git", ".cache", "test/e2e/**"],
  },
});
