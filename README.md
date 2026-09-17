# EasyClaw Builder

EasyClaw Builder helps turn a plain-language brief into a reviewed [OpenClaw Claw](https://docs.openclaw.ai/cli/claws). It currently has one installable path for a local, on-demand agent and a separate experimental template-preview page.

This is an early, private development repository. It is **not** a fork or replacement for the OpenClaw Gateway. OpenClaw owns the runtime, channel connections, credentials, and agent lifecycle. EasyClaw owns the planning and package-generation experience.

## What works now

The source CLI can create an editable plan from an operator brief, compile a Claw with workspace-confined read access, show OpenClaw's exact installation plan, and install it only when the operator supplies the reviewed plan-integrity digest. It verifies the resulting Claw status. This path creates a new agent that responds when you start a local session. It does not choose a model, connect an account or channel, schedule a job, or send a message. “Local” describes the Gateway and agent workflow, **not** an offline-model guarantee; a configured model provider may process prompts remotely.

The native [feature-plugin](https://docs.openclaw.ai/plugins/feature-plugins) page suggests one of six Blueprint templates and displays an in-memory package preview with missing setup tasks. That page is **preview-only** and is not yet connected to the local install path. Its template packages remain incomplete and report `installReady: false`.

Claws and feature plugins are experimental OpenClaw interfaces. The supported development target is pinned to OpenClaw v2026.9.4; do not substitute `latest` without rerunning compatibility checks.

## Try the local agent flow from source

Use Node.js 24.16+ (or 26.1+) and pnpm 10.23.0. Installing this repository's dependencies provides the pinned OpenClaw CLI; your OpenClaw configuration must also be compatible with that version. You need a configured model to **run** the installed agent; the installation smoke test itself does not call a model. Keep your plan and generated package outside the repository because the brief becomes part of the Claw's prompt.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm local plan --id document-reviewer --name "Document Reviewer" \
  --brief "Summarize the local documents I provide and cite file names." \
  --out ../document-reviewer-plan.json
```

Open and edit the plan file. Its on-demand, session-only delivery and read-only tool policy are fixed in this first version; changing them is rejected. Then compile and review the package:

```sh
pnpm local package ../document-reviewer-plan.json --out ../document-reviewer-claw
pnpm local preview ../document-reviewer-claw \
  --workspace ../document-reviewer-workspace
```

Read the entire preview, including blockers, permissions, destination workspace, and `planIntegrity`. Installation requires that exact digest from the preview. Replace the example digest below with the one you just reviewed, and use the **same** package and workspace paths:

```sh
pnpm local install ../document-reviewer-claw \
  --workspace ../document-reviewer-workspace \
  --plan-integrity sha256:REPLACE_WITH_THE_REVIEWED_DIGEST
```

If the package or host state changed, installation stops and requires a fresh preview. The CLI does not overwrite an existing plan or package directory. Installing a Claw changes your local OpenClaw agent configuration and creates a workspace; it does not start an agent turn. Use OpenClaw's agent interface to talk to the new agent after confirming a model is configured. Do not put credentials or private data in the brief unless you intend them to be stored in the generated Claw and agent workspace.

## Development

Run the checks before proposing a release:

```sh
pnpm check
pnpm test
pnpm build
pnpm validate
pnpm smoke:claw
pnpm smoke:local
pnpm audit:source
pnpm audit --audit-level moderate
```

`pnpm smoke:claw` validates two template previews without installing them. `pnpm smoke:local` creates disposable state, checks that a changed package is rejected after preview, and verifies an exact-consent installation. It never uses your normal OpenClaw state or calls a model. Use a disposable Gateway for interactive plugin testing; installing a feature plugin grants trusted code access to the Gateway, and custom native UI requires the Labs toggle described in the OpenClaw feature-plugin documentation. No package, container image, or release workflow is published from this repository yet.

## Security and attribution

Do not put credentials, personal briefs, channel destinations, or private configuration into issues, examples, fixtures, or generated packages. Report security issues privately as described in [SECURITY.md](SECURITY.md). See [NOTICE.md](NOTICE.md) for provenance of migrated code.

## Status

This repository is not ready to present as a complete public Builder. The narrow local CLI flow, clean-clone install smoke, and hosted CI pass, but the native Builder page is still preview-only. The maintainer should make the final license and support-scope decision before any visibility change. See [public-release gates](docs/public-release-gates.md).
