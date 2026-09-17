import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

export function assertOutsideProject(target: string, projectRoot: string): void {
  let existing = path.resolve(target);
  while (!fs.existsSync(existing)) {
    const parent = path.dirname(existing);
    if (parent === existing) break;
    existing = parent;
  }
  // Resolve the existing ancestor so symlinks and case aliases cannot hide an in-repository target.
  const resolved = path.resolve(fs.realpathSync.native(existing), path.relative(existing, target));
  const relative = path.relative(fs.realpathSync.native(projectRoot), resolved);
  if (relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))) {
    throw new Error("Write plans, packages, and agent workspaces outside the source repository.");
  }
}

export function record(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function keysAre(value: unknown, keys: string[]): boolean {
  const object = record(value);
  return !!object && Object.keys(object).sort().join(",") === [...keys].sort().join(",");
}

function emptyObject(value: unknown): boolean {
  return keysAre(value, []);
}

export function assertLocalOnly(validation: JsonRecord): void {
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

export function assertPackageFiles(root: string): void {
  const check = (directory: string, expected: Record<string, "file" | "directory">): void => {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    for (const entry of entries) {
      const kind = entry.isFile() ? "file" : entry.isDirectory() ? "directory" : "other";
      if (expected[entry.name] !== kind) {
        throw new Error(`Unsupported package entry ${JSON.stringify(path.relative(root, path.join(directory, entry.name)))}. Remove it and preview again.`);
      }
    }
    for (const name of Object.keys(expected)) {
      if (!entries.some((entry) => entry.name === name)) {
        throw new Error(`Package is missing ${JSON.stringify(path.relative(root, path.join(directory, name)))}. Rebuild it from the reviewed local plan.`);
      }
    }
  };
  check(root, { "package.json": "file", "CLAW.md": "file", profiles: "directory" });
  check(path.join(root, "profiles"), { "openclaw.yml": "file" });
}

export function assertLocalActions(preview: JsonRecord): void {
  const agent = record(preview.agent);
  const id = agent?.finalId;
  const workspace = agent?.workspace;
  const actions = preview.actions;
  const changes = preview.capabilityChanges;
  if (typeof id !== "string" || typeof workspace !== "string" || !Array.isArray(actions) || actions.length !== 3 ||
    !Array.isArray(changes) || changes.length !== 1) {
    throw new Error("OpenClaw proposed an unexpected local agent plan. Nothing was installed.");
  }
  const expected = [
    { kind: "agent", id, action: "create" },
    { kind: "workspace", id, action: "create", target: workspace },
    { kind: "workspaceFile", id: "SOUL.md", action: "write", target: path.join(workspace, "SOUL.md") },
  ];
  const allowedActions = actions.every((value, index) => {
    const action = record(value);
    const match = expected[index];
    return !!action && !!match && Object.entries(match).every(([key, expectedValue]) => action[key] === expectedValue) &&
      action.blocked === false && (index !== 2 || action.sourceKind === "clawMarkdownBody");
  });
  const change = record(changes[0]);
  const effect = record(change?.effect);
  const tools = record(effect?.tools);
  const fsPolicy = record(tools?.fs);
  if (!allowedActions || !change || change.kind !== "agent" || change.id !== id || change.path !== "agent" ||
    change.action !== "create" || !keysAre(effect, ["tools"]) || !keysAre(tools, ["allow", "fs"]) ||
    !Array.isArray(tools?.allow) || tools.allow.length !== 1 || tools.allow[0] !== "read" ||
    !keysAre(fsPolicy, ["workspaceOnly"]) || fsPolicy?.workspaceOnly !== true) {
    throw new Error("OpenClaw proposed actions outside the local, read-only boundary. Nothing was installed.");
  }
}
