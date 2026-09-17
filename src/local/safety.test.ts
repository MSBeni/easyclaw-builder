import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertLocalActions, assertOutsideProject, assertPackageFiles } from "./safety.js";

describe("local CLI safety checks", () => {
  it("rejects in-repository paths including symlink and case aliases", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "easyclaw-guard-"));
    try {
      const project = path.join(root, "Project");
      fs.mkdirSync(project);
      const alias = path.join(root, "alias");
      fs.symlinkSync(project, alias);
      for (const target of [project, path.join(project, "..leak.json"), path.join(alias, "inside.json")]) {
        expect(() => assertOutsideProject(target, project)).toThrow(/outside the source repository/);
      }
      const caseAlias = path.join(root, "PROJECT");
      if (fs.existsSync(caseAlias)) {
        expect(() => assertOutsideProject(path.join(caseAlias, "inside.json"), project)).toThrow(/outside the source repository/);
      }
      expect(() => assertOutsideProject(path.join(root, "outside.json"), project)).not.toThrow();
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("allows only the three generated package files and names unexpected entries", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "easyclaw-files-"));
    try {
      fs.mkdirSync(path.join(root, "profiles"));
      for (const name of ["package.json", "CLAW.md", "profiles/openclaw.yml"]) fs.writeFileSync(path.join(root, name), "test");
      expect(() => assertPackageFiles(root)).not.toThrow();
      fs.writeFileSync(path.join(root, ".DS_Store"), "test");
      expect(() => assertPackageFiles(root)).toThrow(/\.DS_Store/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a bootstrap write or a broader capability effect", () => {
    const workspace = path.join(os.tmpdir(), "easyclaw-plan-workspace");
    const plan = {
      agent: { finalId: "reader", workspace },
      actions: [
        { kind: "agent", id: "reader", action: "create", blocked: false },
        { kind: "workspace", id: "reader", action: "create", target: workspace, blocked: false },
        { kind: "workspaceFile", id: "SOUL.md", action: "write", target: path.join(workspace, "SOUL.md"), sourceKind: "clawMarkdownBody", blocked: false },
      ],
      capabilityChanges: [{ kind: "agent", id: "reader", path: "agent", action: "create", effect: { tools: { allow: ["read"], fs: { workspaceOnly: true } } } }],
    };
    expect(() => assertLocalActions(plan)).not.toThrow();
    expect(() => assertLocalActions({ ...plan, actions: [...plan.actions, { kind: "bootstrap", id: "BOOTSTRAP.md", action: "write" }] })).toThrow(/unexpected/);
    expect(() => assertLocalActions({ ...plan, capabilityChanges: [{ ...plan.capabilityChanges[0], effect: { tools: { allow: ["read", "exec"], fs: { workspaceOnly: true } } } }] })).toThrow(/read-only/);
  });
});
