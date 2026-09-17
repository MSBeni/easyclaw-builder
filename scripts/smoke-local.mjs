import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const openclawEntry = path.join(projectRoot, "node_modules", "openclaw", "openclaw.mjs");
const builderEntry = path.join(projectRoot, "dist", "local", "cli.js");
const root = fs.mkdtempSync(path.join(os.tmpdir(), "easyclaw-local-smoke-"));
const planPath = path.join(root, "plan.json");
const packageRoot = path.join(root, "package");
const workspace = path.join(root, "agent-workspace");
const env = { ...process.env };
for (const key of ["OPENCLAW_CONFIG_PATH", "OPENCLAW_HOME", "OPENCLAW_PROFILE"]) delete env[key];
Object.assign(env, { OPENCLAW_EXPERIMENTAL_CLAWS: "1", OPENCLAW_STATE_DIR: path.join(root, "state") });

function run(args) {
  return execFileSync(process.execPath, [openclawEntry, "claws", ...args], {
    cwd: projectRoot,
    env,
    encoding: "utf8",
    stdio: "pipe",
    timeout: 120_000,
  });
}

function runBuilder(args) {
  return execFileSync(process.execPath, [builderEntry, ...args], {
    cwd: projectRoot,
    env,
    encoding: "utf8",
    stdio: "pipe",
    timeout: 120_000,
  });
}

