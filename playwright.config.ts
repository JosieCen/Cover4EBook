import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig, devices } from "@playwright/test";

const microsoftEdgeCandidates = [
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const edgeAvailable = microsoftEdgeCandidates.some((candidate) => existsSync(candidate));

const selectedProject = edgeAvailable
  ? {
      name: "microsoft-edge",
      use: {
        ...devices["Desktop Chrome"],
        channel: "msedge",
      },
    }
  : {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium" as const,
      },
    };

export default defineConfig({
  testDir: "./tests/acceptance",
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  outputDir: "output/playwright/test_results",
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      COVER4EBOOK_ACCEPTANCE_MOCK: "1",
    },
  },
  projects: [
    selectedProject,
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
        browserName: "chromium",
      },
    },
  ],
  metadata: {
    browserPreference: edgeAvailable ? "msedge" : "chromium",
    screenshotRoot: resolve("output/playwright/screenshots"),
  },
});
