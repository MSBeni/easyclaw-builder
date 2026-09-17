import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const script = fileURLToPath(new URL("../scripts/audit-source.mjs", import.meta.url));

function auditCommit(authorEmail: string, committerEmail: string) {
  const dir = mkdtempSync(join(tmpdir(), "easyclaw-source-audit-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: dir });
    execFileSync("git", ["commit", "--allow-empty", "-m", "Test commit"], {
      cwd: dir,
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: "Test author",
        GIT_AUTHOR_EMAIL: authorEmail,
        GIT_COMMITTER_NAME: "Test committer",
        GIT_COMMITTER_EMAIL: committerEmail,
      },
    });
    return spawnSync(process.execPath, [script], { cwd: dir, encoding: "utf8" });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("source audit commit identity", () => {
  it("accepts GitHub's synthetic pull-request merge committer", () => {
    const result = auditCommit("MSBeni@users.noreply.github.com", "noreply@github.com");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("No listed exposure patterns found");
  });

  it("still rejects a personal committer email", () => {
    const result = auditCommit("MSBeni@users.noreply.github.com", "developer@example.com");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("non-noreply author or committer email");
  });
});
