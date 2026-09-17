# Migration boundary

This repository does not import the old EasyClaw Git history. The original fork remains private and is the reference for the Builder behavior. Source copied here has a fresh, reviewed history and keeps the OpenClaw MIT notice.

## Ported in the first slice

- `src/blueprints/`: portable Blueprint schema, validation, variable handling, catalog examples, and registry.
- `src/capabilities/approval-posture.ts`: brief approval-language classification.

These modules are not yet an installed OpenClaw feature plugin. The initial Claw compiler generates a local preview artifact from a Blueprint and reports host-specific settings it cannot carry. It intentionally does not install the Claw, write OpenClaw config, connect a channel, or enable jobs.

## Not copied

- The old OpenClaw Gateway, channels, authentication, apps, release workflows, tags, and Git history.
- Private briefs, local mockups, test outputs, local configuration, and credentials.
- The old Builder UI and runtime-bound planner/materializer modules. Their imports reach deeply into the old Gateway and require extraction or replacement against a pinned feature-plugin SDK.

## Next gates

1. Port requirement extraction and planning behind a host-independent contract, keeping unavailable capabilities and approval requirements explicit.
2. Complete Claw v1 mapping, including package/profile constraints and validation with a pinned OpenClaw host.
3. Implement the feature-plugin backend and native UI, then run the brief → preview → consent → package flow.
4. Run a source/license/secret review and a clean-clone CI gate before making the repository public.
