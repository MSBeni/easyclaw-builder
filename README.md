# EasyClaw Builder

EasyClaw Builder turns a plain-language agent brief into a reviewable template proposal and a portable [OpenClaw Claw](https://docs.openclaw.ai/cli/claws) package preview.

This is an early, private development repository. It is **not** a fork or replacement for the OpenClaw Gateway. OpenClaw owns the runtime, channel connections, credentials, and agent lifecycle. EasyClaw owns the planning and package-generation experience.

## Current scope and limits

- Migrate and adapt the reusable Blueprint catalog and validation logic from the original EasyClaw fork.
- Preview what a proposed agent would do and identify setup tasks that require an operator.
- Generate a local Claw package without credentials, channel bindings, or private runtime state.
- Validate the plugin and generated packages against OpenClaw v2026.9.4.

The feature branch now includes a conservative brief-to-template candidate matcher, a native [feature-plugin](https://docs.openclaw.ai/plugins/feature-plugins) page, and an in-memory Blueprint-to-Claw compiler. The page lets an operator choose a template and agent name, review missing setup work, and inspect the two generated package files. It does **not** install an agent, run a model-backed planner, connect accounts, or configure channels and schedules. A generated preview always reports `installReady: false` because the old templates still need host-specific setup.

Claws and feature plugins are currently experimental OpenClaw interfaces. A generated package must be reviewed and installed by an operator; this project must not silently enable automation or connect accounts.

## Development

Requires Node.js 24.16+ (or 26.1+) and pnpm 10.23.0. The development host is pinned to OpenClaw v2026.9.4; do not substitute `latest` without rerunning compatibility checks.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm validate
pnpm smoke:claw
pnpm audit:source
pnpm audit --audit-level moderate
```

`pnpm smoke:claw` creates disposable packages for two templates and runs OpenClaw's `claws validate` and non-mutating `claws dev` preview against them. It does not install either package. Use a disposable Gateway for interactive plugin testing; installing a feature plugin grants trusted code access to the Gateway, and custom native UI requires the Labs toggle described in the OpenClaw feature-plugin documentation. No package, container image, or release workflow is published from this repository yet.

## Security and attribution

Do not put credentials, personal briefs, channel destinations, or private configuration into issues, examples, fixtures, or generated packages. Report security issues privately as described in [SECURITY.md](SECURITY.md). See [NOTICE.md](NOTICE.md) for provenance of migrated code.

## Status

This repository is not ready for public use. Automated SDK and package validation pass, but a live Gateway/UI smoke test, a complete setup and consent flow, and a final source/license review remain. See [public-release gates](docs/public-release-gates.md).
