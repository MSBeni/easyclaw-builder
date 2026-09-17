import { execFileSync } from "node:child_process";

const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
const failures = [];

for (const file of git("ls-files", "-z").split("\0").filter(Boolean)) {
  if (/(^|\/)\.env$|(^|\/)ai-daily|(^|\/)node_modules\/|\.tgz$/iu.test(file)) {
    failures.push(`Disallowed tracked path: ${file}`);
  }
}

for (const email of git("log", "--all", "--format=%ae%n%ce").split("\n").filter(Boolean)) {
  // GitHub's synthetic pull-request merge commit uses its own generic noreply address.
  if (!/(?:@users\.noreply\.github\.com$|^noreply@github\.com$)/iu.test(email)) {
    failures.push("A commit contains a non-noreply author or committer email.");
  }
}

const patterns = [
  { label: "private key", value: /-----BEGIN [A-Z ]*PRIVATE KEY-----/u },
  { label: "AWS access key", value: /AKIA[0-9A-Z]{16}/u },
  { label: "GitHub token", value: /gh[pousr]_[A-Za-z0-9_]{20,}/u },
  { label: "OpenAI-style key", value: /sk-[A-Za-z0-9_-]{20,}/u },
  { label: "Slack token", value: /xox[baprs]-[A-Za-z0-9-]{15,}/u },
  { label: "personal email", value: /[A-Za-z0-9._%+-]+@gmail\.com/iu },
  { label: "personal filesystem path", value: /\/(?:Users|home)\/[A-Za-z0-9._-]+\//u },
];

const ids = new Set(
  git("rev-list", "--objects", "--all")
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(0, 40)),
);
for (const id of ids) {
  if (git("cat-file", "-t", id).trim() !== "blob") continue;
  const size = Number(git("cat-file", "-s", id).trim());
  if (size > 2 * 1024 * 1024) {
    failures.push(`Oversized blob requires manual review: ${id.slice(0, 12)}`);
    continue;
  }
  const body = git("cat-file", "-p", id);
  if (body.includes("\0")) {
    failures.push(`Binary blob requires manual review: ${id.slice(0, 12)}`);
    continue;
  }
  for (const pattern of patterns) {
    if (pattern.value.test(body)) failures.push(`${pattern.label} in blob ${id.slice(0, 12)}`);
  }
}

if (failures.length > 0) {
  process.stderr.write(`${[...new Set(failures)].join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Checked ${ids.size} reachable Git objects and commit metadata. No listed exposure patterns found.\n`);
}
