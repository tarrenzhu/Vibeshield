import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  // ⚠️  Replace with your real Trigger.dev project ID from dashboard:
  //     https://cloud.trigger.dev/orgs/<workspace>/projects
  project: process.env.TRIGGER_PROJECT_ID ?? "proj_xxxxxxxxxxxx",
  runtime: "node",
  logLevel: "log",
  maxDuration: 600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 30000,
      factor: 2,
    },
  },
  dirs: ["./src/trigger"],
});
