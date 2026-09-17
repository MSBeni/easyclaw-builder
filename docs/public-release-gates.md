# Public-release gates

The repository stays private until every required gate below has evidence. Publishing source is a separate operator decision; CI does not publish npm packages or container images.

| Gate | Current evidence | Status |
| --- | --- | --- |
| Fresh history and private remote | New history; noreply commit identity; old fork not copied | Complete |
| Runtime compatibility | Pinned OpenClaw v2026.9.4; plugin build/validate and isolated runtime load; two generated Claws validate and `claws dev` preview | Automated checks complete |
| Product workflow | Local on-demand CLI path creates an editable plan, packages a read-only Claw, previews OpenClaw's exact add plan, requires its integrity digest, installs, and checks status in isolated state | Local CLI slice implemented; native Builder page remains preview-only |
| Live host smoke | Linked plugin in an isolated, loopback-only OpenClaw v2026.9.4 Gateway; native page loaded six templates, suggested a template from a brief, and rendered a Claw preview with manual setup tasks | Local pass; repeat on a clean host before publication |
| Tests and CI | Typecheck, unit tests, host validation, local install smoke, dependency and source audits | Local checks pass; hosted CI must pass after this change |
| Source and license audit | Narrow copied module set, MIT notice, history pattern scan | Final human review pending |
| Dependency audit | Moderate-or-higher advisory check | Local pass; rerun before publication |
| Documentation | README, security policy, contribution guide, migration boundary, local CLI guide | Clean-clone guide test pending |

The native template preview is not a promise that a generated agent will perform the old Blueprint's schedules, channel replies, or deliveries. Those settings are listed as manual setup tasks and are not silently installed. The local CLI path is separate: it creates only a new read-only, on-demand agent. Its isolated smoke test verifies installation and status, but does not run a model, connect an account or channel, or create a cron job.

## Compatibility policy

Pin the tested OpenClaw host version and its Node runtime. When OpenClaw releases a new version, update the pin in `package.json`, rebuild the browser assets, rerun plugin validation and Claw validation, and perform one manual Gateway/UI smoke test before claiming support. Feature-plugin and Claw interfaces are experimental, so compatibility is demonstrated by tests rather than inferred from a semver range.
