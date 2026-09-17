import { stringify as stringifyYaml } from "yaml";

export type LocalAgentPlan = {
  schemaVersion: 1;
  agentId: string;
  agentName: string;
  brief: string;
  interaction: "on-demand";
  delivery: "local-session-only";
  tools: { allow: ["read"]; workspaceOnly: true };
};

const AGENT_ID = /^[a-z][a-z0-9_-]{0,63}$/;
const AGENT_NAME = /^[\p{L}\p{N} ._-]{1,80}$/u;

export function createLocalAgentPlan(input: { agentId: string; agentName: string; brief: string }): LocalAgentPlan {
  const plan: LocalAgentPlan = {
    schemaVersion: 1,
    agentId: input.agentId.trim(),
    agentName: input.agentName.trim(),
    brief: input.brief.trim(),
    interaction: "on-demand",
    delivery: "local-session-only",
    tools: { allow: ["read"], workspaceOnly: true },
  };
  return validateLocalAgentPlan(plan);
}

export function validateLocalAgentPlan(value: unknown): LocalAgentPlan {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Plan must be an object.");
  const plan = value as Record<string, unknown>;
  const keys = Object.keys(plan).sort();
  if (keys.join(",") !== "agentId,agentName,brief,delivery,interaction,schemaVersion,tools") {
    throw new Error("Plan has missing or unsupported fields.");
  }
  if (plan.schemaVersion !== 1 || plan.interaction !== "on-demand" || plan.delivery !== "local-session-only") {
    throw new Error("Only local, on-demand plans are supported.");
  }
  if (typeof plan.agentId !== "string" || !AGENT_ID.test(plan.agentId)) throw new Error("Invalid agent ID.");
  if (typeof plan.agentName !== "string" || !AGENT_NAME.test(plan.agentName) || plan.agentName.trim() !== plan.agentName) {
    throw new Error("Invalid agent name.");
  }
  if (typeof plan.brief !== "string" || !plan.brief.trim() || plan.brief.length > 4000 || plan.brief.trim() !== plan.brief) {
    throw new Error("Brief must be 1–4,000 characters without leading or trailing whitespace.");
  }
  const tools = plan.tools;
  if (!tools || typeof tools !== "object" || Array.isArray(tools)) throw new Error("Invalid tool policy.");
  const toolPolicy = tools as Record<string, unknown>;
  if (
    Object.keys(toolPolicy).sort().join(",") !== "allow,workspaceOnly" ||
    toolPolicy.workspaceOnly !== true ||
    !Array.isArray(toolPolicy.allow) ||
    toolPolicy.allow.length !== 1 ||
    toolPolicy.allow[0] !== "read"
  ) {
    throw new Error("Local plans may grant only workspace-confined read access.");
  }
  return plan as LocalAgentPlan;
}

export function compileLocalAgentPlan(plan: LocalAgentPlan): Record<"package.json" | "CLAW.md" | "profiles/openclaw.yml", string> {
  validateLocalAgentPlan(plan);
  const manifest = {
    schemaVersion: 1,
    agent: { id: plan.agentId, name: plan.agentName, description: "Local, on-demand agent created with EasyClaw Builder." },
    workspace: { bootstrapFiles: {} },
    packages: [],
    mcpServers: {},
    cronJobs: [],
  };
  const profile = {
    schemaVersion: 1,
    agent: { tools: { allow: ["read"], fs: { workspaceOnly: true } } },
  };
  const body = [
    `# ${plan.agentName}`,
    "",
    "## Operator-reviewed task",
    "",
    plan.brief,
    "",
    "Work only when the operator starts a local session. Return results in that session. Do not schedule work, send messages, use network tools, or change files. If the task requires any of those actions, explain the limitation and ask the operator to review a separate setup.",
    "",
  ].join("\n");
  return {
    "package.json": `${JSON.stringify({ name: `easyclaw-${plan.agentId}-claw`, version: "0.1.0", type: "module", openclaw: { claw: "CLAW.md" } }, null, 2)}\n`,
    "CLAW.md": `---\n${stringifyYaml(manifest, { lineWidth: 0 })}---\n\n${body}`,
    "profiles/openclaw.yml": stringifyYaml(profile, { lineWidth: 0 }),
  };
}
