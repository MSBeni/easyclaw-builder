import { describe, expect, it } from "vitest";
import { dailyBriefingBlueprint, supportResponderBlueprint } from "../blueprints/examples.js";
import type { AgentBlueprintBundle } from "../blueprints/schema.js";
import { compileBlueprintToClawPreview } from "./compile.js";

describe("compileBlueprintToClawPreview", () => {
  it("produces a portable package without a destination or credentials", () => {
    const preview = compileBlueprintToClawPreview(dailyBriefingBlueprint);

    expect(preview.files["package.json"]).toContain('"claw": "CLAW.md"');
    expect(preview.files["CLAW.md"]).toContain("schemaVersion: 1");
    expect(preview.files["CLAW.md"]).toContain("id: daily-briefing");
    expect(preview.files["CLAW.md"]).not.toContain("{{owner_target}}");
    expect(preview.files["CLAW.md"]).not.toContain("telegram");
    expect(preview.files["CLAW.md"]).not.toContain("0 9 * * 1-5");
    expect(preview.manualSetup.map((task) => task.kind)).toEqual(
      expect.arrayContaining(["variables", "bootstrap", "model", "packages", "tools", "schedule", "delivery"]),
    );
    expect(preview.installReady).toBe(false);
  });

  it("requires channel binding to be configured outside the Claw", () => {
    const preview = compileBlueprintToClawPreview(supportResponderBlueprint);
    expect(preview.manualSetup.map((task) => task.kind)).toContain("binding");
    expect(preview.files["CLAW.md"]).not.toContain("channel:");
  });

  it("rejects ids that the Claw schema cannot accept", () => {
    const bundle: AgentBlueprintBundle = structuredClone(dailyBriefingBlueprint);
    bundle.agent.agentId = "../../private";
    expect(() => compileBlueprintToClawPreview(bundle)).toThrow(/valid Claw id/);
  });
});
