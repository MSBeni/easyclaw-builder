# Public-release gates

The repository stays private until every required gate below has evidence. Publishing source is a separate operator decision; CI does not publish npm packages or container images.

| Gate | Current evidence | Status |
| --- | --- | --- |
| Fresh history and private remote | New history; noreply commit identity; old fork not copied | Complete |
| Runtime compatibility | Pinned OpenClaw v2026.9.4; plugin build/validate and isolated runtime load; two generated Claws validate and `claws dev` preview | Automated checks complete |
| Product workflow | Local on-demand CLI path creates an editable plan, packages a read-only Claw, previews OpenClaw's exact add plan, requires its integrity digest, installs, and checks status in isolated state | Local CLI slice complete; native Builder page remains preview-only |
| Live host smoke | Linked plugin in an isolated, loopback-only OpenClaw v2026.9.4 Gateway; native page loaded six templates, suggested a template from a brief, and rendered a Claw preview with manual setup tasks | Local pass; repeat on a clean host before publication |
| Tests and CI | A fresh clone with frozen-lockfile pnpm 10.23 and Node 24.19 passed typecheck, 28 unit tests, build with a clean Git diff, plugin validation, template smoke, and the local install smoke. The source-history audit checked 130 reachable objects after the safety commits. | Local pass; hosted CI for the latest branch commit must be verified before publication |
| Source and license audit | All reachable blobs and commit emails scanned; tracked files and copied-module provenance reviewed; original MIT notice retained; no binary assets or credentials found | Technical review complete; final maintainer/legal judgment before visibility change |
| Dependency audit | Frozen-lockfile clean clone returned no known moderate-or-higher vulnerabilities | Local pass; rerun at publication time |
| Documentation | README now covers agent use, active config path, disposable state, partial-install recovery, and Gateway-dependent previewed removal; security policy, contribution guide, and migration boundary are present | Fresh-clone automated flow passed; manually follow the README on a clean host before publication |

The native template preview is not a promise that a generated agent will perform the old Blueprint's schedules, channel replies, or deliveries. Those settings are listed as manual setup tasks and are not silently installed. The local CLI path is separate: it creates only a new read-only, on-demand agent. Its isolated smoke test verifies installation and status, but does not run a model, connect an account or channel, or create a cron job.

Removal requires a running authenticated Gateway and has not been verified end-to-end on a live host. The README documents partial removal and does not promise a clean-host uninstall. If removal is offered as a supported product workflow later, add a live Gateway removal smoke before making that claim. The two TypeBox packages serve different existing surfaces (migrated Blueprint code and the OpenClaw feature contract). Packaging metadata such as `peerDependencies` and npm `files` remains out of scope while this repository is source-only and private; revisit before any package distribution.

## Source review scope

The fresh history contains only the small Builder source tree, documentation, lockfile, and verification workflow. The copied portable Blueprint modules and approval-posture logic are identified in `NOTICE.md`; the OpenClaw MIT copyright and permission notice remain in `LICENSE`. The history scan checked every reachable Git blob for listed secret and personal-path patterns and checked commit email metadata. Manual inspection found no tracked media, signing material, runtime config, personal briefs, or bundled dependency code. This is a technical redistribution review, not a legal opinion or a guarantee that pattern scanning catches every secret.

## Compatibility policy

Pin the tested OpenClaw host version and its Node runtime. When OpenClaw releases a new version, update the pin in `package.json`, rebuild the browser assets, rerun plugin validation and Claw validation, and perform one manual Gateway/UI smoke test before claiming support. Feature-plugin and Claw interfaces are experimental, so compatibility is demonstrated by tests rather than inferred from a semver range.
