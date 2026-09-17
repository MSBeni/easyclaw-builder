import { describe, expect, it } from "vitest";
import { compileLocalAgentPlan, createLocalAgentPlan, validateLocalAgentPlan } from "./plan.js";

const input = {
  agentId: "document-reviewer",
  agentName: "Document Reviewer",
  brief: "Summarize the local documents I provide and cite the relevant file names.",
};

describe("local agent plan", () => {
  it("produces a reviewable, read-only on-demand plan", () => {
    const plan = createLocalAgentPlan(input);
    expect(plan.interaction).toBe("on-demand");
    expect(plan.delivery).toBe("local-session-only");
    expect(plan.tools).toEqual({ allow: ["read"], workspaceOnly: true });
  });

  it("rejects changes that broaden capability", () => {
    const plan = createLocalAgentPlan(input);
    expect(() => validateLocalAgentPlan({ ...plan, tools: { allow: ["read", "exec"], workspaceOnly: true } })).toThrow(/read access/);
    expect(() => validateLocalAgentPlan({ ...plan, interaction: "scheduled" })).toThrow(/on-demand/);
    expect(() => validateLocalAgentPlan({ ...plan, destination: "chat" })).toThrow(/unsupported fields/);
  });

  it("rejects invalid identifiers and empty briefs", () => {
    expect(() => createLocalAgentPlan({ ...input, agentId: "../../secret" })).toThrow(/agent ID/);
    expect(() => createLocalAgentPlan({ ...input, brief: " " })).toThrow(/Brief/);
  });

  it("compiles a minimal Claw without delivery or automation", () => {
    const files = compileLocalAgentPlan(createLocalAgentPlan(input));
    expect(files["CLAW.md"]).toContain(input.brief);
    expect(files["CLAW.md"]).toContain("cronJobs: []");
    expect(files["CLAW.md"]).not.toContain("channel:");
    expect(files["profiles/openclaw.yml"]).toContain("workspaceOnly: true");
    expect(files["profiles/openclaw.yml"]).toContain("- read");
  });
});
