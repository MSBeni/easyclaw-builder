import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compileLocalAgentPlan, createLocalAgentPlan, validateLocalAgentPlan } from "./plan.js";

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function keysAre(value: unknown, keys: string[]): boolean {
  const object = record(value);
  return !!object && Object.keys(object).sort().join(",") === [...keys].sort().join(",");
}

function emptyObject(value: unknown): boolean {
  return keysAre(value, []);
}

function assertLocalOnly(validation: JsonRecord): void {
  const manifest = record(validation.manifest);
  const profile = record(validation.openClawProfile);
  const agent = record(manifest?.agent);
  const workspace = record(manifest?.workspace);
  const profileAgent = record(profile?.agent);
  const tools = record(profileAgent?.tools);
  const fsPolicy = record(tools?.fs);
  if (
    !manifest || !profile ||
    !keysAre(manifest, ["schemaVersion", "agent", "metadata", "workspace", "packages", "mcpServers", "cronJobs"]) ||
    !keysAre(agent, ["id", "name", "description"]) ||
    !emptyObject(manifest.metadata) ||
    !keysAre(workspace, ["bootstrapFiles", "files"]) ||
    !emptyObject(workspace?.bootstrapFiles) ||
    !Array.isArray(workspace?.files) || workspace.files.length !== 0 ||
    !Array.isArray(manifest.packages) || manifest.packages.length !== 0 ||
    !emptyObject(manifest.mcpServers) ||
    !Array.isArray(manifest.cronJobs) || manifest.cronJobs.length !== 0 ||
    !keysAre(profile, ["schemaVersion", "agent", "extensions"]) ||
    !keysAre(profileAgent, ["tools"]) ||
    !keysAre(tools, ["allow", "fs"]) ||
    !Array.isArray(tools?.allow) || tools.allow.length !== 1 || tools.allow[0] !== "read" ||
    !keysAre(fsPolicy, ["workspaceOnly"]) || fsPolicy?.workspaceOnly !== true ||
    !Array.isArray(profile.extensions) || profile.extensions.length !== 0
  ) {
    throw new Error("This package exceeds the local, read-only agent boundary. Create a new reviewed plan instead.");
  }
}

function parseOptions(args: string[]): { positionals: string[]; options: Map<string, string> } {
  const positionals: string[] = [];
  const options = new Map<string, string>();
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg) continue;
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }
    const value = args[i + 1];
    if (!value || value.startsWith("--") || options.has(arg)) throw new Error(`Missing or duplicate value for ${arg}.`);
    options.set(arg, value);
    i += 1;
  }
  return { positionals, options };
}

function required(options: Map<string, string>, key: string): string {
  const value = options.get(key);
  if (!value) throw new Error(`Required option: ${key}.`);
  return value;
}

function expectOptions(options: Map<string, string>, allowed: string[]): void {
  for (const key of options.keys()) if (!allowed.includes(key)) throw new Error(`Unsupported option: ${key}.`);
}

function expectPositionals(positionals: string[], count: number): void {
  if (positionals.length !== count) throw new Error(`Expected ${count} positional argument(s).`);
}

function runClaws(args: string[]): JsonRecord {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const entry = path.join(root, "node_modules", "openclaw", "openclaw.mjs");
  const output = execFileSync(process.execPath, [entry, "claws", ...args, "--json"], {
    cwd: root,
    env: { ...process.env, OPENCLAW_EXPERIMENTAL_CLAWS: "1" },
    encoding: "utf8",
    stdio: "pipe",
    timeout: 120_000,
    maxBuffer: 2 * 1024 * 1024,
  });
  const parsed: unknown = JSON.parse(output);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("OpenClaw returned an invalid response.");
  return parsed as JsonRecord;
}

function assertPackage(root: string): void {
  const validation = runClaws(["validate", root]);
  if (validation.ok !== true) throw new Error(`OpenClaw rejected the Claw package: ${JSON.stringify(validation.diagnostics ?? validation.error)}`);
  assertLocalOnly(validation);
}

