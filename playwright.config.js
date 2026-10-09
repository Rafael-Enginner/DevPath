import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  webServer: { command: "npx serve . -l 4173", url: "http://localhost:4173", reuseExistingServer: true },
  use: { baseURL: "http://localhost:4173", locale: "pt-BR" },
});
