import { spawnSync } from "child_process";

const result = spawnSync("npx", ["next", "build", "--webpack"], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    ANALYZE: "true",
  },
});

process.exit(result.status ?? 1);
