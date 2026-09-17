# Public-release gates

The repository stays private until every required gate below has evidence. Publishing source is a separate operator decision; CI does not publish npm packages or container images.

| Gate | Current evidence | Status |
| --- | --- | --- |
| Fresh history and private remote | New history; noreply commit identity; old fork not copied | Complete |
| Runtime compatibility | Pinned OpenClaw v2026.9.4; plugin build/validate and isolated runtime load; two generated Claws validate and `claws dev` preview | Automated checks complete |
| Product workflow | Brief suggestion, template selection, in-memory Claw preview | Incomplete: no complete consent/setup flow |
| Live host smoke | Install and exercise native UI in a disposable Gateway | Not run |
| Tests and CI | Typecheck, unit tests, host validation, audit workflow added | Local pass; hosted CI pending |
| Source and license audit | Narrow copied module set, MIT notice, history pattern scan | Final human review pending |
| Dependency audit | Moderate-or-higher advisory check | Local pass; rerun before publication |
| Documentation | README, security policy, contribution guide, migration boundary | Needs tested installation guide |

The existing preview is not a promise that a generated agent will perform the old Blueprint's schedules, channel replies, or deliveries. Those settings are listed as manual setup tasks and are not silently installed.

## Compatibility policy

Pin the tested OpenClaw host version and its Node runtime. When OpenClaw releases a new version, update the pin in `package.json`, rebuild the browser assets, rerun plugin validation and Claw validation, and perform one manual Gateway/UI smoke test before claiming support. Feature-plugin and Claw interfaces are experimental, so compatibility is demonstrated by tests rather than inferred from a semver range.
