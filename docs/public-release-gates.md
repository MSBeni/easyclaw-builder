# Public-release gates

The repository stays private until every required gate below has evidence. Publishing source is a separate operator decision; CI does not publish npm packages or container images.

| Gate | Current evidence | Status |
| --- | --- | --- |
| Fresh history and private remote | New history; noreply commit identity; old fork not copied | Complete |
| Runtime compatibility | Pinned OpenClaw v2026.9.4; plugin build/validate and isolated runtime load; two generated Claws validate and `claws dev` preview | Automated checks complete |
| Product workflow | Local on-demand CLI path creates an editable plan, packages a read-only Claw, previews OpenClaw's exact add plan, requires its integrity digest, installs, and checks status in isolated state | Local CLI slice complete; native Builder page remains preview-only |
| Live host smoke | Linked plugin in an isolated, loopback-only OpenClaw v2026.9.4 Gateway; native page loaded six templates, suggested a template from a brief, and rendered a Claw preview with manual setup tasks | Local pass; repeat on a clean host before publication |
| Tests and CI | Typecheck, 25 unit tests, host validation, local install smoke, dependency and source audits | Local and hosted CI pass on the feature branch |
| Source and license audit | All reachable blobs and commit emails scanned; tracked files and copied-module provenance reviewed; original MIT notice retained; no binary assets or credentials found | Technical review complete; final maintainer/legal judgment before visibility change |
| Dependency audit | Moderate-or-higher advisory check | Local pass; rerun before publication |
| Documentation | README, security policy, contribution guide, migration boundary, local CLI guide | Fresh private clone installed, built, tested, and completed isolated local install smoke |

The native template preview is not a promise that a generated agent will perform the old Blueprint's schedules, channel replies, or deliveries. Those settings are listed as manual setup tasks and are not silently installed. The local CLI path is separate: it creates only a new read-only, on-demand agent. Its isolated smoke test verifies installation and status, but does not run a model, connect an account or channel, or create a cron job.

## Source review scope

The fresh history contains only the small Builder source tree, documentation, lockfile, and verification workflow. The copied portable Blueprint modules and approval-posture logic are identified in `NOTICE.md`; the OpenClaw MIT copyright and permission notice remain in `LICENSE`. The history scan checked every reachable Git blob for listed secret and personal-path patterns and checked commit email metadata. Manual inspection found no tracked media, signing material, runtime config, personal briefs, or bundled dependency code. This is a technical redistribution review, not a legal opinion or a guarantee that pattern scanning catches every secret.

## Compatibility policy

Pin the tested OpenClaw host version and its Node runtime. When OpenClaw releases a new version, update the pin in `package.json`, rebuild the browser assets, rerun plugin validation and Claw validation, and perform one manual Gateway/UI smoke test before claiming support. Feature-plugin and Claw interfaces are experimental, so compatibility is demonstrated by tests rather than inferred from a semver range.
