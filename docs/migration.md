# Migration boundary

This repository does not import the old EasyClaw Git history. The original fork remains private and is the reference for the Builder behavior. Source copied here has a fresh, reviewed history and keeps the OpenClaw MIT notice.

## Ported in the first slice

- `src/blueprints/`: portable Blueprint schema, validation, variable handling, catalog examples, and registry.
- `src/capabilities/approval-posture.ts`: brief approval-language classification.

The v2026.9.4 feature-plugin backend and native page now expose a template proposal and Claw preview. The compiler reports host-specific settings it cannot carry. It intentionally does not install the Claw, write OpenClaw config, connect a channel, or enable jobs.

## Not copied

- The old OpenClaw Gateway, channels, authentication, apps, release workflows, tags, and Git history.
- Private briefs, local mockups, test outputs, local configuration, and credentials.
- The old Builder UI and runtime-bound planner/materializer modules. Their imports reach deeply into the old Gateway and require extraction or replacement against the pinned feature-plugin SDK. The new native page is a small, independent first slice, not a copy of the old UI.

## Next gates

1. Port requirement extraction and planning behind a host-independent contract, keeping unavailable capabilities and approval requirements explicit.
2. Complete Claw v1 mapping, including package/profile constraints. The current minimal packages pass `claws validate` on v2026.9.4, but they omit runtime setup by design.
3. Complete the preview → consent → package flow and run a live disposable-Gateway/UI smoke test.
4. Run a final source/license/secret review and a clean-clone CI gate before making the repository public.
