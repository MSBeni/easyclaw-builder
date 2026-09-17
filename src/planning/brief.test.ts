import { describe, expect, it } from "vitest";
import { proposeTemplateFromBrief } from "./brief.js";

describe("proposeTemplateFromBrief", () => {
  it("proposes a daily briefing without configuring delivery or schedule", () => {
    const result = proposeTemplateFromBrief("Send me a daily briefing, but ask every time.");
    expect(result?.templateId).toBe("daily-briefing");
    expect(result?.approvalPosture).toBe("ask_every_time");
    expect(result?.confidence).toBe("low");
    expect(result?.questions).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/channel and destination/),
        expect.stringMatching(/schedule and timezone/),
      ]),
    );
  });

  it("refuses ambiguous briefs rather than making an unsafe choice", () => {
    expect(proposeTemplateFromBrief("Build a support and research assistant")).toBeNull();
    expect(proposeTemplateFromBrief("Do everything for me")).toBeNull();
  });
});
