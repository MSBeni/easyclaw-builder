# EasyClaw Builder code-review handoff

## Review target

Review the private `feature/claw-builder-foundation` branch against `main` in `MSBeni/easyclaw-builder`. The implementation under review is complete through commit `28a7247`; this handoff adds no runtime behavior. Do not change repository visibility or publish a package during review.

The goal of this slice is one usable, local, on-demand agent path on pinned OpenClaw v2026.9.4. It is deliberately narrower than the old EasyClaw fork and does not include channel delivery, schedules, account setup, or a model-backed planner.

## What changed

- `src/local/plan.ts` defines a strict, editable plan and compiles a Claw containing the brief, no packages/MCP/cron jobs, and an OpenClaw profile limited to workspace-confined `read` access.
- `src/local/cli.ts` provides `plan`, `package`, `preview`, and `install`. It invokes the pinned OpenClaw CLI without a shell. Install re-runs the dry-run and requires the exact `planIntegrity` value supplied by the operator, then checks installed status. It rejects broadened package capabilities, in-repository outputs, and existing workspace targets.
- `scripts/smoke-local.mjs` exercises the whole path in disposable OpenClaw state, including changed-plan, broader-tool, in-repository-output, and existing-workspace rejection.
- `src/plugin/*` supplies a native feature-plugin page for the Blueprint catalog and in-memory package previews. This page remains **preview-only**; it does not invoke the local CLI installation path.
- `README.md` separates those two surfaces and provides the source-install walkthrough. `docs/public-release-gates.md`, `SECURITY.md`, `NOTICE.md`, and `LICENSE` record release boundaries and attribution.

## Evidence available

- A fresh private clone installed with the frozen lockfile, passed typecheck and all 25 unit tests, built, validated the plugin and template Claws, and completed the isolated local install smoke.
- Hosted CI passed for the final implementation commit: https://github.com/MSBeni/easyclaw-builder/actions/runs/35182361507.
- The source-history audit checked every reachable Git blob and commit email for its listed exposure patterns. A manual tracked-file review found no bundled binaries, credentials, private briefs, or signing assets. The pinned dependency audit reported no known moderate-or-higher advisories at the time of the check.
- A disposable Gateway loaded the native page and exercised template suggestion and preview. No live model turn, channel send, scheduled job, or install from the native page was tested.

## Requested review focus

1. Confirm that `src/local/cli.ts` never installs without consent bound to the same package, workspace, and current host plan; look for time-of-check/time-of-use and path or symlink gaps.
2. Verify the actual OpenClaw profile keeps the installed agent at workspace-confined read access and that package edits cannot add a tool, extension, MCP server, schedule, bootstrap file, or delivery path while retaining the “local-only” claim.
3. Check error handling and partial-install behavior. If OpenClaw reports an incomplete apply, the CLI must not call it verified or hide the state from the operator.
4. Check whether the README's four-command path works on another clean machine and whether it accurately distinguishes local Gateway operation from offline model inference.
5. Review the copied Blueprint modules, `NOTICE.md`, and `LICENSE` for provenance and attribution. The existing scan is not a legal opinion or a guarantee against every secret pattern.
6. Review the experimental feature-plugin contract and browser page separately; avoid treating its template preview as an installable end-to-end flow.

## Known limitations and release boundary

The CLI slice installs an agent but does not run a model-backed acceptance turn. It assumes the operator has a compatible OpenClaw configuration and a model if they want to use the agent. The native Builder page still needs its own reviewed plan-to-consent-to-install experience. Claws and feature plugins are experimental upstream surfaces, so the OpenClaw version remains pinned. The repository is private; a final maintainer decision on license attribution and public support scope is still required. Record concrete review findings with file and line, severity, reproduction, and a proposed fix; do not infer that green CI alone makes the project public-ready.

## Decision after code review

After the reviewer has reported and we have resolved any blocking findings, should EasyClaw Builder remain private until the native Builder page supports this same consent-bound flow, or be made public explicitly as an experimental, CLI-first project with the preview-only UI and stated support limits?
