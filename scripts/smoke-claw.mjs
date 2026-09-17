import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getAgentBlueprintTemplate } from "../dist/blueprints/registry.js";
import { compileBlueprintToClawPreview } from "../dist/claws/compile.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const openclawEntry = path.join(projectRoot, "node_modules", "openclaw", "openclaw.mjs");
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "easyclaw-claw-smoke-"));
const env = { ...process.env };
for (const key of ["OPENCLAW_CONFIG_PATH", "OPENCLAW_HOME", "OPENCLAW_PROFILE"]) delete env[key];
Object.assign(env, { OPENCLAW_EXPERIMENTAL_CLAWS: "1", OPENCLAW_STATE_DIR: path.join(temporaryRoot, "state") });

try {
  const configPath = execFileSync(process.execPath, [openclawEntry, "config", "file"], {
    cwd: projectRoot, env, encoding: "utf8", stdio: "pipe", timeout: 120_000,
  }).trim();
  if (path.resolve(configPath) !== path.join(temporaryRoot, "state", "openclaw.json")) {
    throw new Error(`Smoke test would use a non-disposable config: ${configPath}`);
  }
  for (const templateId of ["daily-briefing", "support-responder"]) {
    const bundle = getAgentBlueprintTemplate(templateId);
    if (!bundle) throw new Error(`Missing template: ${templateId}`);
    const preview = compileBlueprintToClawPreview(bundle);
    const packageRoot = path.join(temporaryRoot, templateId);
    fs.mkdirSync(packageRoot);
    for (const [name, content] of Object.entries(preview.files)) {
      fs.writeFileSync(path.join(packageRoot, name), content, { flag: "wx" });
    }
    execFileSync(process.execPath, [openclawEntry, "claws", "validate", packageRoot, "--json"], {
      cwd: projectRoot,
      env,
      encoding: "utf8",
      stdio: "pipe",
      timeout: 120_000,
    });
    execFileSync(process.execPath, [openclawEntry, "claws", "dev", packageRoot, "--json"], {
      cwd: projectRoot,
      env,
      encoding: "utf8",
      stdio: "pipe",
      timeout: 120_000,
    });
    process.stdout.write(`Validated and dry-run previewed ${templateId} with OpenClaw.\n`);
  }
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
