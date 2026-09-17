import { describe, expect, it } from "vitest";
import { getCatalog, previewTemplate, proposeFromBrief } from "./handlers.js";

describe("feature handlers", () => {
  it("offers the six reviewed templates", () => {
    expect(getCatalog().templates).toHaveLength(6);
  });

  it("does not invent a template for an ambiguous brief", () => {
    expect(proposeFromBrief("research and support").matched).toBe(false);
  });

  it("keeps destinations and jobs out of the preview", () => {
    const preview = previewTemplate({ templateId: "daily-briefing", agentName: "Morning Brief" });
    expect(preview.clawMarkdown).not.toContain("telegram");
    expect(preview.clawMarkdown).not.toContain("0 9 * * 1-5");
    expect(preview.manualSetup.map((task) => task.kind)).toContain("delivery");
    expect(preview.installReady).toBe(false);
  });

  it("rejects HTML and Markdown control characters in an agent name", () => {
    expect(() => previewTemplate({ templateId: "daily-briefing", agentName: "Bad\n---" })).toThrow();
    expect(() => previewTemplate({ templateId: "daily-briefing", agentName: "<script>" })).toThrow();
  });
});
