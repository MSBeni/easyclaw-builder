import { describe, expect, it } from "vitest";
import { Check } from "typebox/value";
import { contract } from "./contract.js";
import { getCatalog, previewTemplate, proposeFromBrief } from "./handlers.js";

describe("feature handlers", () => {
  it("offers the six reviewed templates", () => {
    const catalog = getCatalog();
    expect(catalog.templates).toHaveLength(6);
    expect(Check(contract.operations.catalog.output, catalog)).toBe(true);
  });

  it("does not invent a template for an ambiguous brief", () => {
    const proposal = proposeFromBrief("research and support");
    expect(proposal.matched).toBe(false);
    expect(Check(contract.operations.propose.output, proposal)).toBe(true);
  });

  it("omits unknown approval posture from the JSON feature response", () => {
    const proposal = proposeFromBrief("Send a daily briefing");
    expect(proposal.matched).toBe(true);
    expect(proposal).not.toHaveProperty("approvalPosture");
    expect(Check(contract.operations.propose.output, proposal)).toBe(true);
    expect(JSON.parse(JSON.stringify(proposal))).toEqual(proposal);
  });

  it("keeps destinations and jobs out of the preview", () => {
    const preview = previewTemplate({ templateId: "daily-briefing", agentName: "Morning Brief" });
    expect(preview.clawMarkdown).not.toContain("telegram");
    expect(preview.clawMarkdown).not.toContain("0 9 * * 1-5");
    expect(preview.manualSetup.map((task) => task.kind)).toContain("delivery");
    expect(preview.installReady).toBe(false);
    expect(Check(contract.operations.preview.output, preview)).toBe(true);
  });

  it("rejects HTML and Markdown control characters in an agent name", () => {
    expect(() => previewTemplate({ templateId: "daily-briefing", agentName: "Bad\n---" })).toThrow();
    expect(() => previewTemplate({ templateId: "daily-briefing", agentName: "<script>" })).toThrow();
  });
});
