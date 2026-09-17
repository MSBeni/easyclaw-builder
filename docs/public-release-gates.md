# Public-release gates

Use this checklist before changing repository visibility. Publishing source is a separate operator decision; CI does not publish npm packages or container images. A public repository would still be experimental and CLI-first, with a preview-only native Builder page.

| Gate | Current evidence | Status |
| --- | --- | --- |
| Fresh history and isolated repository | New history; noreply commit identity; old fork not copied | Complete |
| Runtime compatibility | Pinned OpenClaw v2026.9.4; plugin build/validate and isolated runtime load; two generated Claws validate and `claws dev` preview | Automated checks complete |
| Product workflow | Local on-demand CLI path creates an editable plan, packages a read-only Claw, previews OpenClaw's exact add plan, requires its integrity digest, installs, and checks status in isolated state | Local CLI slice complete; native Builder page remains preview-only |
| Live host smoke | Linked plugin in an isolated, loopback-only OpenClaw v2026.9.4 Gateway; native page loaded six templates, suggested a template from a brief, and rendered a Claw preview with manual setup tasks | Local pass; repeat on a clean host before publication |
| Tests and CI | A fresh clone with frozen-lockfile pnpm 10.23 and Node 24.19 passed typecheck, 28 unit tests, build with a clean Git diff, plugin validation, template smoke, and the local install smoke. The source-history audit passed. [Hosted CI on `main`](https://github.com/MSBeni/easyclaw-builder/actions/runs/35187208706) completed successfully after the merge. | Technical checks pass; rerun after future code changes |
| Source and license audit | All reachable blobs and commit emails scanned; tracked files and copied-module provenance reviewed; original MIT notice retained; no binary assets or credentials found | Technical review complete; final maintainer/legal judgment before visibility change |
| Dependency audit | Frozen-lockfile clean clone returned no known moderate-or-higher vulnerabilities | Local pass; rerun at publication time |
| Documentation | README covers agent use, active config path, disposable state, partial-install recovery, and Gateway-dependent previewed removal. A clean local clone completed plan, package, preview, install, status, and removal with an authenticated isolated Gateway. | Manual flow passes locally; no model-backed agent turn or second-host walkthrough yet |

The native template preview is not a promise that a generated agent will perform the old Blueprint's schedules, channel replies, or deliveries. Those settings are listed as manual setup tasks and are not silently installed. The local CLI path is separate: it creates only a new read-only, on-demand agent. Its isolated smoke test verifies installation and status, but does not run a model, connect an account or channel, or create a cron job.

Removal requires a running authenticated Gateway. It completed against an isolated loopback Gateway on pinned OpenClaw v2026.9.4: the install record and workspace were removed. The README still documents partial-removal recovery; this test does not prove every host configuration. If removal becomes a supported product workflow, add an automated live-Gateway removal smoke. The two TypeBox packages serve different existing surfaces (migrated Blueprint code and the OpenClaw feature contract). Packaging metadata such as `peerDependencies` and npm `files` remains out of scope while this repository is source-only; revisit before any package distribution.

## Source review scope

The fresh history contains only the small Builder source tree, documentation, lockfile, and verification workflow. The copied portable Blueprint modules and approval-posture logic are identified in `NOTICE.md`; the OpenClaw MIT copyright and permission notice remain in `LICENSE`. The history scan checked every reachable Git blob for listed secret and personal-path patterns and checked commit email metadata. Manual inspection found no tracked media, signing material, runtime config, personal briefs, or bundled dependency code. This is a technical redistribution review, not a legal opinion or a guarantee that pattern scanning catches every secret.

## Visibility-change checklist

Repository visibility is not changed by merging this branch. Before making it public, the maintainer must approve the MIT attribution and the experimental, CLI-first support scope. Review existing Actions logs because they become visible with the repository. At the visibility change, confirm private vulnerability reporting is enabled so `SECURITY.md` has a working destination; protect `main` with the CI workflow required; enable secret scanning with push protection and Dependabot alerts where available; and require approval for first-time contributors' workflow runs. Recheck these settings after the change rather than assuming private-repository rules carry over. No CI job verifies repository settings.

## Compatibility policy

Pin the tested OpenClaw host version and its Node runtime. When OpenClaw releases a new version, update the pin in `package.json`, rebuild the browser assets, rerun plugin validation and Claw validation, and perform one manual Gateway/UI smoke test before claiming support. Feature-plugin and Claw interfaces are experimental, so compatibility is demonstrated by tests rather than inferred from a semver range.