try {
  const configPath = execFileSync(process.execPath, [openclawEntry, "config", "file"], {
    cwd: projectRoot, env, encoding: "utf8", stdio: "pipe", timeout: 120_000,
  }).trim();
  if (path.resolve(configPath) !== path.join(root, "state", "openclaw.json")) {
    throw new Error(`Smoke test would use a non-disposable config: ${configPath}`);
  }
  const inRepoPlan = path.join(projectRoot, ".private-plan-smoke.json");
  let inRepoPlanRejected = false;
  try {
    runBuilder(["plan", "--id", "document-reviewer", "--name", "Document Reviewer", "--brief", "Read local files.", "--out", inRepoPlan]);
  } catch (error) {
    inRepoPlanRejected = String(error.stderr).includes("outside the source repository");
  }
  if (!inRepoPlanRejected || fs.existsSync(inRepoPlan)) throw new Error("In-repository plan creation was not rejected.");
  const lookalikePlan = path.join(projectRoot, "..private-plan-smoke.json");
  const linkedRepo = path.join(root, "repo-link");
  fs.symlinkSync(projectRoot, linkedRepo);
  for (const target of [lookalikePlan, path.join(linkedRepo, ".private-plan-smoke.json")]) {
    let rejected = false;
    try {
      runBuilder(["plan", "--id", "document-reviewer", "--name", "Document Reviewer", "--brief", "Read local files.", "--out", target]);
    } catch (error) {
      rejected = String(error.stderr).includes("outside the source repository");
    }
    if (!rejected || fs.existsSync(target)) throw new Error(`In-repository path bypass was not rejected: ${target}`);
  }
  runBuilder(["plan", "--id", "document-reviewer", "--name", "Document Reviewer", "--brief", "Summarize local documents I provide and cite file names.", "--out", planPath]);
  runBuilder(["package", planPath, "--out", packageRoot]);
  const validation = JSON.parse(run(["validate", packageRoot, "--json"]));
  if (!validation.ok) throw new Error(`Generated local Claw failed validation: ${JSON.stringify(validation)}`);
  run(["dev", packageRoot, "--workspace", workspace, "--json"]);
  let existingWorkspaceRejected = false;
  try {
    runBuilder(["preview", packageRoot, "--workspace", packageRoot]);
  } catch (error) {
    existingWorkspaceRejected = String(error.stderr).includes("workspace_collision");
  }
  if (!existingWorkspaceRejected) throw new Error("Existing workspace was not rejected.");
  const preview = JSON.parse(runBuilder(["preview", packageRoot, "--workspace", workspace]));
  if (preview.blockers.length > 0 || typeof preview.planIntegrity !== "string") {
    throw new Error(`Local add preview was blocked: ${JSON.stringify(preview.blockers)}`);
  }
  const clawPath = path.join(packageRoot, "CLAW.md");
  const originalClaw = fs.readFileSync(clawPath, "utf8");
  fs.writeFileSync(clawPath, `${originalClaw}\nChanged after review.\n`);
  let changedPlanRejected = false;
  try {
    runBuilder(["install", packageRoot, "--workspace", workspace, "--plan-integrity", preview.planIntegrity]);
  } catch (error) {
    changedPlanRejected = String(error.stderr).includes("plan changed after review");
  }
  if (!changedPlanRejected) throw new Error("Changed package was not rejected before installation.");
  fs.writeFileSync(clawPath, originalClaw);
  const profilePath = path.join(packageRoot, "profiles", "openclaw.yml");
  const originalProfile = fs.readFileSync(profilePath, "utf8");
  fs.writeFileSync(profilePath, originalProfile.replace("- read", "- exec"));
  let broaderToolRejected = false;
  try {
    runBuilder(["preview", packageRoot, "--workspace", workspace]);
  } catch (error) {
    broaderToolRejected = String(error.stderr).includes("exceeds the local, read-only agent boundary");
  }
  if (!broaderToolRejected) throw new Error("Broader tool permission was not rejected.");
  fs.writeFileSync(profilePath, originalProfile);
  const bootstrapPath = path.join(packageRoot, "BOOTSTRAP.md");
  fs.writeFileSync(bootstrapPath, "Unexpected bootstrap content.\n");
  let bootstrapRejected = false;
  try {
    runBuilder(["preview", packageRoot, "--workspace", workspace]);
  } catch (error) {
    bootstrapRejected = String(error.stderr).includes("BOOTSTRAP.md");
  }
  if (!bootstrapRejected) throw new Error("Undeclared package bootstrap was not rejected.");
  fs.rmSync(bootstrapPath);
  runBuilder(["install", packageRoot, "--workspace", workspace, "--plan-integrity", preview.planIntegrity]);
  const status = JSON.parse(run(["status", "document-reviewer", "--json"]));
  if (status.summary.claws !== 1 || status.summary.partial !== 0 || status.summary.cronRefs !== 0 || status.summary.mcpServerRefs !== 0) {
    throw new Error(`Installed Claw status is not healthy and local-only: ${JSON.stringify(status.summary)}`);
  }
  let collisionReported = false;
  try {
    runBuilder(["preview", packageRoot, "--workspace", path.join(root, "other-workspace")]);
  } catch (error) {
    collisionReported = String(error.stderr).includes("agent_id_collision");
  }
  if (!collisionReported) throw new Error("Upstream agent-id blocker was not shown to the operator.");

  const partialPlan = path.join(root, "partial-plan.json");
  const partialPackage = path.join(root, "partial-package");
  const restrictedParent = path.join(root, "restricted");
  const partialWorkspace = path.join(restrictedParent, "workspace");
  fs.mkdirSync(restrictedParent);
  runBuilder(["plan", "--id", "partial-reviewer", "--name", "Partial Reviewer", "--brief", "Read local files.", "--out", partialPlan]);
  runBuilder(["package", partialPlan, "--out", partialPackage]);
  const partialPreview = JSON.parse(runBuilder(["preview", partialPackage, "--workspace", partialWorkspace]));
  fs.chmodSync(restrictedParent, 0o555);
  let partialReported = false;
  try {
    runBuilder(["install", partialPackage, "--workspace", partialWorkspace, "--plan-integrity", partialPreview.planIntegrity]);
  } catch (error) {
    const diagnostic = String(error.stderr);
    partialReported = diagnostic.includes("did not complete") && diagnostic.includes("currentStatus") && diagnostic.includes("partial");
  } finally {
    fs.chmodSync(restrictedParent, 0o755);
  }
  if (!partialReported) throw new Error("Partial installation and recovery state were not shown to the operator.");
  runBuilder(["install", partialPackage, "--workspace", partialWorkspace, "--plan-integrity", partialPreview.planIntegrity]);
  const resumed = JSON.parse(run(["status", "partial-reviewer", "--json"]));
  if (resumed.summary.partial !== 0 || resumed.summary.pendingBootstrap !== 0) throw new Error("Resumed installation is not healthy.");
  process.stdout.write("Local plan, package, preview, consent-bound install, and status passed in isolated state.\n");
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
