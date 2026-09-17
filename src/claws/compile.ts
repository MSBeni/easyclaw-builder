import { stringify as stringifyYaml } from "yaml";
import type { AgentBlueprintBundle } from "../blueprints/schema.js";
import { assertValidAgentBlueprintBundle } from "../blueprints/validation.js";
import { listAgentBlueprintTemplateVariables } from "../blueprints/variables.js";

export type ManualSetupTask = {
  kind:
    | "binding"
    | "bootstrap"
    | "delivery"
    | "model"
    | "packages"
    | "schedule"
    | "tools"
    | "variables";
  detail: string;
};

export type ClawPackagePreview = {
  files: Readonly<Record<"package.json" | "CLAW.md", string>>;
  manualSetup: ManualSetupTask[];
  installReady: false;
};

const AGENT_ID_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;

function pushTask(tasks: ManualSetupTask[], kind: ManualSetupTask["kind"], detail: string): void {
  tasks.push({ kind, detail });
}

/**
 * Convert only portable identity and instruction fields. Host settings stay in
 * the review checklist so generation cannot silently configure the Gateway.
 */
export function compileBlueprintToClawPreview(bundle: AgentBlueprintBundle): ClawPackagePreview {
  assertValidAgentBlueprintBundle(bundle);

  const agentId = bundle.agent.agentId;
  if (!AGENT_ID_PATTERN.test(agentId)) {
    throw new Error(`Agent id is not a valid Claw id: ${agentId}`);
  }

  const manifest = {
    schemaVersion: 1,
    agent: {
      id: agentId,
      name: bundle.agent.name,
      description: bundle.manifest.summary,
    },
    workspace: { bootstrapFiles: {} },
    packages: [],
    mcpServers: {},
    cronJobs: [],
  };

  const body = [
    `# ${bundle.agent.name}`,
    "",
    bundle.manifest.summary.trim(),
    "",
    "Follow the operator's configured tool and approval policies. Ask before taking an external action unless the operator has explicitly approved it in the host runtime.",
    "",
  ].join("\n");

  const packageJson = {
    name: `easyclaw-${agentId}-claw`,
    version: bundle.manifest.version,
    type: "module",
    openclaw: { claw: "CLAW.md" },
  };

  const manualSetup: ManualSetupTask[] = [];
  const unresolved = listAgentBlueprintTemplateVariables(bundle);
  if (unresolved.length > 0) {
    pushTask(manualSetup, "variables", `Resolve blueprint placeholders: ${unresolved.join(", ")}.`);
  }
  if (bundle.workspace.bootstrapFiles?.length || bundle.workspace.template) {
    pushTask(
      manualSetup,
      "bootstrap",
      "Review and port the requested workspace files; legacy template paths are not package assets.",
    );
  }
  if (bundle.runtime.model) {
    pushTask(manualSetup, "model", "Select an available model in the OpenClaw host.");
  }
  if (bundle.runtime.skills?.length) {
    pushTask(
      manualSetup,
      "packages",
      "Resolve exact skill versions and provenance before adding Claw package requirements.",
    );
  }
  pushTask(
    manualSetup,
    "tools",
    "Review tool permissions and approvals in the host; legacy tool profiles are not copied into this preview.",
  );
  if (bundle.ingress?.bindings?.length) {
    pushTask(
      manualSetup,
      "binding",
      "Configure channel bindings in OpenClaw after reviewing the agent package.",
    );
  }
  if (bundle.automation?.schedules?.length) {
    pushTask(
      manualSetup,
      "schedule",
      "Review schedule, timezone, destination, and consent before enabling a cron job.",
    );
  }
  if (bundle.delivery?.target || bundle.delivery?.mode === "announce") {
    pushTask(
      manualSetup,
      "delivery",
      "Configure the outbound destination in the host; it is never embedded in this package.",
    );
  }

  return {
    files: {
      "package.json": `${JSON.stringify(packageJson, null, 2)}\n`,
      "CLAW.md": `---\n${stringifyYaml(manifest, { lineWidth: 0 })}---\n\n${body}`,
    },
    manualSetup,
    // OpenClaw's own preview and consent flow is still required.
    installReady: false,
  };
}
