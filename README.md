# EasyClaw Builder

EasyClaw Builder turns a plain-language agent brief into a reviewable plan and, after explicit approval, a portable [OpenClaw Claw](https://docs.openclaw.ai/cli/claws) package.

This is an early, private development repository. It is **not** a fork or replacement for the OpenClaw Gateway. OpenClaw owns the runtime, channel connections, credentials, and agent lifecycle. EasyClaw owns the planning and package-generation experience.

## Current scope

- Migrate and adapt the reusable Blueprint catalog and validation logic from the original EasyClaw fork.
- Preview what a proposed agent would do and identify setup tasks that require an operator.
- Generate a local Claw package without credentials, channel bindings, or private runtime state.
- Validate the package against a pinned OpenClaw release before any install or public release.

Claws and feature plugins are currently experimental OpenClaw interfaces. A generated package must be reviewed and installed by an operator; this project must not silently enable automation or connect accounts.

## Development

Requires Node.js 22+ and pnpm 10.23.0.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
```

No package, container image, or release workflow is published from this repository yet.

## Security and attribution

Do not put credentials, personal briefs, channel destinations, or private configuration into issues, examples, fixtures, or generated packages. Report security issues privately as described in [SECURITY.md](SECURITY.md). See [NOTICE.md](NOTICE.md) for provenance of migrated code.

## Status

This repository is not ready for public use. The first release gate is a tested brief → preview → Claw package flow on a pinned OpenClaw version, followed by a source, dependency, license, and secret review.