function previewAdd(root: string, workspace: string): JsonRecord {
  assertPackage(root);
  const preview = runClaws(["add", root, "--workspace", workspace, "--dry-run"]);
  if (!Array.isArray(preview.blockers) || preview.blockers.length > 0 || typeof preview.planIntegrity !== "string") {
    throw new Error(`OpenClaw add plan is blocked: ${JSON.stringify(preview.blockers ?? preview.error)}`);
  }
  return preview;
}

function main(argv: string[]): void {
  const [command, ...rest] = argv;
  const { positionals, options } = parseOptions(rest);

  if (command === "plan") {
    expectPositionals(positionals, 0);
    expectOptions(options, ["--id", "--name", "--brief", "--out"]);
    const plan = createLocalAgentPlan({
      agentId: required(options, "--id"),
      agentName: required(options, "--name"),
      brief: required(options, "--brief"),
    });
    const target = path.resolve(required(options, "--out"));
    fs.writeFileSync(target, `${JSON.stringify(plan, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    process.stdout.write(`Wrote editable local-agent plan: ${target}\n`);
    return;
  }

  if (command === "package") {
    expectPositionals(positionals, 1);
    expectOptions(options, ["--out"]);
    const source = positionals[0];
    if (!source) throw new Error("Missing plan path.");
    const plan = validateLocalAgentPlan(JSON.parse(fs.readFileSync(path.resolve(source), "utf8")));
    const root = path.resolve(required(options, "--out"));
    const files = compileLocalAgentPlan(plan);
    fs.mkdirSync(root);
    fs.mkdirSync(path.join(root, "profiles"));
    for (const [name, content] of Object.entries(files)) {
      fs.writeFileSync(path.join(root, name), content, { flag: "wx", mode: 0o600 });
    }
    assertPackage(root);
    process.stdout.write(`Created and validated Claw package: ${root}\nReview CLAW.md and profiles/openclaw.yml before previewing installation.\n`);
    return;
  }

  if (command === "preview") {
    expectPositionals(positionals, 1);
    expectOptions(options, ["--workspace"]);
    const root = positionals[0];
    if (!root) throw new Error("Missing package path.");
    const preview = previewAdd(path.resolve(root), path.resolve(required(options, "--workspace")));
    process.stdout.write(`${JSON.stringify(preview, null, 2)}\n`);
    return;
  }

  if (command === "install") {
    expectPositionals(positionals, 1);
    expectOptions(options, ["--workspace", "--plan-integrity"]);
    const root = positionals[0];
    if (!root) throw new Error("Missing package path.");
    const packageRoot = path.resolve(root);
    const workspace = path.resolve(required(options, "--workspace"));
    const consent = required(options, "--plan-integrity");
    if (!/^sha256:[a-f0-9]{64}$/.test(consent)) throw new Error("Invalid plan integrity digest.");
    const fresh = previewAdd(packageRoot, workspace);
    if (fresh.planIntegrity !== consent) throw new Error("The OpenClaw plan changed after review. Preview again before installing.");
    const applied = runClaws(["add", packageRoot, "--workspace", workspace, "--yes", "--plan-integrity", consent]);
    if (applied.status !== "complete") throw new Error(`OpenClaw installation did not complete: ${JSON.stringify(applied)}`);
    const record = applied.installRecord;
    if (!record || typeof record !== "object" || !('agentId' in record) || typeof record.agentId !== "string") {
      throw new Error("OpenClaw did not return the installed agent ID.");
    }
    const status = runClaws(["status", record.agentId]);
    const summary = status.summary;
    if (
      !summary || typeof summary !== "object" ||
      !('claws' in summary) || summary.claws !== 1 ||
      !('partial' in summary) || summary.partial !== 0 ||
      !('missingAgents' in summary) || summary.missingAgents !== 0 ||
      !('driftedFiles' in summary) || summary.driftedFiles !== 0 ||
      !('cronRefs' in summary) || summary.cronRefs !== 0 ||
      !('mcpServerRefs' in summary) || summary.mcpServerRefs !== 0
    ) {
      throw new Error(`Installation completed but status needs review: ${JSON.stringify(status)}`);
    }
    process.stdout.write(`Installed and verified local agent: ${record.agentId}\n`);
    return;
  }

  throw new Error("Usage: easyclaw local <plan|package|preview|install> [options]. See README.md for the reviewed flow.");
}

try {
  main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`EasyClaw local workflow: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
