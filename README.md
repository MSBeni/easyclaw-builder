# EasyClaw Builder

EasyClaw Builder helps turn a plain-language brief into a reviewed [OpenClaw Claw](https://docs.openclaw.ai/cli/claws). It currently has one installable path for a local, on-demand agent and a separate experimental template-preview page.

This is an experimental source project, not a fork or replacement for the OpenClaw Gateway. OpenClaw owns the runtime, channel connections, credentials, and agent lifecycle. EasyClaw owns the planning and package-generation experience.

## What works now

The source CLI can create an editable plan from an operator brief, compile a Claw with workspace-confined read access, show OpenClaw's exact installation plan, and install it only when the operator supplies the reviewed plan-integrity digest. It verifies the resulting Claw status. This path creates a new agent that responds when you start a local session. It does not choose a model, connect an account or channel, schedule a job, or send a message. “Local” describes the Gateway and agent workflow, **not** an offline-model guarantee; a configured model provider may process prompts remotely.

The native [feature-plugin](https://docs.openclaw.ai/plugins/feature-plugins) page suggests one of six Blueprint templates and displays an in-memory package preview with missing setup tasks. That page is **preview-only** and is not yet connected to the local install path. Its template packages remain incomplete and report `installReady: false`.

Claws and feature plugins are experimental OpenClaw interfaces. The supported development target is pinned to OpenClaw v2026.9.4; do not substitute `latest` without rerunning compatibility checks.

## Try the local agent flow from source

Use Node.js 24.16+ (or 26.1+) and pnpm 10.23.0. Installing this repository's dependencies provides the pinned OpenClaw CLI; your OpenClaw configuration must also be compatible with that version. You need a configured model to **run** the installed agent; the installation smoke test itself does not call a model. Keep your plan and generated package outside the repository because the brief becomes part of the Claw's prompt.

For a disposable trial, use a separate shell and run this **before** the commands below. Keep that shell and its environment for every Builder and pinned OpenClaw command in the walkthrough. A state override by itself does not isolate the config when `OPENCLAW_CONFIG_PATH` is exported.

```sh
unset OPENCLAW_CONFIG_PATH OPENCLAW_HOME OPENCLAW_PROFILE
export OPENCLAW_STATE_DIR="$(mktemp -d)"
```

For a real installation, use your intended OpenClaw state instead. Either way, check the active config path printed by the CLI before consenting.

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

Read the entire preview, including blockers, actions, permissions, destination workspace, and `planIntegrity`. The CLI prints the pinned OpenClaw version, **active config file**, and any state-directory override to stderr. The config file may belong to another globally installed OpenClaw version. Installation requires the exact digest from the preview. Replace the example digest below with the one you just reviewed, and use the **same** package and workspace paths:

```sh
pnpm local install ../document-reviewer-claw \
  --workspace ../document-reviewer-workspace \
  --plan-integrity sha256:REPLACE_WITH_THE_REVIEWED_DIGEST
```

If the package or host state changed, installation stops and requires a fresh preview. The CLI refuses plan and package outputs inside the source repository and does not overwrite existing outputs. The workspace must be new unless OpenClaw is resuming the exact partial installation. Installing a Claw changes your local OpenClaw agent configuration and creates a workspace; it does not start an agent turn. A failed install can leave partial state: inspect the reported status, fix the cause, and retry with the same package, workspace, and reviewed digest only if the preview still matches. Do not put credentials or private data in the brief unless you intend them to be stored in the generated Claw and agent workspace.

The new workspace initially contains the agent's `SOUL.md`, but no documents. Put files you want summarized inside that workspace, then run one local, undelivered turn with the pinned CLI and a configured model:

```sh
pnpm exec openclaw agent --local --agent document-reviewer \
  --message "Summarize the files in my workspace and cite their file names."
```

Experimental Claw management commands require the feature flag. Removal also requires a **running, authenticated OpenClaw Gateway**; the dry-run alone does not prove removal will succeed. Preview removal first; review its `planIntegrity` and what it would delete before consenting. Removal may delete the agent workspace, so copy out any files you want to keep first. Do not paste the installation digest into the removal command; use the removal preview's digest.

```sh
OPENCLAW_EXPERIMENTAL_CLAWS=1 pnpm exec openclaw claws status document-reviewer --json
OPENCLAW_EXPERIMENTAL_CLAWS=1 pnpm exec openclaw claws remove document-reviewer --dry-run --json
OPENCLAW_EXPERIMENTAL_CLAWS=1 pnpm exec openclaw claws remove document-reviewer \
  --yes --plan-integrity sha256:REPLACE_WITH_THE_REMOVAL_DIGEST
```

Check the removal result and `claws status` afterward. If removal reports `partial` or `monitor_cleanup_failed`, **do not assume the agent or workspace was removed**. Start or repair the authenticated Gateway, inspect status, then obtain a fresh removal dry-run and review its new digest before retrying. Successful removal was verified with an isolated, authenticated loopback Gateway on the pinned OpenClaw version; other host configurations still need their own status check.

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

`pnpm smoke:claw` validates two template previews without installing them. `pnpm smoke:local` creates disposable state, checks that a changed package is rejected after preview, and verifies an exact-consent installation. Both scripts remove config-path, home, and profile overrides from child environments and verify the pinned CLI's config path is under their temporary state directory before proceeding. They do not use your normal OpenClaw config or call a model. Use a disposable Gateway for interactive plugin testing; installing a feature plugin grants trusted code access to the Gateway, and custom native UI requires the Labs toggle described in the OpenClaw feature-plugin documentation. No package, container image, or release workflow is published from this repository yet.

## Security and attribution

Do not put credentials, personal briefs, channel destinations, or private configuration into issues, examples, fixtures, or generated packages. Report security issues privately as described in [SECURITY.md](SECURITY.md). See [NOTICE.md](NOTICE.md) for provenance of migrated code.

## Status

This repository is not a complete public Builder. The narrow local CLI flow is experimental, and the native Builder page is still preview-only. Run the release checks and make the final license and support-scope decision before any visibility change. See [public-release gates](docs/public-release-gates.md).
